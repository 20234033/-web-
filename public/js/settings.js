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

// ========== 変更用リンク送信（ID / メール / パスワード / 削除） ==========
async function requestChangeLink(kind) {
  // kind: 'username' | 'email' | 'password' | 'delete'
  const msgIdMap = {
    username: 'idChangeMsg',
    email: 'emailChangeMsg',
    password: 'passwordChangeMsg',
    delete: 'deleteAccountMsg', // ★ アカウント削除用
  };

  const msgEl = document.getElementById(msgIdMap[kind]);
  if (!msgEl) {
    console.warn('[requestChangeLink] msg element not found for kind=', kind);
    return;
  }
  setMsg(msgEl, '');

  try {
    const res = await fetch('/api/account/change_link', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind }),
    });

    const text = await res.text();
    if (!res.ok) {
      return setMsg(msgEl, text || 'メール送信に失敗しました。', false);
    }

    const successText =
      kind === 'delete'
        ? '登録メールアドレス宛にアカウント削除用リンクを送信しました。メールをご確認ください。'
        : '登録メールアドレス宛に変更用リンクを送信しました。メールをご確認ください。';

    setMsg(msgEl, successText, true);
  } catch (e) {
    console.error('[requestChangeLink] error:', e);
    setMsg(msgEl, '通信エラーが発生しました。', false);
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
      if (data?.lat != null && data?.lng != null) {
        currentLatLng = [Number(data.lat), Number(data.lng)];
        if (savedLocationEl) {
          savedLocationEl.textContent =
            `${Number(data.lat).toFixed(5)}, ${Number(data.lng).toFixed(5)}`;
        }
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
      locationDisplay.textContent =
        `選択された位置：${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
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

  // ドラッグ（marker生成後にハンドラを付与）
  const attachDragHandler = () => {
    if (!marker) return;
    marker.on('move', (e) => {
      updateDisplay([e.latlng.lat, e.latlng.lng]);
    });
  };
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
        if (savedLocationEl) {
          savedLocationEl.textContent =
            `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
        }
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

        const newLatLng = [Number(data.lat), Number(data.lng)];
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

  // 変更用リンク送信ボタンのイベントバインド
  const idBtn = document.getElementById('sendIdChangeLinkBtn');
  if (idBtn) idBtn.addEventListener('click', () => requestChangeLink('username'));

  const emailBtn = document.getElementById('sendEmailChangeLinkBtn');
  if (emailBtn) emailBtn.addEventListener('click', () => requestChangeLink('email'));

  const pwBtn = document.getElementById('sendPasswordChangeLinkBtn');
  if (pwBtn) pwBtn.addEventListener('click', () => requestChangeLink('password'));

  // ★ アカウント削除用リンク送信ボタン
  const delBtn = document.getElementById('sendDeleteAccountLinkBtn');
  if (delBtn) {
    delBtn.addEventListener('click', () => {
      if (!confirm('本当にアカウント削除用リンクを送信しますか？\nこの後の操作は元に戻せません。')) {
        return;
      }
      requestChangeLink('delete');
    });
  }

  // 地図機能の初期化
  initMapFeatures();
});
