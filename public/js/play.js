window.addEventListener('DOMContentLoaded', async () => {

function getRegionFromLatLng(lat, lng) {
  if (lat >= 43) {
    return 'hokkaidou';
  } else if (lat >= 37 && lat < 43 && lng >= 139) {
    return 'touhoku';
  } else if (lat >= 35 && lat < 37 && lng >= 138 && lng < 141) {
    return 'kantou';
  } else if (lat >= 34 && lat < 37 && lng >= 136 && lng < 138) {
    return 'chubu';
  } else if (lat >= 34 && lat < 35 && lng >= 135 && lng < 136) {
    return 'kinki';
  } else if (lat >= 33 && lat < 35 && lng >= 132 && lng < 135) {
    return 'chugoku';
  } else if (lat >= 32 && lat < 34 && lng >= 132 && lng < 134) {
    return 'shikoku';
  } else if (lat >= 30 && lat < 33 && lng >= 129 && lng < 132) {
    return 'kyusyu';
  } else {
    return 'etc';
  }
}



  // 🌙 テーマ適用
  const theme = localStorage.getItem('theme') || 'light';
  document.body.className = theme;

  // ✅ ① クエリパラメータ取得をここに追加
  const urlParams   = new URLSearchParams(window.location.search);
  const genreParam  = urlParams.get('genre');
  const regionParam = urlParams.get('region');
  console.log('🔍 条件:', { genreParam, regionParam });

  const submitBtn = document.getElementById('submitAnswer');
  submitBtn.disabled = true;

  const map = L.map('map', {
    zoomControl: false,
    attributionControl: false,
  }).setView([35.6895, 139.6917], 3); // 東京を中心に初期表示

  // OSMタイルレイヤー
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  let marker = null;
  let selectedLatLng = null;
  let correctSpot = null;

  try {
    // ✅ APIから観光地データを取得
    const res = await fetch(window.location.origin + '/api/spots');
    if (!res.ok) {
      throw new Error(`HTTPエラー: ${res.status} - ${await res.text()}`);
    }

    const json = await res.json();
    const spots = json.data;

    if (!spots || !spots.length) throw new Error('観光地データが空です');
        // ✅ ③ フィルタ処理をここに追加（追記ポイント）
    const filteredSpots = spots.filter(spot => {
      const genreOK = !genreParam || genreParam === 'null' || spot.genre === genreParam;

      const regionName = getRegionFromLatLng(spot.lat, spot.lng);
      const regionOK = !regionParam || regionParam === 'null' || regionName === regionParam;

      return genreOK && regionOK;
    });

    const candidateSpots = filteredSpots.length ? filteredSpots : spots;
    correctSpot = candidateSpots[Math.floor(Math.random() * candidateSpots.length)];
    //correctSpot = spots[Math.floor(Math.random() * spots.length)];

    // ✅ 正解スポットを localStorage に保存
    localStorage.setItem('correctSpot', JSON.stringify(correctSpot));

    // ✅ StreetView iframe にURLを設定
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
  const username = localStorage.getItem('username');
  if (!username) {
    alert('ログインが必要です');
    location.href = 'auth/login.html';
    return;
  }


  // ✅ 地図をクリックして位置を選択
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
  const R = 6371; // 地球の半径（km）
  const toRad = deg => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = +(R * c).toFixed(2); // 小数点2桁に丸め

  const score = Math.max(0, 100 - Math.round(distanceKm));
  return { distanceKm, score };
}


  // ✅ 回答送信ボタン
  submitBtn.addEventListener('click', async () => {
    if (!selectedLatLng || !correctSpot) return;

  // 距離とスコアを両方計算
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

 /* ──────────────── 🔽 ① DB へ保存 ──────────────── */
 try {
   // 👤 ログイン済みなら cookie/JWT から userId を取り出す想定
   const userId = localStorage.getItem('user_id') || 'guest';

   await fetch('/api/answer', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       user_id: userId,
       spot_id: correctSpot.id,    // ← spots テーブルの主キー
       answer_lat: selectedLatLng.lat,
       answer_lng: selectedLatLng.lng,
       distance_km: distanceKm,         // 小数点 2 桁で OK
       score
     })
   });
   console.log('✅ DB 保存完了');
 } catch (err) {
   console.warn('DB 保存失敗:', err);
 }
 /* ─────────────────────────────────────────────── */
 

    // 🔄 履歴を localStorage に保存
    try {
      const old = JSON.parse(localStorage.getItem('history') || '[]');
      old.push(newEntry);
      localStorage.setItem('history', JSON.stringify(old));
    } catch (err) {
      console.warn('履歴保存失敗:', err);
    }

    // ✅ 次画面に必要な情報を保存
    localStorage.setItem('lastAnswerCoords', JSON.stringify(selectedLatLng));
    localStorage.setItem('correctCoords', JSON.stringify({
      lat: correctSpot.lat,
      lng: correctSpot.lng,
    }));
    localStorage.setItem('lastScore', score.toString());

    // ✅ 結果画面へ遷移
    setTimeout(() => {
      location.href = 'result.html';
    }, 200);
  });
  // ✅ スコア計算（ハバーサイン距離を使用）
  function calculateScore(lat1, lng1, lat2, lng2) {
    const R = 6371; // 地球の半径 km
    const toRad = deg => deg * (Math.PI / 180);
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.max(0, 100 - Math.round(distance));
  }
});

