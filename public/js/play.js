window.addEventListener('DOMContentLoaded', async () => {
  // 🌙 テーマ適用
  const theme = localStorage.getItem('theme') || 'light';
  document.body.className = theme;

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
    correctSpot = spots[Math.floor(Math.random() * spots.length)];

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

  // 地図をクリックして位置を選択
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

  // 回答送信ボタン
  submitBtn.addEventListener('click', async () => {
    if (!selectedLatLng || !correctSpot) return;

    //スコア計算処理ここから
    const baseUrl = window.location.origin;
    const queryParamsObject = {
      SelLat: selectedLatLng.SelLat,
      SelLng: selectedLatLng.SelLng,
      CorLat: correctSpot.CorLat,
      CorLng: correctSpot.CorLng
    };

    const queryParams = new URLSearchParams(queryParamsObject).toString();
    const apiUrl = `${window.location.origin}/api/score?${queryParams}`;
    let data = {};
    try{
      const response = await fetch(apiUrl);
      data = await response.json();
    }catch(error){
      console.error("スコア計算API呼び出しエラー");
      alert('APIの呼び出しに失敗しました')
      return;
    }
    const score = data.score;
    //ここまで

    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      score,
    };

    // 履歴をlocalStorageに保存
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
  /*
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
    */
});
