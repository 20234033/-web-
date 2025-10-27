document.addEventListener("DOMContentLoaded", async () => {
  const genreMap = {
    historic: '歴史的建造物',
    nature: '自然',
    city: '都市景観',
    culture: '文化的名所'
  };

  const ul = document.getElementById("history-ul");
  if (!ul) return;

  let userUuid = null;
  try {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (!res.ok) throw new Error('ユーザー情報取得失敗');
    const user = await res.json();
    userUuid = user.user_uuid;
  } catch (err) {
    ul.innerHTML = "<li>ログイン情報が取得できませんでした。</li>";
    console.error("ユーザーUUID取得失敗:", err);
    return;
  }

  let userLat = null;
  let userLng = null;

  // ✅ ユーザー住所（緯度経度）の取得
  try {
    const locRes = await fetch('/api/has_location', { credentials: 'include' });
    if (locRes.ok) {
      const locData = await locRes.json();
      if (locData.hasLocation) {
        userLat = locData.address_lat;
        userLng = locData.address_lng;
      }
    }
  } catch (err) {
    console.warn("住所取得に失敗:", err);
  }

  try {
    const res = await fetch(`/api/history/${userUuid}`);
    const data = await res.json();

    if (!data.success || !data.history || data.history.length === 0) {
      ul.innerHTML = "<li>履歴がありません。</li>";
      return;
    }

    data.history.forEach(entry => {
      const region = getRegionFromLatLng(entry.lat, entry.lng);
      const genreDisplay = genreMap[entry.genre] || '不明';
      const li = document.createElement("li");

      let travelText = "";
      if (userLat !== null && userLng !== null) {
        const dist = getDistanceKm(userLat, userLng, entry.lat, entry.lng);
        const hours = (dist / 60).toFixed(1);
        console.log("[DEBUG] userLat:" + userLat + "　userLng:" + userLng + "　entry.lat:" + entry.lat + "　entry.lng:" + entry.lng) 
        travelText = `
          <div style="margin-top: 6px;">
            🚗 自宅から <strong>${dist.toFixed(1)}km</strong>、約 <strong>${hours}時間</strong>
          </div>
        `;
      }

      li.innerHTML = `
        <div><strong>${entry.title}</strong>（スコア: ${entry.score}）</div>
        <div><small>${formatDate(entry.answered_at)}</small></div>
        <div>🗾 地方: ${region}　|　📚 ジャンル: ${genreDisplay}</div>
        <div><img src="${entry.image_path}" alt="${entry.title}" style="max-width: 100%; border-radius: 6px; margin: 5px 0;"></div>
        <div>${entry.description}</div>
        ${travelText}
        <hr style="margin: 10px 0;" />
      `;
      ul.appendChild(li);
    });

  } catch (err) {
    ul.innerHTML = "<li>履歴の読み込みに失敗しました。</li>";
    console.error(err);
  }
});

function formatDate(str) {
  const d = new Date(str);
  return d.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
}

function getRegionFromLatLng(lat, lng) {
  if (lat >= 43) return '北海道';
  if (lat >= 38 && lat < 43 && lng >= 139 && lng <= 142) return '東北';
  if (lat >= 35 && lat < 38 && lng >= 138 && lng <= 141) return '関東';
  if (lat >= 35 && lat < 38 && lng >= 136 && lng < 138) return '中部';
  if (lat >= 33.5 && lat < 35 && lng >= 134.5 && lng < 136.5) return '近畿';
  if (lat >= 33.5 && lat < 35 && lng >= 131 && lng < 134.5) return '中国';
  if (lat >= 32 && lat < 34 && lng >= 132 && lng < 134.5) return '四国';
  if (lat >= 30 && lat < 33.5 && lng >= 128 && lng < 132) return '九州';
  if (lat < 30) return '沖縄';
  return 'etc';
}

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
