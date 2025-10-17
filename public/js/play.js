window.addEventListener('DOMContentLoaded', async () => {
  // 🌙 テーマ適用
  const theme = localStorage.getItem('theme') || 'light';
  document.body.className = theme;

  // ✅ ユーザーUUIDの取得
  let userUuid = null;
  try {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (!res.ok) throw new Error('認証失敗');
    const user = await res.json();
    userUuid = user.uuid;
  } catch (err) {
    alert('ログインが必要です');
    location.href = 'auth/login';
    return;
  }

  // ✅ クエリパラメータ
  const urlParams   = new URLSearchParams(window.location.search);
  const genreParam  = urlParams.get('genre');
  const regionParam = urlParams.get('region');
  console.log('🔍 条件:', { genreParam, regionParam });

  const submitBtn = document.getElementById('submitAnswer');
  submitBtn.disabled = true;

  const map = L.map('map', {
    zoomControl: false,
    attributionControl: false,
  }).setView([35.6895, 139.6917], 3);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  let marker = null;
  let selectedLatLng = null;
  let correctSpot = null;

  function getRegionFromLatLng(lat, lng) {
    if (lat >= 43) return 'hokkaidou';
    if (lat >= 37 && lat < 43 && lng >= 139) return 'touhoku';
    if (lat >= 35 && lat < 37 && lng >= 138 && lng < 141) return 'kantou';
    if (lat >= 34 && lat < 37 && lng >= 136 && lng < 138) return 'chubu';
    if (lat >= 34 && lat < 35 && lng >= 135 && lng < 136) return 'kinki';
    if (lat >= 33 && lat < 35 && lng >= 132 && lng < 135) return 'chugoku';
    if (lat >= 32 && lat < 34 && lng >= 132 && lng < 134) return 'shikoku';
    if (lat >= 30 && lat < 33 && lng >= 129 && lng < 132) return 'kyusyu';
    return 'etc';
  }

  try {
    const res = await fetch(window.location.origin + '/api/spots');
    if (!res.ok) throw new Error(`HTTPエラー: ${res.status} - ${await res.text()}`);
    const json = await res.json();
    const spots = json.data;
    if (!spots || !spots.length) throw new Error('観光地データが空です');

    const filteredSpots = spots.filter(spot => {
      const genreOK = !genreParam || genreParam === 'null' || spot.genre === genreParam;
      const regionName = getRegionFromLatLng(spot.lat, spot.lng);
      const regionOK = !regionParam || regionParam === 'null' || regionName === regionParam;
      return genreOK && regionOK;
    });

    const candidateSpots = filteredSpots.length ? filteredSpots : spots;
    correctSpot = candidateSpots[Math.floor(Math.random() * candidateSpots.length)];

    localStorage.setItem('correctSpot', JSON.stringify(correctSpot));

    const streetView = document.getElementById('streetView');
    try {
      const svRes = await fetch(
        `${window.location.origin}/api/streetview-url?lat=${correctSpot.lat}&lng=${correctSpot.lng}`
      );
      const svData = await svRes.json();
      if (svData.success && streetView) {
        streetView.src = svData.url;
      } else {
        throw new Error('StreetView URL取得に失敗');
      }
    } catch (err) {
      console.warn('StreetView取得失敗:', err);
      if (streetView) {
        streetView.replaceWith(document.createTextNode('📍 Street View を表示できません'));
      }
    }
  } catch (err) {
    console.error('観光地データ読み込み失敗:', err);
    alert('観光地データの読み込みに失敗しました');
    return;
  }

  map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    selectedLatLng = { lat, lng };

    if (marker) {
      marker.setLatLng([lat, lng]);
    } else {
      marker = L.marker([lat, lng]).addTo(map);
    }

    submitBtn.disabled = false;
  });

  function calcDistanceAndScore(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const toRad = deg => deg * (Math.PI / 180);
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = +(R * c).toFixed(2);
    const score = Math.max(0, 100 - Math.round(distanceKm));
    return { distanceKm, score };
  }

  // ✅ 回答送信ボタン
  submitBtn.addEventListener('click', async () => {
    if (!selectedLatLng || !correctSpot) return;

    const { distanceKm, score } = calcDistanceAndScore(
      selectedLatLng.lat,
      selectedLatLng.lng,
      correctSpot.lat,
      correctSpot.lng
    );

    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      score,
    };

    try {
      await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user_uuid: userUuid,
          spot_id: correctSpot.id,
          answer_lat: selectedLatLng.lat,
          answer_lng: selectedLatLng.lng,
          distance_km: distanceKm,
          score
        })
      });
      console.log('✅ DB 保存完了');
    } catch (err) {
      console.warn('DB 保存失敗:', err);
    }

    try {
      const old = JSON.parse(localStorage.getItem('history') || '[]');
      old.push(newEntry);
      localStorage.setItem('history', JSON.stringify(old));
    } catch (err) {
      console.warn('履歴保存失敗:', err);
    }

    localStorage.setItem('lastAnswerCoords', JSON.stringify(selectedLatLng));
    localStorage.setItem('correctCoords', JSON.stringify({
      lat: correctSpot.lat,
      lng: correctSpot.lng,
    }));
    localStorage.setItem('lastScore', score.toString());

    setTimeout(() => {
      location.href = 'result';
    }, 200);
  });
});
