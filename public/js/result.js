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

window.addEventListener('DOMContentLoaded', async () => {
  /* ---------------- 地図とスコア表示 ---------------- */
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

  const dist      = getDistanceKm(answer.lat, answer.lng, correct.lat, correct.lng);
  const rawScore  = Math.max(0, 5000 - Math.round(dist));
  const score     = Math.round((rawScore / 5000) * 100);
  localStorage.setItem('lastScore', score.toString());

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

  /* -------------- Street View -------------- */
  try {
    const res  = await fetch(`/api/streetview-url?lat=${correct.lat}&lng=${correct.lng}`);
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

  /* ------------ 住所があれば移動情報を表示 ------------ */
  try {
    const locRes = await fetch('/api/has_location', { credentials: 'include' });
    if (!locRes.ok) throw new Error("住所情報取得に失敗");

    const locData = await locRes.json();
    if (locData.hasLocation && locData.lat != null && locData.lng != null) {
      const userLat = locData.lat;
      const userLng = locData.lng;

      const homeToSpotDist = getDistanceKm(userLat, userLng, correct.lat, correct.lng);
      const estimatedHours = (homeToSpotDist / 60).toFixed(1); // 時速60km想定

      const travelInfo = document.createElement('div');
      travelInfo.innerHTML = `
        <hr style="margin: 20px 0;">
        <h4>🧭 自宅からの移動情報</h4>
        <p>
          あなたの登録住所からこの観光地（${correctSpot.title}）までは
          約 <strong>${homeToSpotDist.toFixed(1)}km</strong> 離れています。<br>
          一般的な交通手段（電車・車）で移動した場合、
          およそ <strong>${estimatedHours}時間</strong> かかると想定されます。
        </p>`;
      scoreText.appendChild(travelInfo);
      
    }
  } catch (err) {
    console.warn("移動情報の取得に失敗:", err);
  }
});

/* ----------- 既存のボタン関数 ----------- */
function retry() {
  const fromAddition = localStorage.getItem('fromAddition');
  localStorage.removeItem('fromAddition');
  location.href = fromAddition ? 'addition.html' : 'play.html';
}
function goHome() {
  location.href = 'home.html';
}
