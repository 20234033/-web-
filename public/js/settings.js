// settings.js

// ========== 共通：メッセージ表示ヘルパ ==========
function setMsg(el, text, ok = false) {
  if (!el) return;
  el.className = 'msg ' + (ok ? 'ok' : 'err');
  el.textContent = text || '';
}

// ========== /api/me ロード（ID/メールの表示用） ==========
async function loadMe() {
  try {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (!res.ok) throw new Error('failed to fetch /api/me');
    const me = await res.json();

    const idEl = document.getElementById('currentId');
    const emailEl = document.getElementById('currentEmail');
    if (idEl) idEl.textContent = me.id ?? '--';
    if (emailEl) emailEl.textContent = me.email ?? '--';
  } catch (e) {
    console.error('[me] load error:', e);
  }
}

// ========== ID/メール変更 ==========
async function saveProfile() {
  const username = (document.getElementById('newUsername')?.value || '').trim();
  const email = (document.getElementById('newEmail')?.value || '').trim();
  const currentPassword = document.getElementById('currentPasswordForProfile')?.value || '';
  const msg = document.getElementById('profileMsg');

  setMsg(msg, '');

  if (!username && !email) {
    return setMsg(msg, '変更項目がありません。', false);
  }
  if (!currentPassword) {
    return setMsg(msg, '現在のパスワードを入力してください。', false);
  }

  try {
    const res = await fetch('/api/update_account', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username || undefined,
        email: email || undefined,
        currentPassword
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      return setMsg(msg, text || '更新に失敗しました。', false);
    }

    setMsg(msg, 'アカウント情報を更新しました。', true);
    await loadMe();
    if (document.getElementById('newUsername')) document.getElementById('newUsername').value = '';
    if (document.getElementById('newEmail')) document.getElementById('newEmail').value = '';
    if (document.getElementById('currentPasswordForProfile')) document.getElementById('currentPasswordForProfile').value = '';
  } catch (e) {
    console.error('[saveProfile] error:', e);
    setMsg(msg, '通信エラーが発生しました。', false);
  }
}

// ========== パスワード変更 ==========
async function changePassword() {
  const currentPassword = document.getElementById('currentPassword')?.value || '';
  const newPassword = document.getElementById('newPassword')?.value || '';
  const newPassword2 = document.getElementById('newPassword2')?.value || '';
  const msg = document.getElementById('passwordMsg');

  setMsg(msg, '');

  if (!currentPassword || !newPassword || !newPassword2) {
    return setMsg(msg, '全ての項目を入力してください。', false);
  }
  if (newPassword !== newPassword2) {
    return setMsg(msg, '新しいパスワードが一致しません。', false);
  }

  try {
    const res = await fetch('/api/update_account', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword,
        newPassword
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      return setMsg(msg, text || '変更に失敗しました。', false);
    }

    setMsg(msg, 'パスワードを変更しました。', true);
    if (document.getElementById('currentPassword')) document.getElementById('currentPassword').value = '';
    if (document.getElementById('newPassword')) document.getElementById('newPassword').value = '';
    if (document.getElementById('newPassword2')) document.getElementById('newPassword2').value = '';
  } catch (e) {
    console.error('[changePassword] error:', e);
    setMsg(msg, '通信エラーが発生しました。', false);
  }
}

// ========== 地図まわり ==========
function initMapFeatures() {
  const savedLocationEl = document.getElementById('savedLocationDisplay');
  const deleteLocationBtn = document.getElementById('deleteLocation');
  const locationDisplay = document.getElementById('locationDisplay');
  const confirmBtn = document.getElementById('confirmLocation');
  const addressInput = document.getElementById('addressInput');
  const geocodeBtn = document.getElementById('geocodeBtn');

  // 地図の初期化
  const defaultLatLng = [36.2048, 138.2529]; // Japan center-ish
  const map = L.map('map').setView(defaultLatLng, 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let marker = null;
  let currentLatLng = defaultLatLng;

  // 現在住所の取得
  (async () => {
    try {
      const res = await fetch('/api/user_location', { credentials: 'include' });
      const data = await res.json();
      if (data?.address_lat != null && data?.address_lng != null) {
        currentLatLng = [Number(data.address_lat), Number(data.address_lng)];
        if (savedLocationEl) savedLocationEl.textContent =
          `${Number(data.address_lat).toFixed(5)}, ${Number(data.address_lng).toFixed(5)}`;
      } else {
        if (savedLocationEl) savedLocationEl.textContent = '未設定';
      }
    } catch (err) {
      console.warn('住所取得に失敗:', err);
      if (savedLocationEl) savedLocationEl.textContent = '取得エラー';
    }

    marker = L.marker(currentLatLng, { draggable: true }).addTo(map);
    map.setView(currentLatLng, 6);
    updateDisplay(currentLatLng);
  })();

  // マーカー移動で表示更新
  function updateDisplay([lat, lng]) {
    if (locationDisplay) {
      locationDisplay.textContent = `選択された位置：${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
    }
  }

  // マーカー手動移動
  document.addEventListener('DOMContentLoaded', () => {});
  if (map) {
    map.on('click', (e) => {
      if (!marker) return;
      marker.setLatLng(e.latlng);
      updateDisplay([e.latlng.lat, e.latlng.lng]);
    });
  }
  // ドラッグ
  // Leaflet は marker 生成後でOK
  const attachDragHandler = () => {
    if (!marker) return;
    marker.on('move', (e) => {
      updateDisplay([e.latlng.lat, e.latlng.lng]);
    });
  };
  // 生成後にアタッチ
  const markerTimer = setInterval(() => {
    if (marker) {
      attachDragHandler();
      clearInterval(markerTimer);
    }
  }, 50);

  // 住所の保存
  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      if (!marker) return;
      const latlng = marker.getLatLng();
      try {
        const res = await fetch('/api/user_location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ lat: latlng.lat, lng: latlng.lng })
        });
        if (!res.ok) throw new Error('保存失敗');
        alert('住所を保存しました！');
        if (savedLocationEl) savedLocationEl.textContent =
          `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
      } catch (err) {
        alert('保存に失敗しました。');
        console.error(err);
      }
    });
  }

  // 住所の削除
  if (deleteLocationBtn) {
    deleteLocationBtn.addEventListener('click', async () => {
      if (!confirm('本当に住所を削除しますか？')) return;
      try {
        const res = await fetch('/api/user_location', {
          method: 'DELETE',
          credentials: 'include'
        });
        if (!res.ok) throw new Error('削除失敗');
        alert('住所を削除しました');
        if (savedLocationEl) savedLocationEl.textContent = '未設定';
      } catch (err) {
        alert('住所の削除に失敗しました');
        console.error(err);
      }
    });
  }

  // ジオコーディング（住所 → 緯度経度）
  if (geocodeBtn) {
    geocodeBtn.addEventListener('click', async () => {
      const address = (addressInput?.value || '').trim();
      if (!address) {
        alert('住所を入力してください。');
        return;
      }

      try {
        const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
        const data = await res.json();
        if (!data.success) {
          alert(data.error || '住所が見つかりませんでした。');
          return;
        }

        const newLatLng = [Number(data.address_lat), Number(data.address_lng)];
        if (marker) marker.setLatLng(newLatLng);
        map.setView(newLatLng, 15);
        updateDisplay(newLatLng);
      } catch (err) {
        alert('住所の変換に失敗しました。');
        console.error(err);
      }
    });
  }
}

// ========== 初期化 ==========
window.addEventListener('DOMContentLoaded', async () => {
  // 認証チェック
  try {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (!res.ok) throw new Error('認証失敗');
    await res.json(); // ここでは取得のみ
  } catch (err) {
    alert('ログインが必要です。ログインページへ移動します。');
    window.location.href = 'auth/login';
    return;
  }

  // アカウント情報の表示
  await loadMe();

  // ボタンのイベントバインド（あれば）
  const saveBtn = document.getElementById('saveProfileBtn');
  if (saveBtn) saveBtn.addEventListener('click', saveProfile);

  const changeBtn = document.getElementById('changePasswordBtn');
  if (changeBtn) changeBtn.addEventListener('click', changePassword);

  // 地図機能の初期化
  initMapFeatures();
});
