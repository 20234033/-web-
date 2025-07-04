function decodePolyline(encoded) {
  let points = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

window.addEventListener('DOMContentLoaded', async () => {
  const resultMap = L.map('result-map').setView([35.7, 139.7], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(resultMap);

  const scoreText   = document.getElementById('scoreText');
  const correct     = JSON.parse(localStorage.getItem('correctCoords'));
  const answer      = JSON.parse(localStorage.getItem('lastAnswerCoords'));
  const correctSpot = JSON.parse(localStorage.getItem('correctSpot'));

  if (!correct || !answer || !correctSpot) {
    scoreText.innerHTML = "<p>情報が足りません。再度プレイしてください。</p>";
    return;
  }

  const dist = JSON.parse(localStorage.getItem('lastDistance'));
  const score = JSON.parse(localStorage.getItem('lastScore'));

  L.marker([correct.lat, correct.lng]).addTo(resultMap).bindPopup("🎯 正解地点").openPopup();
  L.marker([answer.lat, answer.lng]).addTo(resultMap).bindPopup("📍 あなたのピン");
  L.polyline([[answer.lat, answer.lng], [correct.lat, correct.lng]], { color: 'red', weight: 2 }).addTo(resultMap);

  scoreText.innerHTML = `
    距離: <span>${dist.toFixed(1)}km</span><br>
    スコア: <span>${score}</span> / 100
    <div id="place-info" style="margin-top: 16px;">
      <h3>${correctSpot.title}</h3>
      <p>${correctSpot.description}</p>
      ${correctSpot.image_path ? `<img src="${window.location.origin}${correctSpot.image_path}" alt="観光地画像" style="max-width:100%; border-radius:10px; margin-top:10px;">` : ''}
    </div>
  `;

  // Street View 表示
  try {
    const res = await fetch(`/api/streetview-url?lat=${correct.lat}&lng=${correct.lng}`);
    const data = await res.json();
    if (data.success && data.url) {
      const streetview = document.createElement("div");
      streetview.id = "streetview-container";
      streetview.innerHTML = `
        <iframe
          width="300"
          height="200"
          class="streetview-frame"
          style="border:0; border-radius:12px;"
          loading="lazy"
          allowfullscreen
          src="${data.url}">
        </iframe>`;
      document.body.appendChild(streetview);
    }
  } catch (err) {
    console.warn("Street View 取得エラー:", err);
  }

  // 住所があれば移動距離・時間・ルートを表示
 // ✅ 住所があれば移動情報を表示 + 経路を描画
  try {
    const locRes = await fetch('/api/has_location', { credentials: 'include' });
    if (!locRes.ok) throw new Error("住所情報取得に失敗");

    const locData = await locRes.json();
    if (locData.hasLocation && locData.lat != null && locData.lng != null) {
      const userLat = locData.lat;
      const userLng = locData.lng;

      // 🏠 自宅マーカーを地図に追加
      const houseIcon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/25/25694.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -30]
      });

      L.marker([userLat, userLng], { icon: houseIcon }).addTo(resultMap).bindPopup("🏠 自宅");

      // 🧭 概算距離と時間
      const homeToSpotDist = getDistanceKm(userLat, userLng, correct.lat, correct.lng);
      const estimatedCarHours = (homeToSpotDist / 60).toFixed(1);
      const estimatedTrainHours = (homeToSpotDist / 80).toFixed(1);
      const estimatedCost = Math.round(homeToSpotDist * 15); // 仮に15円/kmで電車代換算

      const travelInfo = document.createElement('div');
      travelInfo.innerHTML = `
        <hr style="margin: 20px 0;">
        <h4>🧭 自宅からの移動情報</h4>
        <p>
          🏠 登録住所 ➡ ${correctSpot.title}（観光地）<br>
          距離: 約 <strong>${homeToSpotDist.toFixed(1)}km</strong><br>
          🚗 車：約 <strong>${estimatedCarHours}時間</strong><br>
          🚃 電車：約 <strong>${estimatedTrainHours}時間</strong>・運賃 約 <strong>${estimatedCost}円</strong>
        </p>`;
      scoreText.appendChild(travelInfo);

      // ✅ Directions API 経路取得（ルート線表示）
      const directionsRes = await fetch(`/api/directions?fromLat=${userLat}&fromLng=${userLng}&toLat=${correct.lat}&toLng=${correct.lng}`);
      const directionsData = await directionsRes.json();
      if (directionsData.success && directionsData.route) {
        const polylineEncoded = directionsData.route.overview_polyline.points;
        const points = decodePolyline(polylineEncoded);
        L.polyline(points, { color: 'blue', weight: 4 }).addTo(resultMap).bindPopup("🚗 経路（車）");
      }
    }
  } catch (err) {
    console.warn("移動情報の取得に失敗:", err);
  }
});

/* ------------ 既存のボタン関数 ----------- */
function retry() {
  const fromAddition = localStorage.getItem('fromAddition');
  localStorage.removeItem('fromAddition');
  location.href = fromAddition ? 'addition.html' : 'play.html';
}
function goHome() {
  location.href = 'home.html';
}
