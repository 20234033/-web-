// history.js

// 文字列をそこそこ読みやすい日時に整形
function formatDateTime(src) {
  if (!src) return '';
  const d = new Date(src);
  if (Number.isNaN(d.getTime())) return String(src);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
}

// ジャンルを日本語ラベルに（必要に応じて調整）
function genreLabel(g) {
  switch (g) {
    case 'historic': return '歴史・文化';
    case 'nature':   return '自然';
    case 'city':     return '都市・街並み';
    case 'culture':  return '観光・文化';
    default:         return g || '未分類';
  }
}

// ========== 履歴取得関連 ==========

async function fetchMe() {
  const res = await fetch('/api/me', { credentials: 'include' });
  if (!res.ok) throw new Error('認証が必要です');
  return res.json();
}

async function fetchHistory(uuid) {
  const res = await fetch(`/api/history/${encodeURIComponent(uuid)}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || '履歴の取得に失敗しました');
  }
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || '履歴の取得に失敗しました');
  }
  return data.history || [];
}

// ========== DOM 反映 & ページネーション ==========

let historyData = [];   // 全履歴
let selectedIndex = -1; // 現在選択中の historyData 上の index

const PAGE_SIZE = 5;    // 1ページあたりの件数
let currentPage = 1;    // 現在ページ（1始まり）

function getPageCount() {
  return Math.max(1, Math.ceil(historyData.length / PAGE_SIZE));
}

function changePage(page) {
  const pageCount = getPageCount();
  const newPage = Math.min(Math.max(1, page), pageCount);
  currentPage = newPage;

  // そのページの先頭を自動選択
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  if (historyData[startIndex]) {
    selectedIndex = startIndex;
    renderDetail(historyData[startIndex]);
  }

  renderHistoryList();
}

function renderHistoryPager() {
  const pager = document.getElementById('history-pager');
  if (!pager) return;

  const pageCount = getPageCount();
  if (pageCount <= 1) {
    pager.innerHTML = '';
    return;
  }

  pager.innerHTML = '';

  // 「前へ」
  const prev = document.createElement('span');
  prev.textContent = '‹ 前へ';
  prev.className = 'history-page-nav';
  if (currentPage > 1) {
    prev.addEventListener('click', () => changePage(currentPage - 1));
  } else {
    prev.classList.add('disabled');
  }
  pager.appendChild(prev);

  // ページ番号（1〜pageCount）
  for (let p = 1; p <= pageCount; p++) {
    const span = document.createElement('span');
    span.textContent = String(p);
    span.className = 'history-page-link';
    if (p === currentPage) {
      span.classList.add('active');
    } else {
      span.addEventListener('click', () => changePage(p));
    }
    pager.appendChild(span);
  }

  // 「次へ」
  const next = document.createElement('span');
  next.textContent = '次へ ›';
  next.className = 'history-page-nav';
  if (currentPage < pageCount) {
    next.addEventListener('click', () => changePage(currentPage + 1));
  } else {
    next.classList.add('disabled');
  }
  pager.appendChild(next);
}

function renderHistoryList() {
  const ul = document.getElementById('history-ul');
  if (!ul) return;

  ul.innerHTML = '';

  if (!historyData.length) {
    const li = document.createElement('li');
    li.textContent = '出題履歴がありません。';
    li.style.padding = '8px 10px';
    ul.appendChild(li);
    renderHistoryPager();
    return;
  }

  const pageCount = getPageCount();
  if (currentPage > pageCount) currentPage = pageCount;

  const start = (currentPage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, historyData.length);

  for (let index = start; index < end; index++) {
    const item = historyData[index];

    const li = document.createElement('li');
    li.className = 'history-item';
    li.dataset.index = String(index);

    const titleSpan = document.createElement('span');
    titleSpan.className = 'history-item-title';
    titleSpan.textContent = item.title || '(タイトルなし)';

    const subSpan = document.createElement('span');
    subSpan.className = 'history-item-sub';
    subSpan.textContent = `スコア: ${item.score ?? '-'} / 出題日時: ${formatDateTime(item.answered_at)}`;

    li.appendChild(titleSpan);
    li.appendChild(subSpan);

    li.addEventListener('click', () => {
      selectHistory(index);
    });

    if (index === selectedIndex) {
      li.classList.add('active');
    }

    ul.appendChild(li);
  }

  renderHistoryPager();
}

function clearHotelList() {
  const hotelsStatus = document.getElementById('hotels-status');
  const hotelsList = document.getElementById('hotels-list');
  if (hotelsStatus) hotelsStatus.textContent = '';
  if (hotelsList) hotelsList.innerHTML = '';
}

function renderDetail(item) {
  const empty = document.getElementById('history-detail-empty');
  const detail = document.getElementById('history-detail');
  if (!detail) return;

  if (empty) empty.classList.add('hidden');
  detail.classList.remove('hidden');

  const imgWrap = document.getElementById('detail-image-wrap');
  const titleEl = document.getElementById('detail-title');
  const genreEl = document.getElementById('detail-genre');
  const descEl = document.getElementById('detail-description');
  const scoreEl = document.getElementById('detail-score');
  const dateEl = document.getElementById('detail-date');

  if (imgWrap) {
    imgWrap.innerHTML = '';
    if (item.image_path) {
      const img = document.createElement('img');
      img.src = item.image_path;
      img.alt = item.title || 'スポット画像';
      imgWrap.appendChild(img);
    }
  }

  if (titleEl) titleEl.textContent = item.title || '(タイトルなし)';
  if (genreEl) genreEl.textContent = `ジャンル：${genreLabel(item.genre)}`;
  if (descEl) descEl.textContent = item.description || '説明は登録されていません。';
  if (scoreEl) scoreEl.textContent = `スコア：${item.score ?? '-'}`;
  if (dateEl) dateEl.textContent = `出題日時：${formatDateTime(item.answered_at)}`;

  // ホテルリストをリセット
  clearHotelList();
  loadHotelsForItem(item);
}

// クリックされた履歴を選択状態に
function selectHistory(index) {
  selectedIndex = index;
  const item = historyData[index];
  if (!item) return;
  renderDetail(item);

  const ul = document.getElementById('history-ul');
  if (!ul) return;
  [...ul.querySelectorAll('.history-item')].forEach((li) => {
    li.classList.toggle('active', Number(li.dataset.index) === index);
  });
}

// ========== 周辺ホテル情報の読み込み ==========

async function loadHotelsForItem(item) {
  const hotelsStatus = document.getElementById('hotels-status');
  const hotelsList = document.getElementById('hotels-list');

  if (!hotelsStatus || !hotelsList) return;

  // 緯度経度が無い場合はスキップ
  if (item.lat == null || item.lng == null) {
    hotelsStatus.textContent =
      'このスポットには座標情報がないため、周辺ホテルを検索できません。';
    hotelsList.innerHTML = '';
    return;
  }

  hotelsStatus.textContent = '周辺ホテルを検索しています...';
  hotelsList.innerHTML = '';

  try {
    const params = new URLSearchParams({
      lat: item.lat,
      lng: item.lng,
      radiusKm: '1.0',
      hits: '5',
    });

    const res = await fetch(`/api/hotels_nearby_rakuten?${params.toString()}`);
    const data = await res.json();

    if (!data.success || !Array.isArray(data.hotels) || data.hotels.length === 0) {
      hotelsStatus.textContent = '周辺に表示できるホテルが見つかりませんでした。';
      hotelsList.innerHTML = '';
      return;
    }

    hotelsStatus.textContent =
      `検索範囲：約 ${data.radiusKm || '?'}km / ${data.count}件`;

    data.hotels.forEach((h) => {
      const li = document.createElement('li');

      const imageUrl =
        h.thumbnail ||
        h.imageUrl ||
        h.hotelImageUrl ||
        h.image ||
        (Array.isArray(h.imageUrls) ? h.imageUrls[0] : null);

      const name = h.name || '名称不明のホテル';
      const priceText = h.minCharge
        ? `最安値目安: ${h.minCharge}円〜`
        : '';
      const scoreText = h.reviewAverage
        ? `評価: ${h.reviewAverage}（${h.reviewCount || 0}件）`
        : '';

      const card = document.createElement('div');
      card.className = 'hotel-card';

      const thumbWrap = document.createElement('div');
      thumbWrap.className = 'hotel-card-thumb';
      if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = name;
        thumbWrap.appendChild(img);
      }
      card.appendChild(thumbWrap);

      const body = document.createElement('div');
      body.className = 'hotel-card-body';

      const nameEl = document.createElement('div');
      nameEl.className = 'hotel-card-name';
      nameEl.textContent = name;
      body.appendChild(nameEl);

      if (priceText || scoreText) {
        const metaEl = document.createElement('div');
        metaEl.className = 'hotel-card-meta';

        if (priceText) {
          const spanPrice = document.createElement('span');
          spanPrice.textContent = priceText;
          metaEl.appendChild(spanPrice);
        }
        if (scoreText) {
          const spanScore = document.createElement('span');
          spanScore.textContent = scoreText;
          metaEl.appendChild(spanScore);
        }
        body.appendChild(metaEl);
      }

      const actions = document.createElement('div');
      actions.className = 'hotel-card-actions';

      const url = h.planUrl || h.infoUrl || h.url || '#';
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = '詳細を見る';
      a.className = 'hotel-link-btn';

      actions.appendChild(a);
      body.appendChild(actions);

      card.appendChild(body);
      li.appendChild(card);
      hotelsList.appendChild(li);
    });
  } catch (e) {
    console.error('[hotels] error', e);
    hotelsStatus.textContent = 'ホテル情報の取得中にエラーが発生しました。';
    hotelsList.innerHTML = '';
  }
}

// ========== 初期化 ==========

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const me = await fetchMe();
    if (!me || !me.uuid) {
      throw new Error('ユーザー情報の取得に失敗しました。');
    }

    historyData = await fetchHistory(me.uuid);

    // 初期ページと選択
    currentPage = 1;
    if (historyData.length > 0) {
      selectedIndex = 0;
      renderDetail(historyData[0]);
    }

    renderHistoryList();
  } catch (e) {
    console.error(e);
    const ul = document.getElementById('history-ul');
    if (ul) {
      ul.innerHTML = '';
      const li = document.createElement('li');
      li.textContent = e.message || '履歴の読み込みに失敗しました。';
      li.style.padding = '8px 10px';
      ul.appendChild(li);
    }
    const pager = document.getElementById('history-pager');
    if (pager) pager.innerHTML = '';
  }
});
