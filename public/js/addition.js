// addition.js
window.addEventListener('DOMContentLoaded', () => {
  /* ========= テーマ & レイアウトCSSをJSから注入 ========= */
  (function injectLayoutCSS() {
    const css = `
    :root[data-theme="light"]{color-scheme:light;--bg:#f7f7f8;--text:#0f172a;--subtle:#475569;--panel:#ffffff;--border:#e5e7eb;--primary:#2563eb;}
    :root[data-theme="dark"]{ color-scheme:dark; --bg:#0b0f14;--text:#e5e7eb;--subtle:#9aa4b2;--panel:#111827;--border:#1f2937;--primary:#60a5fa;}
    :root{ --nav-h:56px; }

    html,body{background:var(--bg);color:var(--text);height:100%;overflow:hidden;}

    .addition-layout{
      display:grid;
      grid-template-columns: 360px 1fr; /* 左：固定幅, 右：可変 */
      gap:12px;
      height:calc(100vh - var(--nav-h));
      padding:12px;
      box-sizing:border-box;
    }

    /* === 左パネル：上=SV(可変px)/仕切り/下=フォーム(スクロール) === */
    .left-panel{
      display:grid;
      grid-template-rows: var(--left-sv-h, 260px) 8px 1fr;
      gap:12px;
      overflow:hidden; /* 外側は固定、高さは内部でスクロール */
      background:var(--panel);
      border:1px solid var(--border);
      border-radius:12px;
      padding:12px;
    }
    .left-sv{
      width:100%; height:100%;
      border:1px solid var(--border);
      border-radius:12px; overflow:hidden; background:#0001;
    }
    .left-sv iframe{ width:100%; height:100%; border:none; }

    .left-resizer{
      align-self:stretch;
      cursor:row-resize;
      position:relative;
      user-select:none; touch-action:none;
      border-radius:6px; background:transparent;
    }
    .left-resizer::before{
      content:""; position:absolute; left:50%; top:50%;
      transform:translate(-50%,-50%); width:64px; height:3px;
      border-radius:2px; background:var(--border); opacity:.9;
    }
    .row-resizing *{ cursor:row-resize !important; }

    .left-form{ overflow:auto; padding-right:4px; } /* ここだけスクロール */
    .left-form label{ display:block; margin-top:10px; font-weight:600; }
    .left-form input[type="text"], .left-form textarea, .left-form select{
      width:100%; margin-top:6px; padding:8px 10px;
      border:1px solid var(--border); border-radius:8px; font-size:12px;
      background:var(--panel); color:var(--text);
    }
    .left-form textarea{ min-height:96px; resize:vertical; }
    .custom-file-upload{ display:inline-block; padding:8px 12px; margin-top:8px; border:1px solid #888; border-radius:8px; cursor:pointer; user-select:none; background:#f6f6f6; }
    .custom-file-upload input{ display:none; }
    #aiStatus{ margin-left:6px; color:#666; font-size:12px; }
    #fileNameDisplay{ margin-left:8px; color:#444; font-size:12px; }
    #preview{ display:none; width:100%; max-height:220px; object-fit:cover; margin-top:10px; border-radius:10px; border:1px solid #ddd; }
    #deleteImage{ display:none; margin-top:8px; }
    #confirmBtn{ width:100%; margin-top:14px; padding:12px; border:none; border-radius:10px; font-weight:700; cursor:pointer; background:var(--primary); color:#fff; }

    /* === 右パネル：地図のみ === */
    .right-panel{
      display:grid;
      grid-template-rows: 1fr;
      gap:12px;
      min-height:0;
    }
    #map{
      width:100%; height:100%;
      border:1px solid var(--border);
      border-radius:12px; background:#0001;
    }
@media (max-width: 820px){
  /* 上=左パネル(60vh) / 下=地図(40vh) は維持 */
  .addition-layout{
    grid-template-columns: 1fr;
    grid-template-rows: minmax(0, 60vh) minmax(0, 40vh);
    height: calc(100dvh - var(--nav-h));
  }

  /* ★ 左パネル”全体”をスクロールにして、SV も一緒に動かす */
  #leftPanel{
    min-height: 0;
    overflow: auto;                   /* ← ここを追加（全体スクロール） */
    -webkit-overflow-scrolling: touch;
    --left-sv-h: 200px;               /* 初期はやや低め（好みで調整OK） */
  }

  /* ★ フォームはスクロールさせない（親に委ねる） */
  .left-form{
    overflow: visible;                /* ← ここを変更 */
  }
}

    @media (max-width: 820px){
      .addition-layout{
        grid-template-columns: 1fr;
        grid-template-rows: auto 30vh; /* 上：左パネル / 下：右パネル */
      }
    }`;
    const style = document.createElement('style');
    style.id = 'addition-layout-style';
    style.textContent = css;
    document.head.appendChild(style);
    if (!document.documentElement.hasAttribute('data-theme')) {
      document.documentElement.setAttribute('data-theme','light');
    }
  })();

  /* ========= レイアウトを自動構築 ========= */
  (function buildLayoutIfNeeded() {
    if (document.querySelector('.addition-layout')) return;

    const left = document.getElementById('leftPanel');
    const mapEl = document.getElementById('map');
    let svIframe = document.getElementById('streetview');
    let svContainer = document.getElementById('streetview-container');

    if (!left && !mapEl && !svIframe) return;

    const root = document.createElement('div');
    root.className = 'addition-layout';

    // 左パネル用コンテナ
    const leftPanel = left || document.createElement('section');
    leftPanel.id = leftPanel.id || 'leftPanel';
    leftPanel.classList.add('left-panel');

    // ストビュー用コンテナ
    if (!svContainer) {
      svContainer = document.createElement('div');
      svContainer.id = 'streetview-container';
    }
    svContainer.classList.add('left-sv');

    if (!svIframe) {
      svIframe = document.createElement('iframe');
      svIframe.id = 'streetview';
      svIframe.allowFullscreen = true;
    }
    svContainer.innerHTML = '';
    svContainer.appendChild(svIframe);

    // 仕切り
    const resizer = document.createElement('div');
    resizer.className = 'left-resizer';
    resizer.setAttribute('role','separator');
    resizer.setAttribute('aria-orientation','horizontal');
    resizer.tabIndex = 0;

    // 左フォーム
    const formWrap = document.createElement('div');
    formWrap.className = 'left-form';

    const moveIntoForm = (parent) => {
      const nodes = Array.from(parent.childNodes);
      nodes.forEach(node => {
        if (node === svContainer || node === resizer) return;
        formWrap.appendChild(node);
      });
    };
    if (left) moveIntoForm(leftPanel);

    leftPanel.innerHTML = '';
    leftPanel.appendChild(svContainer);
    leftPanel.appendChild(resizer);
    leftPanel.appendChild(formWrap);

    // 右パネル
    const rightPanel = document.createElement('section');
    rightPanel.className = 'right-panel';
    if (mapEl) rightPanel.appendChild(mapEl);

    document.body.appendChild(root);
    root.appendChild(leftPanel);
    root.appendChild(rightPanel);
  })();

  /* ========= 左パネル内：ストビュー高さリサイズ（px保持） ========= */
  (function enableLeftSvResize() {
    const panel = document.querySelector('.left-panel');
    const resizer = panel?.querySelector('.left-resizer');
    if (!panel || !resizer) return;

    const savedPx = parseInt(localStorage.getItem('leftSvHeightPx') || '', 10);
    if (!Number.isNaN(savedPx)) {
      panel.style.setProperty('--left-sv-h', `${savedPx}px`);
    }

    let dragging = false;
    let startY = 0;
    let startH = 0;

    const getPanelRect = () => panel.getBoundingClientRect();

    const applyHeight = (px) => {
      const rect = getPanelRect();
      const min = 140;
      const max = Math.max(180, rect.height - 140);
      const h = Math.max(min, Math.min(max, px|0));
      panel.style.setProperty('--left-sv-h', `${h}px`);
      localStorage.setItem('leftSvHeightPx', String(h));
    };

    const onMove = (clientY) => {
      const delta = clientY - startY;
      applyHeight(startH + delta);
    };

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      document.body.classList.remove('row-resizing');
      try { map.invalidateSize(); } catch {}
    };

    resizer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      dragging = true;
      document.body.classList.add('row-resizing');
      startY = e.clientY;
      const current = getComputedStyle(panel).getPropertyValue('--left-sv-h').trim();
      startH = parseInt(current || '260', 10);
    });
    window.addEventListener('mousemove', (e) => { if (dragging) onMove(e.clientY); });
    window.addEventListener('mouseup', endDrag);

    resizer.addEventListener('touchstart', (e) => {
      const t = e.touches[0]; if (!t) return;
      dragging = true;
      document.body.classList.add('row-resizing');
      startY = t.clientY;
      const current = getComputedStyle(panel).getPropertyValue('--left-sv-h').trim();
      startH = parseInt(current || '260', 10);
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (!dragging) return;
      const t = e.touches[0]; if (t) onMove(t.clientY);
    }, { passive: true });
    window.addEventListener('touchend', endDrag);
    window.addEventListener('touchcancel', endDrag);

    resizer.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 60 : 20;
      const current = parseInt(getComputedStyle(panel).getPropertyValue('--left-sv-h') || '260', 10);
      if (e.key === 'ArrowUp') {
        applyHeight(current + step); e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        applyHeight(current - step); e.preventDefault();
      }
    });

    window.addEventListener('resize', () => { try { map.invalidateSize(); } catch {} });
  })();

  /* ========= ここから従来の addition.js ロジック ========= */

  // --- Leaflet 初期化 ---
  const defaultLL = [35.6812, 139.7671]; // 東京駅
  const map = L.map('map').setView(defaultLL, 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const marker = L.marker(defaultLL, { draggable: true }).addTo(map);
  updateStreetView(defaultLL[0], defaultLL[1]);

  map.on('click', (e) => {
    marker.setLatLng(e.latlng);
    updateStreetView(e.latlng.lat, e.latlng.lng);
  });

  marker.on('moveend', (e) => {
    const { lat, lng } = e.target.getLatLng();
    updateStreetView(lat, lng);
  });

  async function updateStreetView(lat, lng) {
    const iframe = document.getElementById('streetview');
    try {
      const res = await fetch(`/api/streetview-url?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      if (data.success && data.url) {
        if (iframe) iframe.src = data.url;
        window.currentStreetViewUrl = data.url;
      } else {
        throw new Error('URL取得失敗');
      }
    } catch (err) {
      console.error('Street View URL取得失敗:', err);
      if (iframe) iframe.src = '';
      window.currentStreetViewUrl = '';
    }
  }

  /* === 旧：住所→座標（addressInput / geocodeBtn）は廃止 ===
     もしテンプレに残っていても、下で自動的に非表示にします。 */

  // --- タイトル入力 → 座標（Enter確定 or blur で発火） ---
  const titleInput = document.getElementById('title');
  let lastGeocodeQuery = '';
  let isComposing = false;

  function normalizeQuery(s){ return (s || '').replace(/\s+/g,' ').trim(); }

  async function geocodeAndMove(query) {
    const q = normalizeQuery(query);
    if (!q) return;
    if (q === lastGeocodeQuery) return; // 同一クエリは再リクエストしない
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!data.success || !data.lat || !data.lng) {
        alert('場所が見つかりませんでした。キーワードを変えてお試しください。');
        return;
      }
      lastGeocodeQuery = q;
      const newLatLng = [data.lat, data.lng];
      marker.setLatLng(newLatLng);
      map.setView(newLatLng, 15);
      updateStreetView(data.lat, data.lng);
    } catch (err) {
      console.error('ジオコーディングエラー:', err);
      alert('住所の変換に失敗しました。');
    }
  }

  // IME 変換中は Enter を無視
  titleInput?.addEventListener('compositionstart', () => { isComposing = true; });
  titleInput?.addEventListener('compositionend', () => { isComposing = false; });

  // Enter 確定で発火
  titleInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      geocodeAndMove(titleInput.value);
    }
  });

  // フォーカスアウトでも発火（内容が変わっていれば）
  titleInput?.addEventListener('blur', () => {
    const q = normalizeQuery(titleInput.value);
    if (q && q !== lastGeocodeQuery) {
      geocodeAndMove(q);
    }
  });

  // 初期値が入っている場合は自動で1回だけ geocode
  if (titleInput && normalizeQuery(titleInput.value)) {
    geocodeAndMove(titleInput.value);
  }

  // 旧UI（住所入力ブロック）が残っていれば隠す
  (function hideLegacyAddressUI() {
    const addressInput = document.getElementById('addressInput');
    const geocodeBtn = document.getElementById('geocodeBtn');
    if (geocodeBtn && geocodeBtn.parentElement) {
      geocodeBtn.parentElement.style.display = 'none';
    }
    if (addressInput) addressInput.style.display = 'none';
    if (geocodeBtn) geocodeBtn.style.display = 'none';
  })();

  // --- 画像プレビュー ---
  const imageInput = document.getElementById('imageUpload');
  const preview = document.getElementById('preview');
  const deleteImageBtn = document.getElementById('deleteImage');
  let selectedImageFile = null;

  imageInput?.addEventListener('change', () => {
    const file = imageInput.files?.[0];
    if (!file) return;
    selectedImageFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      if (preview) {
        preview.src = reader.result;
        preview.style.display = 'block';
      }
      if (deleteImageBtn) deleteImageBtn.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

  deleteImageBtn?.addEventListener('click', () => {
    if (imageInput) imageInput.value = '';
    selectedImageFile = null;
    if (preview) {
      preview.src = '';
      preview.style.display = 'none';
    }
    if (deleteImageBtn) deleteImageBtn.style.display = 'none';
  });

  // --- AI 自動生成 ---
  const aiBtn = document.getElementById('aiSuggestBtn');
  const aiStatus = document.getElementById('aiStatus');
  const genreSelect = document.getElementById('genre');
  const descInput = document.getElementById('description');

  aiBtn?.addEventListener('click', async () => {
    try {
      const title = (titleInput?.value || '').trim();
      if (!title) {
        alert('観光地のタイトルを入力してください。');
        return;
      }

      aiBtn.disabled = true;
      if (aiStatus) aiStatus.textContent = '生成中…';

      let lat = null, lng = null;
      try {
        const pos = marker.getLatLng();
        lat = pos.lat; lng = pos.lng;
      } catch {}

      const res = await fetch('/api/ai/spot-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, lat, lng })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || '生成に失敗しました');

      const s = json.suggestion;
      if (titleInput && s.title) titleInput.value = s.title;
      if (genreSelect && s.genre) genreSelect.value = s.genre;
      if (descInput && s.description) descInput.value = s.description;

      if (aiStatus) {
        aiStatus.textContent = json.fallback ? '（ローカル推定で生成）' : '✓ 生成しました';
        setTimeout(() => (aiStatus.textContent = ''), 2000);
      }
    } catch (e) {
      console.error('[AI生成エラー]', e);
      if (aiStatus) aiStatus.textContent = '生成に失敗しました';
    } finally {
      aiBtn.disabled = false;
    }
  });

  // --- 送信 ---
  const confirmBtn = document.getElementById('confirmBtn');
  confirmBtn?.addEventListener('click', async () => {
    const latlng = marker.getLatLng();
    const title = (titleInput?.value || '').trim();
    const genre = (genreSelect?.value || '').trim();
    const description = (descInput?.value || '').trim();

    if (!title || !description || !selectedImageFile) {
      alert('タイトル・説明・画像を入力してください');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('genre', genre);
    formData.append('description', description);
    formData.append('lat', latlng.lat);
    formData.append('lng', latlng.lng);
    formData.append('image', selectedImageFile);
    formData.append('streetViewUrl', window.currentStreetViewUrl || '');

    try {
      const response = await fetch('/api/save-spot', { method: 'POST', body: formData });
      const result = await response.json();

      if (result.success) {
        const spot = result.data;
        spot.streetViewUrl = window.currentStreetViewUrl || '';
        localStorage.setItem('newSpot', JSON.stringify(spot));
        location.href = 'add_result';
      } else {
        alert('保存に失敗しました: ' + (result.error || ''));
      }
    } catch (err) {
      console.error(err);
      alert('通信エラーが発生しました');
    }
  });

  // レイアウト構築後の地図サイズ調整（初回）
  setTimeout(() => { try { map.invalidateSize(); } catch {} }, 0);
});
