import { checkAuthOrRedirect } from './auth.js'; // または適切な相対パス
document.addEventListener("DOMContentLoaded", async () => {
  await checkAuthOrRedirect();
  const ul = document.getElementById("history-ul");
  if (!ul) return;

  try {
    const [historyRes, sightseeingRes] = await Promise.all([
      fetch('/data/history.json'),
      fetch('/data/sightseeing.json')
    ]);

    const historyData = await historyRes.json();
    const sightseeingData = await sightseeingRes.json();

    historyData.forEach(entry => {
      const spot = sightseeingData.find(s => s.id === entry.id);
      if (!spot) return;

      const region = getRegionFromLatLng(spot.lat, spot.lng); // 地方名取得

      const li = document.createElement("li");
      li.innerHTML = `
        <div><strong>${spot.title}</strong>（スコア: ${entry.score}）</div>
        <div><small>${entry.timestamp}</small></div>
        <div>🗾 地方: ${region}　|　📚 ジャンル: ${spot.genre || '不明'}</div>
        <div><img src="${spot.image}" alt="${spot.title}" style="max-width: 100%; border-radius: 6px; margin: 5px 0;"></div>
        <div>${spot.description}</div>
        <hr style="margin: 10px 0;" />
      `;
      ul.appendChild(li);
    });

  } catch (err) {
    ul.innerHTML = "<li>履歴の読み込みに失敗しました。</li>";
    console.error(err);
  }
});

// 🌏 緯度経度 → 地方名に変換する関数（簡易版）
function getRegionFromLatLng(lat, lng) {
  if (lat >= 43) return '北海道';
  if (lat >= 38 && lng >= 139) return '東北';
  if (lat >= 35 && lng >= 138 && lng < 141) return '関東';
  if (lat >= 34 && lng >= 135 && lng < 138) return '中部';
  if (lat >= 34 && lng >= 133 && lng < 135) return '関西';
  if (lat >= 33 && lng >= 130) return '九州';
  if (lat < 30) return '沖縄';
  return 'その他';
}
