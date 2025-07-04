document.addEventListener("DOMContentLoaded", async () => {
  const genreMap = {
  historic: '歴史的建造物',
  nature: '自然',
  city: '都市景観',
  culture: '文化的名所'
};

  const ul = document.getElementById("history-ul");
  if (!ul) return;

  const userId = localStorage.getItem('user_id');
  if (!userId) {
    ul.innerHTML = "<li>ユーザーIDが見つかりません。</li>";
    return;
  }

  try {
    const res = await fetch(`/api/history/${userId}`);
    const data = await res.json();

    if (!data.success || !data.history || data.history.length === 0) {
      ul.innerHTML = "<li>履歴がありません。</li>";
      return;
    }

data.history.forEach(entry => {
  const region = getRegionFromLatLng(entry.lat, entry.lng);
  const genreDisplay = genreMap[entry.genre] || '不明';

  const li = document.createElement("li");
  li.innerHTML = `
    <div><strong>${entry.title}</strong>（スコア: ${entry.score}）</div>
    <div><small>${formatDate(entry.answered_at)}</small></div>
    <div>🗾 地方: ${region}　|　📚 ジャンル: ${genreDisplay}</div>
    <div><img src="${entry.image_path}" alt="${entry.title}" style="max-width: 100%; border-radius: 6px; margin: 5px 0;"></div>
    <div>${entry.description}</div>
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
  if (lat >= 43) {
    return '北海道';
  } else if (lat >= 38 && lat < 43 && lng >= 139 && lng <= 142) {
    return '東北';
  } else if (lat >= 35 && lat < 38 && lng >= 138 && lng <= 141) {
    return '関東';
  } else if (lat >= 35 && lat < 38 && lng >= 136 && lng < 138) {
    return '中部';
  } else if (lat >= 33.5 && lat < 35 && lng >= 134.5 && lng < 136.5) {
    return '近畿';
  } else if (lat >= 33.5 && lat < 35 && lng >= 131 && lng < 134.5) {
    return '中国';
  } else if (lat >= 32 && lat < 34 && lng >= 132 && lng < 134.5) {
    return '四国';
  } else if (lat >= 30 && lat < 33.5 && lng >= 128 && lng < 132) {
    return '九州';
  } else if (lat < 30) {
    return '沖縄';
  } else {
    return 'etc';
  }
}

