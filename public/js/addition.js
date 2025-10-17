// addition.js
window.addEventListener('DOMContentLoaded', () => {
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

  // --- 住所→座標 ---
  const addressInput = document.getElementById('addressInput');
  const geocodeBtn = document.getElementById('geocodeBtn');

  geocodeBtn?.addEventListener('click', async () => {
    const address = (addressInput?.value || '').trim();
    if (!address) {
      alert('住所を入力してください。');
      return;
    }

    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (!data.success || !data.lat || !data.lng) {
        alert('住所が見つかりませんでした。');
        return;
      }
      const newLatLng = [data.lat, data.lng];
      marker.setLatLng(newLatLng);
      map.setView(newLatLng, 15);
      updateStreetView(data.lat, data.lng);
    } catch (err) {
      console.error('ジオコーディングエラー:', err);
      alert('住所の変換に失敗しました。');
    }
  });

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

  // --- AI 自動生成（タイトルからジャンル＆説明を推定） ---
  const aiBtn = document.getElementById('aiSuggestBtn');
  const aiStatus = document.getElementById('aiStatus');
  const titleInput = document.getElementById('title');
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

      // lat/lng は任意（補助情報として送る）
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
      // 返ってきたタイトルで表記ゆれが整う場合があるので上書き
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
        // 拡張子なしルーティング
        location.href = 'add_result';
      } else {
        alert('保存に失敗しました: ' + (result.error || ''));
      }
    } catch (err) {
      console.error(err);
      alert('通信エラーが発生しました');
    }
  });
});
