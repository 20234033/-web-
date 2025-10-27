
window.addEventListener('DOMContentLoaded',() => {

  const spot = JSON.parse(localStorage.getItem('newSpot') || '{}');

  if (!spot || !spot.title || !spot.lat || !spot.lng) {
    alert('観光地の情報が見つかりません。');
    location.href = 'addition';
    return;
  }

  // 地図表示
  const map = L.map('result-map').setView([spot.lat, spot.lng], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  L.marker([spot.lat, spot.lng]).addTo(map).bindPopup(spot.title).openPopup();

  // 情報ボックス更新
  const infoBox = document.getElementById('infoBox');
  infoBox.innerHTML = `
    <p>📍 追加された観光地</p>
    <h3>${spot.title}</h3>
    <p>${spot.description}</p>
    ${spot.image ? `<img src="${spot.image}" alt="観光地画像">` : ''}
  `;


  // ストリートビュー埋め込み
  const streetView = document.getElementById('streetview');
  if (spot.streetViewUrl) {
    streetView.src = spot.streetViewUrl;
  } else {
    // fallback: 位置からGoogle Street Viewを生成
    streetView.src = `https://www.google.com/maps/embed?pb=!1m0!3m2!1sja!2sjp!4v1717900000000!6m8!1m7!1sCAoSLEFGMVFpcFBHNG4yTTI5UHBUMXQ3cEpNclRLclZzMXN1OGpOa2Y1b1kydGpm!2m2!1d${spot.lat}!2d${spot.lng}!3f0!4f0!5f1.1924812503605782`;
  }

  // 不要になったデータを削除
  localStorage.removeItem('newSpot');
});
