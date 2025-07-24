window.addEventListener('DOMContentLoaded', async () => {
  const savedLocationEl = document.getElementById('savedLocationDisplay');
  const deleteLocationBtn = document.getElementById('deleteLocation');
  const locationDisplay = document.getElementById('locationDisplay');
  const confirmBtn = document.getElementById('confirmLocation');
  const addressInput = document.getElementById('addressInput');
  const geocodeBtn = document.getElementById('geocodeBtn');

  // 🔒 認証チェック
  try {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (!res.ok) throw new Error('認証失敗');
    await res.json(); // uuid取得などもあるが今回は使わない
  } catch (err) {
    alert('ログインが必要です。ログインページへ移動します。');
    window.location.href = 'auth/login.html';
    return;
  }

  // 🗺 地図の初期化
  const defaultLatLng = [36.2048, 138.2529];
  const map = L.map('map').setView(defaultLatLng, 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let marker = null;
  let currentLatLng = defaultLatLng;

  // 🎯 現在住所の取得と表示
  try {
    const res = await fetch('/api/user_location', { credentials: 'include' });
    const data = await res.json();
    if (data.lat && data.lng) {
      currentLatLng = [data.lat, data.lng];
      savedLocationEl.textContent = `${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`;
    } else {
      savedLocationEl.textContent = '未設定';
    }
  } catch (err) {
    console.warn('住所取得に失敗:', err);
    savedLocationEl.textContent = '取得エラー';
  }

  marker = L.marker(currentLatLng, { draggable: true }).addTo(map);
  map.setView(currentLatLng, 6);
  updateDisplay(currentLatLng);

  marker.on('move', (e) => {
    updateDisplay([e.latlng.lat, e.latlng.lng]);
  });

  map.on('click', (e) => {
    marker.setLatLng(e.latlng);
    updateDisplay([e.latlng.lat, e.latlng.lng]);
  });

  // ✅ 住所の保存
  confirmBtn.addEventListener('click', async () => {
    const latlng = marker.getLatLng();
    try {
      const res = await fetch('/api/user_location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ lat: latlng.lat, lng: latlng.lng })
      });
      if (!res.ok) throw new Error('保存失敗');
      alert('住所を保存しました！');
      savedLocationEl.textContent = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
    } catch (err) {
      alert('保存に失敗しました。');
      console.error(err);
    }
  });

  // 🗑️ 住所の削除
  deleteLocationBtn.addEventListener('click', async () => {
    if (!confirm('本当に住所を削除しますか？')) return;
    try {
      const res = await fetch('/api/user_location', {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('削除失敗');
      alert('住所を削除しました');
      savedLocationEl.textContent = '未設定';
    } catch (err) {
      alert('住所の削除に失敗しました');
      console.error(err);
    }
  });

  // 🔍 住所→緯度経度 変換（ジオコーディング）
  geocodeBtn.addEventListener('click', async () => {
    const address = addressInput.value.trim();
    if (!address) {
      alert('住所を入力してください。');
      return;
    }

    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (!data.success) {
        alert(data.error || '住所が見つかりませんでした。');
        return;
      }

      const newLatLng = [data.lat, data.lng];
      marker.setLatLng(newLatLng);
      map.setView(newLatLng, 15);
      updateDisplay(newLatLng);
    } catch (err) {
      alert('住所の変換に失敗しました。');
      console.error(err);
    }
  });

  // 📍 表示更新関数
  function updateDisplay([lat, lng]) {
    locationDisplay.textContent = `選択された位置：${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
});
