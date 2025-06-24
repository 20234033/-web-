window.addEventListener('DOMContentLoaded', async () => {
  // 🌙 テーマ適用
  const theme = localStorage.getItem('theme') || 'light';
  document.body.className = theme;

  // ✅ 各ボタン処理
  document.getElementById('startButton')?.addEventListener('click', () => {
    const region = document.getElementById('region')?.value || 'unspecified';
    const genre = document.getElementById('genre')?.value || 'unspecified';
    const mode = document.getElementById('mode')?.value || 'search';

    const query = `region=${region}&genre=${genre}&mode=${mode}`;

    if (mode === "play") {
      location.href = `play.html?${query}`;
    } else if (mode === "addition") {
      location.href = `addition.html?${query}`;
    } else {
      alert("モードが正しく選択されていません。");
    }
  });

  document.getElementById('historyButton')?.addEventListener('click', () => {
    location.href = 'history.html';
  });

  document.getElementById('viewResults')?.addEventListener('click', () => {
    location.href = 'result.html';
  });

  // ✅ ユーザー名
  const username = localStorage.getItem('username');
  const welcomeEl = document.getElementById('welcome');
  if (welcomeEl) {
    if (username) {
      welcomeEl.textContent = `${username} さん、ようこそ！`;
    } else {
      welcomeEl.textContent = `ゲスト さん、ようこそ！`;
    }
  }

  // ✅ 各表示要素を取得
  const lastScoreEl   = document.getElementById('lastScore');
  const lastGenreEl   = document.getElementById('lastGenre');
  const lastRegionEl  = document.getElementById('lastRegion');
  const lastPlaceEl   = document.getElementById('lastPlace');
  const lastInfoEl    = document.getElementById('lastInfo');
  const lastPlayedEl  = document.getElementById('lastPlayed');

  // ✅ 履歴データの読み込みと表示
  try {
    const [historyRes, spotsRes] = await Promise.all([
      fetch('data/history.json'),
      fetch('data/sightseeing.json')
    ]);
    const history = await historyRes.json();
    const spots = await spotsRes.json();

    const latest = history.reduce((a, b) => (a.id > b.id ? a : b));
    const matchedSpot = spots.find(s => s.id === latest.id);

    if (!matchedSpot) throw new Error("該当する観光地が sightseeing.json に見つかりません");

    const region = getRegionFromLatLng(matchedSpot.lat, matchedSpot.lng);

    if (lastScoreEl) lastScoreEl.textContent = `前回のスコア：${latest.score} / 5000`;
    if (lastGenreEl) lastGenreEl.textContent = `ジャンル：${matchedSpot.genre || '--'}`;
    if (lastRegionEl) lastRegionEl.textContent = `地域：${region}`;
    if (lastPlaceEl)  lastPlaceEl.textContent = `観光地：${matchedSpot.title || '--'}`;
    if (lastInfoEl)   lastInfoEl.textContent = `説明：${matchedSpot.description || '--'}`;
    if (lastPlayedEl) lastPlayedEl.textContent = `最終プレイ日：${new Date(latest.timestamp).toLocaleDateString('ja-JP')}`;

  } catch (err) {
    console.error('履歴読み込み失敗', err);
  }

  // ✅ 地方名取得（簡易版）
  function getRegionFromLatLng(lat, lng) {
    if (lat >= 43) return '北海道';
    if (lat >= 38) return '東北';
    if (lat >= 35 && lng >= 138 && lng < 141) return '関東';
    if (lat >= 34 && lng >= 135 && lng < 138) return '中部';
    if (lat >= 34 && lng >= 133 && lng < 135) return '関西';
    if (lat >= 33 && lng >= 130) return '九州';
    if (lat < 30) return '沖縄';
    return 'その他';
  }

  // ✅ 連続ログイン日数処理
  const streakEl = document.getElementById('streak');
  const today = new Date().toISOString().slice(0, 10);
  const lastLogin = localStorage.getItem('lastLoginDate');
  let streak = parseInt(localStorage.getItem('streakDays') || '0');

  if (lastLogin !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    streak = lastLogin === yesterday ? streak + 1 : 1;
    localStorage.setItem('lastLoginDate', today);
    localStorage.setItem('streakDays', streak.toString());
  }

  if (streakEl) streakEl.textContent = `連続ログイン日数：${streak}日`;

  // ✅ アバターの表示と変更
  const avatarImg = document.getElementById('avatar');
  const avatarInput = document.getElementById('avatarInput');

  if (avatarInput && avatarImg) {
    const savedAvatar = localStorage.getItem('avatarImage');
    if (savedAvatar) avatarImg.src = savedAvatar;

    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        avatarImg.src = reader.result;
        localStorage.setItem('avatarImage', reader.result);
      };
      reader.readAsDataURL(file);
    });
  }
});
