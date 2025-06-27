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
    // APIから観光地データを取得
    const res = await fetch(window.location.origin + '/api/spots');
    if (!res.ok) {
      throw new Error(`HTTPエラー: ${res.status} - ${await res.text()}`);
    }

    const json = await res.json();
    const spots = json.data;

    if (!spots || !spots.length) throw new Error('観光地データが空です');
    correctSpot = spots[Math.floor(Math.random() * spots.length)];

    // 正解スポットを localStorage に保存
    localStorage.setItem('correctSpot', JSON.stringify(correctSpot));

    // StreetView iframe にURLを設定
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
    if (!selectedLatLng || !correctSpot) {
        console.warn('selectedLatLng または correctSpot が未設定です。');
        return;
    }

    //スコア計算ここからーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
    const queryParamsObject = {
      SelLat: selectedLatLng.lat,
      SelLng: selectedLatLng.lng,
      CorLat: correctSpot.lat,
      CorLng: correctSpot.lng
    };

    const queryParams = new URLSearchParams(queryParamsObject).toString();
    const apiUrl = `${window.location.origin}/api/score?${queryParams}`;
    let scoreData = {};

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`スコア計算APIエラー: ${response.status} - ${await response.text()}`);
      }
      scoreData = await response.json();
    } catch (error) {
      console.error("スコア計算API呼び出しエラー:", error);
      alert('スコア計算APIの呼び出しに失敗しました');
      return;
    }
    //ここまで
    const distanceKm = scoreData.Distance;
    const score = scoreData.score;

    //回答履歴テーブルへの保存ここからーーーーーーーーーーーーーーーーーーーーーーーーーー
    const currentUserId = localStorage.getItem('user_id'); 
    
    if (!currentUserId) {
        alert('ユーザー情報が見つかりません。ログインし直してください。');
        location.href = '../auth/login.html';
        return;
    }

    try {//API呼び出し
      const submitAnswerResponse = await fetch(`${window.location.origin}/api/submit-answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          spotId: correctSpot.spot_id,
          answerLat: selectedLatLng.lat,
          answerLng: selectedLatLng.lng,
          distanceKm: distanceKm,
          score: score,
        }),
      });

      if (!submitAnswerResponse.ok) {
        const errorText = await submitAnswerResponse.text();
        throw new Error(`回答保存APIエラー: ${submitAnswerResponse.status} - ${errorText}`);
      }
      /*
      const submitAnswerJson = await submitAnswerResponse.json();
      console.log('回答が正常に保存されました:', submitAnswerJson);
      */
    } catch (err) {
      console.error('回答のデータベース保存に失敗しました:', err);
      alert('回答の保存中にエラーが発生しました。');
    }
    //ここまでーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー

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

    // 次画面に必要な情報を保存
    localStorage.setItem('lastAnswerCoords', JSON.stringify(selectedLatLng));
    localStorage.setItem('correctCoords', JSON.stringify({
      lat: correctSpot.lat,
      lng: correctSpot.lng,
    }));
    localStorage.setItem('lastScore', score.toString());

    // 結果画面へ遷移
    setTimeout(() => {
      location.href = 'result.html';
    }, 200);
  });
});
