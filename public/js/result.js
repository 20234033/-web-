// result.js

/* ========= ユーティリティ ========= */
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

// Google形式のエンコードポリラインを配列に復号（精度1e-5）
function decodePolyline(encoded) {
  const points = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

/* ========= メイン ========= */
window.addEventListener('DOMContentLoaded', async () => {
  // --- 地図初期化（ライト/ダーク自動切替） ---
  const resultMap = L.map('result-map', { zoomControl: true }).setView([35.7, 139.7], 10);

  const lightTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  });

  const darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  });

  const mediaDark = window.matchMedia('(prefers-color-scheme: dark)');
  const isBodyDark = () => document.body.classList.contains('dark') && !document.body.classList.contains('light');
  function applyTiles() {
    const wantDark = mediaDark.matches || isBodyDark();
    if (wantDark) {
      if (resultMap.hasLayer(lightTiles)) resultMap.removeLayer(lightTiles);
      if (!resultMap.hasLayer(darkTiles)) darkTiles.addTo(resultMap);
    } else {
      if (resultMap.hasLayer(darkTiles)) resultMap.removeLayer(darkTiles);
      if (!resultMap.hasLayer(lightTiles)) lightTiles.addTo(resultMap);
    }
  }
  applyTiles();
  mediaDark.addEventListener?.('change', applyTiles);
  new MutationObserver(applyTiles).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // --- ローカルストレージから必要データ取得 ---
  const scoreText   = document.getElementById('scoreText');
  const correct     = JSON.parse(localStorage.getItem('correctCoords'));
  const answer      = JSON.parse(localStorage.getItem('lastAnswerCoords'));
  const correctSpot = JSON.parse(localStorage.getItem('correctSpot'));

  if (!correct || !answer || !correctSpot) {
    scoreText.innerHTML = "<p>情報が足りません。再度プレイしてください。</p>";
    return;
  }

  // --- スコアAPI ---
  try {
    const res  = await fetch(`/api/score?SelLat=${answer.lat}&SelLng=${answer.lng}&CorLat=${correct.lat}&CorLng=${correct.lng}`);
    const data = await res.json();
    if (!data.success) throw new Error("スコア取得に失敗");

    const distanceKm = data.Distance;
    const score      = data.score;
    localStorage.setItem('lastScore', String(score));

    scoreText.innerHTML = `
      距離: <span>${Number(distanceKm).toFixed(1)}km</span><br>
      スコア: <span>${score}</span> / 100
      <div id="place-info" style="margin-top: 16px;">
        <p>${correctSpot.description || ''}</p>
        ${correctSpot.image_path ? `<img src="${correctSpot.image_path}" alt="観光地画像" style="max-width:100%; border-radius:10px; margin-top:10px;">` : ''}
      </div>
    `;
  } catch (err) {
    console.error("スコアAPI通信エラー:", err);
    scoreText.innerHTML = "<p>スコア情報の取得に失敗しました。</p>";
  }

  // --- マーカー/直線 ---
  const correctMarker = L.marker([correct.lat, correct.lng]).addTo(resultMap).bindPopup("🎯 正解地点").openPopup();
  const answerMarker  = L.marker([answer.lat, answer.lng]).addTo(resultMap).bindPopup("📍 あなたのピン");
  const straightLine  = L.polyline([[answer.lat, answer.lng], [correct.lat, correct.lng]], { color: 'red', weight: 2 }).addTo(resultMap);

  // --- まずは2点が収まるようにフィット ---
  resultMap.fitBounds(L.latLngBounds([[answer.lat, answer.lng], [correct.lat, correct.lng]]), { padding: [30, 30] });

  // --- Street View（任意API） ---
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

  // --- 自宅 → 観光地：移動情報 & 経路描画 ---
  try {
    const locRes = await fetch('/api/has_location', { credentials: 'include' });
    if (!locRes.ok) throw new Error("住所情報取得に失敗");
    const locData = await locRes.json();

    if (locData.hasLocation && locData.lat != null && locData.lng != null) {
      const userLat = Number(locData.lat);
      const userLng = Number(locData.lng);

      // 自宅アイコン
      const houseIcon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/25/25694.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -30]
      });

      const homeMarker = L.marker([userLat, userLng], { icon: houseIcon }).addTo(resultMap).bindPopup("🏠 自宅");

      // 概算（直線距離ベース）も表示
      const homeToSpotDist = getDistanceKm(userLat, userLng, correct.lat, correct.lng);
      const estimatedCarHours   = (homeToSpotDist / 60).toFixed(1); // 仮の平均 60km/h
      const estimatedTrainHours = (homeToSpotDist / 80).toFixed(1); // 仮の平均 80km/h
      const estimatedCost       = Math.round(homeToSpotDist * 15);  // 仮: 15円/km

      const travelInfo = document.createElement('div');
      travelInfo.innerHTML = `
        <hr style="margin: 20px 0;">
        <h4>🧭 自宅からの移動情報</h4>
        <p>
          🏠 登録住所 ➡ ${correctSpot.title}（観光地）<br>
          直線距離: 約 <strong>${homeToSpotDist.toFixed(1)} km</strong><br>
          🚗 車（概算）: 約 <strong>${estimatedCarHours} 時間</strong><br>
          🚃 電車（概算）: 約 <strong>${estimatedTrainHours} 時間</strong>・運賃 約 <strong>${estimatedCost} 円</strong>
        </p>`;
      scoreText.appendChild(travelInfo);

      // 経路（OSRM経由の自前API）
      const directionsRes = await fetch(
        `/api/directions?fromLat=${userLat}&fromLng=${userLng}&toLat=${correct.lat}&toLng=${correct.lng}&mode=driving`
      );
      const directionsData = await directionsRes.json();

      if (directionsData.success && directionsData.route?.overview_polyline?.points) {
        const polylineEncoded = directionsData.route.overview_polyline.points;
        const points = decodePolyline(polylineEncoded);

        const routeLine = L.polyline(points, { color: 'blue', weight: 4 }).addTo(resultMap)
          .bindPopup("🚗 推奨ルート");

        // ルート全体が見えるように
        resultMap.fitBounds(routeLine.getBounds(), { padding: [30, 30] });

        // 所要時間/距離（実測）
        const minutes = Math.round((directionsData.route.duration || 0) / 60);
        const km      = (directionsData.route.distance || 0) / 1000;

        const routeInfo = document.createElement('div');
        routeInfo.style.marginTop = "8px";
        routeInfo.innerHTML = `
          <p>
            🗺️ 経路（実測）: 距離 約 <strong>${km.toFixed(1)} km</strong>・
            所要 約 <strong>${minutes} 分</strong>
          </p>`;
        scoreText.appendChild(routeInfo);

      } else {
        console.warn("経路が見つかりませんでした:", directionsData?.message);
      }
    }
  } catch (err) {
    console.warn("移動情報の取得に失敗:", err);
  }
});

/* ========= 既存のボタン ========= */
function retry() {
  const fromAddition = localStorage.getItem('fromAddition');
  localStorage.removeItem('fromAddition');
  location.href = fromAddition ? 'addition' : 'play';
}
function goHome() {
  location.href = 'home';
}
