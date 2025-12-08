'use client';

import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css'; // 元HTMLの <link rel="stylesheet" ...> 相当

export default function SettingPage() {
  useEffect(() => {
    // ========== 共通：メッセージ表示ヘルパ ==========
    function setMsg(el: HTMLElement | null, text: string, ok = false) {
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
    async function requestChangeLink(
      kind: 'username' | 'email' | 'password' | 'delete',
    ) {
      const msgIdMap: Record<
        'username' | 'email' | 'password' | 'delete',
        string
      > = {
        username: 'idChangeMsg',
        email: 'emailChangeMsg',
        password: 'passwordChangeMsg',
        delete: 'deleteAccountMsg',
      };

      const msgEl = document.getElementById(msgIdMap[kind]);
      if (!msgEl) {
        console.warn(
          '[requestChangeLink] msg element not found for kind=',
          kind,
        );
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
          return setMsg(
            msgEl,
            text || 'メール送信に失敗しました。',
            false,
          );
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
    async function initMapFeatures() {
      const savedLocationEl = document.getElementById(
        'savedLocationDisplay',
      ) as HTMLElement | null;
      const deleteLocationBtn = document.getElementById(
        'deleteLocation',
      ) as HTMLButtonElement | null;
      const locationDisplay = document.getElementById(
        'locationDisplay',
      ) as HTMLElement | null;
      const confirmBtn = document.getElementById(
        'confirmLocation',
      ) as HTMLButtonElement | null;
      const addressInput = document.getElementById(
        'addressInput',
      ) as HTMLInputElement | null;
      const geocodeBtn = document.getElementById(
        'geocodeBtn',
      ) as HTMLButtonElement | null;

      // Leaflet を動的 import
      const leafletModule = await import('leaflet');
      const L: any = (leafletModule as any).default ?? leafletModule;

      // 地図の初期化
      const defaultLatLng: [number, number] = [36.2048, 138.2529];
      const map = L.map('map').setView(defaultLatLng, 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      let marker: any = null;
      let currentLatLng: [number, number] = defaultLatLng;

      // 現在住所の取得
      (async () => {
        try {
          const res = await fetch('/api/user_location', {
            credentials: 'include',
          });
          const data = await res.json();
          if (data?.lat != null && data?.lng != null) {
            currentLatLng = [Number(data.lat), Number(data.lng)];
            if (savedLocationEl) {
              savedLocationEl.textContent = `${Number(data.lat).toFixed(
                5,
              )}, ${Number(data.lng).toFixed(5)}`;
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

      function updateDisplay([lat, lng]: [number, number]) {
        if (locationDisplay) {
          locationDisplay.textContent = `選択された位置：${Number(
            lat,
          ).toFixed(5)}, ${Number(lng).toFixed(5)}`;
        }
      }

      if (map) {
        map.on('click', (e: any) => {
          if (!marker) return;
          marker.setLatLng(e.latlng);
          updateDisplay([e.latlng.lat, e.latlng.lng]);
        });
      }

      const attachDragHandler = () => {
        if (!marker) return;
        marker.on('move', (e: any) => {
          updateDisplay([e.latlng.lat, e.latlng.lng]);
        });
      };
      const markerTimer = window.setInterval(() => {
        if (marker) {
          attachDragHandler();
          clearInterval(markerTimer);
        }
      }, 50);

      if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
          if (!marker) return;
          const latlng = marker.getLatLng();
          try {
            const res = await fetch('/api/user_location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                lat: latlng.lat,
                lng: latlng.lng,
              }),
            });
            if (!res.ok) throw new Error('保存失敗');
            alert('住所を保存しました！');
            if (savedLocationEl) {
              savedLocationEl.textContent = `${latlng.lat.toFixed(
                5,
              )}, ${latlng.lng.toFixed(5)}`;
            }
          } catch (err) {
            alert('保存に失敗しました。');
            console.error(err);
          }
        });
      }

      if (deleteLocationBtn) {
        deleteLocationBtn.addEventListener('click', async () => {
          if (!confirm('本当に住所を削除しますか？')) return;
          try {
            const res = await fetch('/api/user_location', {
              method: 'DELETE',
              credentials: 'include',
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

      if (geocodeBtn) {
        geocodeBtn.addEventListener('click', async () => {
          const address = (addressInput?.value || '').trim();
          if (!address) {
            alert('住所を入力してください。');
            return;
          }

          try {
            const res = await fetch(
              `/api/geocode?address=${encodeURIComponent(address)}`,
            );
            const data = await res.json();
            if (!data.success) {
              alert(data.error || '住所が見つかりませんでした。');
              return;
            }

            const newLatLng: [number, number] = [
              Number(data.lat),
              Number(data.lng),
            ];
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

    (async () => {
      // 認証チェック
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (!res.ok) throw new Error('認証失敗');
        await res.json();
      } catch (err) {
        alert('ログインが必要です。ログインページへ移動します。');
        window.location.href = 'auth/login';
        return;
      }

      await loadMe();

      const idBtn = document.getElementById(
        'sendIdChangeLinkBtn',
      ) as HTMLButtonElement | null;
      if (idBtn)
        idBtn.addEventListener('click', () =>
          requestChangeLink('username'),
        );

      const emailBtn = document.getElementById(
        'sendEmailChangeLinkBtn',
      ) as HTMLButtonElement | null;
      if (emailBtn)
        emailBtn.addEventListener('click', () =>
          requestChangeLink('email'),
        );

      const pwBtn = document.getElementById(
        'sendPasswordChangeLinkBtn',
      ) as HTMLButtonElement | null;
      if (pwBtn)
        pwBtn.addEventListener('click', () =>
          requestChangeLink('password'),
        );

      const delBtn = document.getElementById(
        'sendDeleteAccountLinkBtn',
      ) as HTMLButtonElement | null;
      if (delBtn) {
        delBtn.addEventListener('click', () => {
          if (
            !confirm(
              '本当にアカウント削除用リンクを送信しますか？\nこの後の操作は元に戻せません。',
            )
          ) {
            return;
          }
          requestChangeLink('delete');
        });
      }

      const mainId = document.getElementById(
        'currentId',
      ) as HTMLElement | null;
      const linkId = document.getElementById(
        'currentIdDisplayForLink',
      ) as HTMLElement | null;
      const mainEmail = document.getElementById(
        'currentEmail',
      ) as HTMLElement | null;
      const linkEmail = document.getElementById(
        'currentEmailDisplayForLink',
      ) as HTMLElement | null;

      const sync = () => {
        if (mainId && linkId) linkId.textContent = mainId.textContent;
        if (mainEmail && linkEmail)
          linkEmail.textContent = mainEmail.textContent;
      };

      sync();
      setTimeout(sync, 500);
      setTimeout(sync, 1500);

      await initMapFeatures();
    })();
  }, []);

  return (
    <>
      <div id="navbar-placeholder"></div>

      {/* ★ ナビバー高さ分の余白をとるラッパ */}
      <div className="settings-page-root">
        <div className="settings-container">
          <h1>⚙ 設定</h1>

          <div className="setting-section">
            <label>📍 住所の設定（地図でピンを動かす）：</label>
            <div id="map" style={{ height: 400 }}></div>
            <p id="locationDisplay">選択された位置：--</p>
            <button id="confirmLocation">✅ この位置を保存</button>
          </div>

          <div style={{ margin: '10px 0' }}>
            <input
              type="text"
              id="addressInput"
              placeholder="住所を入力してください"
              style={{
                width: 400,
                height: 40,
                fontSize: '1rem',
                padding: 6,
              }}
            />
            <button id="geocodeBtn">🔍 ピンを住所に移動</button>
          </div>

          <div className="setting-section">
            <label>📍 現在設定されている住所：</label>
            <div className="location-display-row">
              <p id="savedLocationDisplay" className="location-text">
                --
              </p>
              <button id="deleteLocation" className="delete-btn">
                🗑️ 削除
              </button>
            </div>
          </div>

          <div className="setting-section">
            <h2>👤 アカウント情報</h2>

            <div className="field-row">
              <label>現在のID：</label>
              <span id="currentId">--</span>
            </div>
            <div className="field-row">
              <label>現在のメール：</label>
              <span id="currentEmail">--</span>
            </div>
          </div>

          <div className="setting-section">
            <h3>✏️ アカウント情報の変更</h3>

            <div className="row">
              <div>
                現在のID：
                <span id="currentIdDisplayForLink">--</span>
              </div>
              <button id="sendIdChangeLinkBtn">
                ID変更用リンクを送信
              </button>
            </div>
            <div id="idChangeMsg" className="msg"></div>

            <div className="row" style={{ marginTop: 8 }}>
              <div>
                現在のメールアドレス：
                <span id="currentEmailDisplayForLink">--</span>
              </div>
              <button id="sendEmailChangeLinkBtn">
                メール変更用リンクを送信
              </button>
            </div>
            <div id="emailChangeMsg" className="msg"></div>

            <div className="row" style={{ marginTop: 8 }}>
              <div>現在のパスワード：••••••••</div>
              <button id="sendPasswordChangeLinkBtn">
                パスワード変更用リンクを送信
              </button>
            </div>
            <div id="passwordChangeMsg" className="msg"></div>

            <div className="row" style={{ marginTop: 16 }}>
              <div>アカウントの削除：</div>
              <button
                id="sendDeleteAccountLinkBtn"
                className="danger-btn"
              >
                アカウント削除用リンクを送信
              </button>
            </div>
            <div id="deleteAccountMsg" className="msg"></div>
          </div>
        </div>
      </div>
    </>
  );
}
