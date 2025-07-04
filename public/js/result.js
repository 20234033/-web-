window.addEventListener('DOMContentLoaded', async () => {

  const resultMap = L.map('result-map').setView([35.7, 139.7], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(resultMap);

  const scoreText = document.getElementById('scoreText');
  const correct = JSON.parse(localStorage.getItem('correctCoords'));
  const answer = JSON.parse(localStorage.getItem('lastAnswerCoords'));
  const correctSpot = JSON.parse(localStorage.getItem('correctSpot'));

  if (!correct || !answer || !correctSpot) {
    scoreText.innerHTML = "<p>情報が足りません。再度プレイしてください。</p>";
    return;
  }

  const dist = JSON.parse(localStorage.getItem('lastDistance'));
  const rawScore = Math.max(0, 5000 - Math.round(dist));
  const score = Math.round((rawScore / 5000) * 100);
  localStorage.setItem('lastScore', score.toString());

  L.marker([correct.lat, correct.lng]).addTo(resultMap).bindPopup("🎯 正解地点").openPopup();
  L.marker([answer.lat, answer.lng]).addTo(resultMap).bindPopup("📍 あなたのピン");

  L.polyline([[answer.lat, answer.lng], [correct.lat, correct.lng]], {
    color: 'red',
    weight: 2
  }).addTo(resultMap);

  scoreText.innerHTML = `
    距離: <span>${dist.toFixed(1)}km</span><br>
    スコア: <span>${score}</span> / 100
    <div id="place-info" style="margin-top: 16px;">
      <h3>${correctSpot.title}</h3>
      <p>${correctSpot.description}</p>
    ${correctSpot.image_path ? `<img src="${window.location.origin}${correctSpot.image_path}" alt="観光地画像" style="max-width:100%; border-radius:10px; margin-top:10px;">` : ''}
  </div>
  `;

  // ✅ サーバー経由でStreet ViewのURLを取得
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
          style="border:0; border-radius: 12px;"
          loading="lazy"
          allowfullscreen
          src="${data.url}">
        </iframe>
      `;
      document.body.appendChild(streetview);
    } else {
      console.warn("Street View URL取得に失敗しました");
    }
  } catch (err) {
    console.error("Street View 取得エラー:", err);
  }
});

// 🔁 リトライボタン
function retry() {
  const fromAddition = localStorage.getItem('fromAddition');
  localStorage.removeItem('fromAddition');
  location.href = fromAddition ? 'addition.html' : 'play.html';
}

// 🏠 ホームに戻るボタン
function goHome() {
  location.href = 'home.html';
}
