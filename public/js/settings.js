window.addEventListener('DOMContentLoaded', () => {
  // 音量設定
const volumeEl = document.getElementById('volume');
const volumeValue = document.getElementById('volumeValue');

// 初期値
const savedVolume = localStorage.getItem('volume') || '50';
volumeEl.value = savedVolume;
volumeValue.textContent = `${savedVolume}%`;

// 値の変更時
volumeEl.addEventListener('input', () => {
  localStorage.setItem('volume', volumeEl.value);
  volumeValue.textContent = `${volumeEl.value}%`;
});


  // 文字サイズ設定
  const fontSizeEl = document.getElementById('fontSize');
  fontSizeEl.value = localStorage.getItem('fontSize') || 'medium';
  fontSizeEl.addEventListener('change', () => {
    localStorage.setItem('fontSize', fontSizeEl.value);
  });
  // 地図の初期位置：日本全体（中央 = 岐阜県）
  const defaultLatLng = [36.2048, 138.2529];
  const map = L.map('map').setView(defaultLatLng, 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // 保存済みの位置を取得
  const savedLat = parseFloat(localStorage.getItem('pinLat'));
  const savedLng = parseFloat(localStorage.getItem('pinLng'));
  const initialPos = (!isNaN(savedLat) && !isNaN(savedLng)) ? [savedLat, savedLng] : defaultLatLng;

  const marker = L.marker(initialPos, { draggable: true }).addTo(map);
  const locationDisplay = document.getElementById('locationDisplay');

  // 確定ボタン
    document.getElementById('confirmLocation').addEventListener('click', () => {
    localStorage.setItem('pinLat', currentLatLng.lat);
    localStorage.setItem('pinLng', currentLatLng.lng);
    updateDisplay(currentLatLng, true);
    });
  function updateDisplay(latlng) {
    locationDisplay.textContent = `選択された位置：${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
    localStorage.setItem('pinLat', latlng.lat);
    localStorage.setItem('pinLng', latlng.lng);
  }

  updateDisplay(marker.getLatLng());

  // ピンを動かしたとき
  marker.on('move', (e) => {
    updateDisplay(e.target.getLatLng());
  });

  // 地図クリックでピン移動
  map.on('click', (e) => {
    marker.setLatLng(e.latlng);
    updateDisplay(e.latlng);
  });
});
