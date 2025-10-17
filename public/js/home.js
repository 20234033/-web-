// public/js/home.js

window.addEventListener('DOMContentLoaded', async () => {
  // ============= 認証 & /api/me =============
  let user;
  try {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (!res.ok) throw new Error('Unauthorized');
    user = await res.json();

    localStorage.setItem('user_uuid', user.user_uuid);
    localStorage.setItem('username', user.user_name);

    const welcomeEl = document.getElementById('welcome');
    if (welcomeEl) welcomeEl.textContent = `${user.id} さん、ようこそ！`;
  } catch (err) {
    localStorage.clear();
    alert('ログインが必要です。ログインページへ移動します。');
    location.href = 'auth/login.html';
    return;
  }

  // ============= テーマ =============
  document.body.className = localStorage.getItem('theme') || 'light';

  // ============= ボタン/遷移 =============
  document.getElementById('startButton')?.addEventListener('click', () => {
    const region = document.getElementById('region')?.value || 'unspecified';
    const genre  = document.getElementById('genre')?.value  || 'unspecified';
    const mode   = document.getElementById('mode')?.value   || 'search';
    const query  = `region=${region}&genre=${genre}&mode=${mode}`;

    if (mode === 'play') location.href = `play.html?${query}`;
    else if (mode === 'addition') location.href = `addition.html?${query}`;
    else alert('モードが正しく選択されていません。');
  });

  document.getElementById('historyButton')?.addEventListener('click', () => {
    location.href = 'history.html';
  });
  document.getElementById('viewResults')?.addEventListener('click', () => {
    location.href = 'result.html';
  });

  // ============= 右ペイン要素参照 =============
  const lastImageEl = document.getElementById('lastImage');
  const lastScoreEl  = document.getElementById('lastScore');
  const lastGenreEl  = document.getElementById('lastGenre');
  const lastRegionEl = document.getElementById('lastRegion');
  const lastPlaceEl  = document.getElementById('lastPlace');
  const lastInfoEl   = document.getElementById('lastInfo');
  const lastPlayedEl = document.getElementById('lastPlayed');

  // 画像のフェールセーフ
  if (lastImageEl) {
    lastImageEl.onerror = () => {
      lastImageEl.src = 'https://via.placeholder.com/320x200?text=No+Image';
    };
  }

  // 初期プレースホルダ
  setRightPanel({
    score: '--',
    genreLabel: '--',
    regionLabel: '--',
    title: '--',
    description: '--',
    playedAt: '--',
    image: 'https://via.placeholder.com/320x200?text=No+Image'
  });

  // ============= 履歴読み込み（/api/history/:uuid のみ使用） =============
  try {
    const hisRes = await fetch(`/api/history/${user.uuid}`, { credentials: 'include' });
    if (!hisRes.ok) throw new Error('履歴取得HTTP失敗');
    const { success, history = [] } = await hisRes.json();
    if (!success) throw new Error('履歴取得失敗');
    if (!history.length) throw new Error('履歴がありません');

    // 念のため最新順に
    history.sort((a, b) => new Date(b.answered_at) - new Date(a.answered_at));
    const latest = history[0];

    const genreMap = {
      historic: '歴史的建造物',
      nature:   '自然',
      city:     '都市景観',
      culture:  '文化的名所',
    };
    const regionLabel = getRegionFromLatLng(Number(latest.lat), Number(latest.lng));
    const genreLabel  = genreMap[latest.genre] || '不明';

    setRightPanel({
      score: `${latest.score} / 100`,
      genreLabel,
      regionLabel,
      title: latest.title || '--',
      description: latest.description || '--',
      playedAt: new Date(latest.answered_at).toLocaleDateString('ja-JP'),
      image: latest.image_path || 'https://via.placeholder.com/320x200?text=No+Image'
    });
  } catch (e) {
    console.error('履歴読み込み失敗:', e);
    // 失敗時は初期値のまま
  }

  // ============= 地方判定関数 =============
  function getRegionFromLatLng(lat, lng) {
    if (Number.isNaN(lat) || Number.isNaN(lng)) return 'その他';
    if (lat >= 43) return '北海道';
    if (lat >= 38) return '東北';
    if (lat >= 35 && lng >= 138 && lng < 141) return '関東';
    if (lat >= 34 && lng >= 135 && lng < 138) return '中部';
    if (lat >= 34 && lng >= 133 && lng < 135) return '関西';
    if (lat >= 33 && lng >= 130) return '九州';
    if (lat < 30) return '沖縄';
    return 'その他';
  }

  // ============= 右ペイン描画ヘルパ =============
  function setRightPanel({
    score, genreLabel, regionLabel, title, description, playedAt, image
  }) {
    if (lastImageEl && image) lastImageEl.src = image;
    if (lastScoreEl)  lastScoreEl.textContent  = `前回のスコア：${score}`;
    if (lastGenreEl)  lastGenreEl.textContent  = `ジャンル：${genreLabel}`;
    if (lastRegionEl) lastRegionEl.textContent = `地域：${regionLabel}`;
    if (lastPlaceEl)  lastPlaceEl.textContent  = `観光地：${title}`;
    if (lastInfoEl)   lastInfoEl.textContent   = `説明：${description}`;
    if (lastPlayedEl) lastPlayedEl.textContent = `最終プレイ日：${playedAt}`;
  }

  // ============= モードに応じてセレクト無効化 =============
  const modeSelect   = document.getElementById('mode');
  const regionSelect = document.getElementById('region');
  const genreSelect  = document.getElementById('genre');
  function updateSelectStates() {
    const isAddition = modeSelect?.value === 'addition';
    if (regionSelect) regionSelect.disabled = !!isAddition;
    if (genreSelect)  genreSelect.disabled  = !!isAddition;
  }
  updateSelectStates();
  modeSelect?.addEventListener('change', updateSelectStates);

  // ============= 連続ログイン日数 =============
  const streakEl = document.getElementById('streak');
  const today = new Date().toISOString().slice(0, 10);
  const lastLogin = localStorage.getItem('lastLoginDate');
  let streak = parseInt(localStorage.getItem('streakDays') || '0', 10);
  if (lastLogin !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    streak = lastLogin === yesterday ? streak + 1 : 1;
    localStorage.setItem('lastLoginDate', today);
    localStorage.setItem('streakDays', String(streak));
  }
  if (streakEl) streakEl.textContent = `連続ログイン日数：${streak}日`;
});
