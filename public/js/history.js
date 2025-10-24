// history.js（置き換え）

document.addEventListener("DOMContentLoaded", async () => {
  const genreMap = {
    historic: '歴史的建造物',
    nature: '自然',
    city: '都市景観',
    culture: '文化的名所'
  };

  const ul = document.getElementById("history-ul");
  if (!ul) return;

  // ========== ユーザー情報 ==========
  let userUuid = null;
  try {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (!res.ok) throw new Error('ユーザー情報取得失敗');
    const user = await res.json();
    userUuid = user.uuid;
  } catch (err) {
    ul.innerHTML = "<li>ログイン情報が取得できませんでした。</li>";
    console.error("ユーザーUUID取得失敗:", err);
    return;
  }

  // ========== ユーザー位置 ==========
  let userLat = null;
  let userLng = null;
  try {
    const locRes = await fetch('/api/has_location', { credentials: 'include' });
    if (locRes.ok) {
      const locData = await locRes.json();
      if (locData.hasLocation) {
        userLat = Number(locData.lat);
        userLng = Number(locData.lng);
      }
    }
  } catch (err) {
    console.warn("住所取得に失敗:", err);
  }

  // ========== 履歴ロード ==========
  try {
    const res = await fetch(`/api/history/${encodeURIComponent(userUuid)}`);
    const data = await res.json();

    if (!data.success || !Array.isArray(data.history) || data.history.length === 0) {
      ul.innerHTML = "<li>履歴がありません。</li>";
      return;
    }

    data.history.forEach((entry, idx) => {
      const lat = num(entry.lat);
      const lng = num(entry.lng);
      const region = getRegionFromLatLng(lat, lng);
      const genreDisplay = genreMap[entry.genre] || '不明';

      const li = document.createElement("li");
      const title = esc(entry.title || '（無題）');
      const desc  = esc(entry.description || '');
      const img   = entry.image_path || '';
      const answeredAt = formatDate(entry.answered_at);

      let travelText = "";
      if (isNum(userLat) && isNum(userLng) && isNum(lat) && isNum(lng)) {
        const dist = getDistanceKm(userLat, userLng, lat, lng);
        const hours = (dist / 60).toFixed(1);
        travelText = `
          <div class="muted mt-6">
            🚗 自宅から <strong>${dist.toFixed(1)}km</strong>、約 <strong>${hours}時間</strong>
          </div>
        `;
      }

      const hotelWrapId = `hotel-wrap-${idx}`;
      const regionText = esc(region);
      const genreText  = esc(genreDisplay);

      li.innerHTML = `
        <div class="entry-head">
          <div class="entry-meta">
            <div class="title"><strong>${title}</strong>（スコア: ${esc(String(entry.score ?? '—'))}）</div>
            <div class="sub">
              <small>${answeredAt}</small>　
              🗾 ${regionText}　|　📚 ${genreText}
            </div>
          </div>
          <div class="entry-actions">
            <a class="btn" href="${buildGoogleMapsLink(lat, lng)}" target="_blank" rel="noopener">🗺️ マップ</a>
            <button class="btn primary" data-hotel-btn data-lat="${lat}" data-lng="${lng}" data-target="${hotelWrapId}">
              🏨 付近のホテル
            </button>
          </div>
        </div>

        <div class="img-wrap">
          ${img ? `<img src="${img}" alt="${title}">` : ""}
        </div>

        <div class="entry-desc">${desc}</div>
        ${travelText}

        <div id="${hotelWrapId}" class="hotel-wrap" style="display:none;">
          ${skeletonHTML()}
        </div>

        <hr class="divider" />
      `;
      ul.appendChild(li);
    });

    // 付近のホテル（イベント委譲）
    ul.addEventListener('click', onHotelButtonClick);
  } catch (err) {
    ul.innerHTML = "<li>履歴の読み込みに失敗しました。</li>";
    console.error(err);
  }
});

/* ========= イベントハンドラ ========= */

const hotelCache = new Map(); // key: `${lat},${lng}` => { meta, hotels, ts }
const CACHE_TTL_MS = 5 * 60 * 1000; // 5分

async function onHotelButtonClick(e) {
  // リトライ
  if (e.target.matches('[data-retry]')) {
    const tgt = document.getElementById(e.target.getAttribute('data-target'));
    if (tgt) {
      tgt.innerHTML = skeletonHTML();
      tgt.dataset.loaded = '';
      await renderHotelsRich(
        tgt,
        num(e.target.getAttribute('data-lat')),
        num(e.target.getAttribute('data-lng'))
      );
      tgt.dataset.loaded = '1';
    }
    return;
  }

  const btn = e.target.closest('[data-hotel-btn]');
  if (!btn) return;

  const targetId = btn.getAttribute('data-target');
  const wrap = document.getElementById(targetId);
  const lat = num(btn.getAttribute('data-lat'));
  const lng = num(btn.getAttribute('data-lng'));
  if (!wrap) return;

  const open = (wrap.style.display === 'none');
  wrap.style.display = open ? 'block' : 'none';
  btn.textContent = open ? '🏨 ホテルを閉じる' : '🏨 付近のホテル';

  if (open && !wrap.dataset.loaded) {
    try {
      await renderHotelsRich(wrap, lat, lng);
      wrap.dataset.loaded = '1';
    } catch (err) {
      console.warn('ホテル取得失敗:', err);
      wrap.innerHTML = `
        <div class="card card-wide">
          <div class="hotel-header">
            <div class="title">🏨 付近のホテル</div>
            <div class="chip error">エラー</div>
          </div>
          <div class="muted">ホテル情報の取得に失敗しました。</div>
          <button class="btn mt-8" data-retry data-lat="${lat}" data-lng="${lng}" data-target="${targetId}">再試行</button>
        </div>
      `;
    }
  }
}

/* ========= リッチUIホテル表示 ========= */

async function renderHotelsRich(containerEl, spotLat, spotLng) {
  const key = `${fix6(spotLat)},${fix6(spotLng)}`;

  let payload = hotelCache.get(key);
  const now = Date.now();
  if (!payload || (now - (payload.ts || 0)) > CACHE_TTL_MS) {
    const res = await fetch(`/api/hotels_nearby_rakuten?lat=${spotLat}&lng=${spotLng}`);
    const data = await res.json();
    if (!data.success) throw new Error('API failed');
    payload = {
      ts: now,
      meta: { radiusKm: data.radiusKm, count: data.count },
      hotels: Array.isArray(data.hotels) ? data.hotels : []
    };
    hotelCache.set(key, payload);
  }

  const hotels = payload.hotels.map(h => ({
    ...h,
    __lat: num(h.lat),
    __lng: num(h.lng),
    __price: (h.minCharge != null) ? Number(h.minCharge) : null,
    __rate: (h.reviewAverage != null) ? Number(h.reviewAverage) : null,
    __dist: (isNum(h.lat) && isNum(h.lng))
      ? getDistanceKm(spotLat, spotLng, Number(h.lat), Number(h.lng)) : null
  }));

  const state = {
    sort: 'priceAsc',
    q: '',
    maxPrice: '',
    minRate: '0',
    page: 1,
    pageSize: 6
  };

  containerEl.innerHTML = `
    <div class="card card-wide">
      <div class="hotel-header">
        <div class="title">🏨 付近のホテル</div>
        <div class="chips">
          <div class="chip">半径: ${esc(String(payload.meta.radiusKm ?? '—'))} km</div>
          <div class="chip" id="chip-count">件数: ${esc(String(payload.meta.count ?? hotels.length))}</div>
        </div>
      </div>

      <div class="hotel-controls">
        <input type="text" id="q" placeholder="ホテル名で検索" />
        <select id="sort">
          <option value="priceAsc">価格が安い順</option>
          <option value="priceDesc">価格が高い順</option>
          <option value="rateDesc">評価が高い順</option>
          <option value="distanceAsc">観光地から近い順</option>
          <option value="nameAsc">名前順</option>
        </select>
        <input type="number" id="maxPrice" inputmode="numeric" min="0" placeholder="価格上限(円)" />
        <select id="minRate">
          <option value="0">最低評価: 指定なし</option>
          <option value="3.0">3.0+</option>
          <option value="3.5">3.5+</option>
          <option value="4.0">4.0+</option>
          <option value="4.5">4.5+</option>
        </select>
      </div>

      <div id="hotel-list" class="hotel-grid"></div>

      <div class="pager">
        <button class="btn" id="prev">← 前へ</button>
        <div id="page-info" class="muted"></div>
        <button class="btn" id="next">次へ →</button>
      </div>
    </div>
  `;

  const refs = {
    q: containerEl.querySelector('#q'),
    sort: containerEl.querySelector('#sort'),
    maxPrice: containerEl.querySelector('#maxPrice'),
    minRate: containerEl.querySelector('#minRate'),
    list: containerEl.querySelector('#hotel-list'),
    prev: containerEl.querySelector('#prev'),
    next: containerEl.querySelector('#next'),
    pageInfo: containerEl.querySelector('#page-info'),
    chipCount: containerEl.querySelector('#chip-count')
  };

  const debounce = (fn, ms = 250) => {
    let t = null;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  function applyFilters() {
    let arr = hotels.slice();

    if (state.q.trim() !== '') {
      const q = state.q.trim().toLowerCase();
      arr = arr.filter(h => (h.name || '').toLowerCase().includes(q));
    }
    if (state.maxPrice !== '' && !Number.isNaN(Number(state.maxPrice))) {
      const lim = Number(state.maxPrice);
      arr = arr.filter(h => (h.__price == null) ? true : h.__price <= lim);
    }
    if (!Number.isNaN(Number(state.minRate)) && Number(state.minRate) > 0) {
      const lim = Number(state.minRate);
      arr = arr.filter(h => (h.__rate == null) ? true : h.__rate >= lim);
    }

    switch (state.sort) {
      case 'priceAsc':    arr.sort((a,b) => (a.__price ?? Infinity) - (b.__price ?? Infinity)); break;
      case 'priceDesc':   arr.sort((a,b) => (b.__price ?? -Infinity) - (a.__price ?? -Infinity)); break;
      case 'rateDesc':    arr.sort((a,b) => (b.__rate ?? -Infinity) - (a.__rate ?? -Infinity)); break;
      case 'distanceAsc': arr.sort((a,b) => (a.__dist ?? Infinity) - (b.__dist ?? Infinity)); break;
      case 'nameAsc':     arr.sort((a,b) => (a.name || '').localeCompare(b.name || '')); break;
    }
    return arr;
  }

  function renderPage() {
    const filtered = applyFilters();

    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / state.pageSize));
    state.page = Math.min(Math.max(1, state.page), pages);

    refs.chipCount.textContent = `件数: ${total}`;

    const start = (state.page - 1) * state.pageSize;
    const slice = filtered.slice(start, start + state.pageSize);

    refs.list.innerHTML = '';
    if (slice.length === 0) {
      refs.list.innerHTML = `<div class="muted">条件に一致するホテルがありません。</div>`;
    } else {
      for (const h of slice) refs.list.appendChild(renderHotelCard(h));
    }

    refs.pageInfo.textContent = `${state.page} / ${pages} ページ`;
    refs.prev.disabled = (state.page <= 1);
    refs.next.disabled = (state.page >= pages);
  }

  refs.q.addEventListener('input', debounce(() => { state.q = refs.q.value; state.page = 1; renderPage(); }, 250));
  refs.sort.addEventListener('change', () => { state.sort = refs.sort.value; renderPage(); });
  refs.maxPrice.addEventListener('input', debounce(() => { state.maxPrice = refs.maxPrice.value; state.page = 1; renderPage(); }, 200));
  refs.minRate.addEventListener('change', () => { state.minRate = refs.minRate.value; state.page = 1; renderPage(); });
  refs.prev.addEventListener('click', () => { state.page--; renderPage(); });
  refs.next.addEventListener('click', () => { state.page++; renderPage(); });

  renderPage();
}

/* ========= ビュー補助 ========= */

function renderHotelCard(h) {
  const card = document.createElement('div');
  card.className = 'card hotel-card';

  const priceText = (h.__price != null) ? `¥${Number(h.__price).toLocaleString()}` : '—';
  const rateText  = (h.__rate != null) ? `${h.__rate.toFixed(1)} / 5` : '—';
  const distText  = (h.__dist != null) ? `${h.__dist.toFixed(1)} km` : '—';
  const nameText  = esc(h.name || '名称未設定');
  const addrText  = h.address ? esc(h.address) : '';

  const mapLink = (Number.isFinite(h.__lat) && Number.isFinite(h.__lng))
    ? buildGoogleMapsLink(h.__lat, h.__lng)
    : (h.infoUrl || '#');

  card.innerHTML = `
    ${h.thumbnail ? `<img class="hotel-thumb" src="${h.thumbnail}" alt="${nameText}">` : ""}
    <div class="hotel-main">
      <div class="hotel-top">
        <div class="hotel-name" title="${nameText}">${nameText}</div>
        <div class="badges">
          <span class="badge" title="最安目安">${priceText}</span>
          <span class="badge" title="レビュー">${rateText}</span>
          <span class="badge" title="観光地からの距離">${distText}</span>
        </div>
      </div>
      ${addrText ? `<div class="muted hotel-addr">${addrText}</div>` : ""}
      <div class="hotel-actions">
        <a href="${mapLink}" target="_blank" rel="noopener" class="btn">🗺️ 地図</a>
        ${h.infoUrl ? `<a href="${h.infoUrl}" target="_blank" rel="noopener" class="btn">施設情報</a>` : ""}
        ${h.planUrl ? `<a href="${h.planUrl}" target="_blank" rel="noopener" class="btn primary">空室・料金</a>` : ""}
      </div>
    </div>
  `;
  return card;
}

function skeletonHTML() {
  return `
    <div class="card card-wide">
      <div class="hotel-header">
        <div class="title">🏨 付近のホテル</div>
        <div class="chip">読込中...</div>
      </div>
      <div class="skeleton-grid">
        ${Array.from({length: 6}).map(() => `
          <div class="skeleton-card">
            <div class="sk sk-img"></div>
            <div class="sk sk-line"></div>
            <div class="sk sk-line short"></div>
            <div class="sk sk-buttons"></div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/* ========= 共通ユーティリティ ========= */

function formatDate(str) {
  const d = new Date(str);
  return d.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
}

function buildGoogleMapsLink(lat, lng) {
  if (!isNum(lat) || !isNum(lng)) return '#';
  const L = encodeURIComponent(lat);
  const G = encodeURIComponent(lng);
  return `https://www.google.com/maps/search/?api=1&query=${L},${G}`;
}

function getRegionFromLatLng(lat, lng) {
  if (!isNum(lat) || !isNum(lng)) return 'etc';
  if (lat >= 43) return '北海道';
  if (lat >= 38 && lat < 43 && lng >= 139 && lng <= 142) return '東北';
  if (lat >= 35 && lat < 38 && lng >= 138 && lng <= 141) return '関東';
  if (lat >= 35 && lat < 38 && lng >= 136 && lng < 138) return '中部';
  if (lat >= 33.5 && lat < 35 && lng >= 134.5 && lng < 136.5) return '近畿';
  if (lat >= 33.5 && lat < 35 && lng >= 131 && lng < 134.5) return '中国';
  if (lat >= 32 && lat < 34 && lng >= 132 && lng < 134.5) return '四国';
  if (lat >= 30 && lat < 33.5 && lng >= 128 && lng < 132) return '九州';
  if (lat < 30) return '沖縄';
  return 'etc';
}

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = deg => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 数値ヘルパ
function isNum(v){ return typeof v === 'number' && Number.isFinite(v); }
function num(v){ const n = Number(v); return Number.isFinite(n) ? n : NaN; }
function fix6(n){ return (Number(n).toFixed(6)); }

// XSS対策の簡易エスケープ
function esc(s){
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}
