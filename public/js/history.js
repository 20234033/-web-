document.addEventListener("DOMContentLoaded", async () => {
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

      const li = document.createElement("li");
      li.innerHTML = `
        <div><strong>${entry.title}</strong>（スコア: ${entry.score}）</div>
        <div><small>${formatDate(entry.answered_at)}</small></div>
        <div>🗾 地方: ${region}　|　📚 ジャンル: ${entry.genre || '不明'}</div>
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
  if (lat >= 43) return '北海道';
  if (lat >= 38 && lng >= 139) return '東北';
  if (lat >= 35 && lng >= 138 && lng < 141) return '関東';
  if (lat >= 34 && lng >= 135 && lng < 138) return '中部';
  if (lat >= 34 && lng >= 133 && lng < 135) return '関西';
  if (lat >= 33 && lng >= 130) return '九州';
  if (lat < 30) return '沖縄';
  return 'その他';
}
