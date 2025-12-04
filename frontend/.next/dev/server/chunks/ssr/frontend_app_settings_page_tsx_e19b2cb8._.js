module.exports = [
"[project]/frontend/app/settings/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SettingPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
;
;
function SettingPage() {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // ========== 共通：メッセージ表示ヘルパ ==========
        function setMsg(el, text, ok = false) {
            if (!el) return;
            el.className = 'msg ' + (ok ? 'ok' : 'err');
            el.textContent = text || '';
        }
        // ========== /api/me ロード（ID/メールの表示用） ==========
        async function loadMe() {
            try {
                const res = await fetch('/api/me', {
                    credentials: 'include'
                });
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
            const msgIdMap = {
                username: 'idChangeMsg',
                email: 'emailChangeMsg',
                password: 'passwordChangeMsg',
                delete: 'deleteAccountMsg'
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
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        kind
                    })
                });
                const text = await res.text();
                if (!res.ok) {
                    return setMsg(msgEl, text || 'メール送信に失敗しました。', false);
                }
                const successText = kind === 'delete' ? '登録メールアドレス宛にアカウント削除用リンクを送信しました。メールをご確認ください。' : '登録メールアドレス宛に変更用リンクを送信しました。メールをご確認ください。';
                setMsg(msgEl, successText, true);
            } catch (e) {
                console.error('[requestChangeLink] error:', e);
                setMsg(msgEl, '通信エラーが発生しました。', false);
            }
        }
        // ========== 地図まわり ==========
        async function initMapFeatures() {
            const savedLocationEl = document.getElementById('savedLocationDisplay');
            const deleteLocationBtn = document.getElementById('deleteLocation');
            const locationDisplay = document.getElementById('locationDisplay');
            const confirmBtn = document.getElementById('confirmLocation');
            const addressInput = document.getElementById('addressInput');
            const geocodeBtn = document.getElementById('geocodeBtn');
            // Leaflet を動的 import
            const leafletModule = await __turbopack_context__.A("[project]/frontend/node_modules/leaflet/dist/leaflet-src.js [app-ssr] (ecmascript, async loader)");
            const L = leafletModule.default ?? leafletModule;
            // 地図の初期化
            const defaultLatLng = [
                36.2048,
                138.2529
            ]; // Japan center-ish
            const map = L.map('map').setView(defaultLatLng, 5);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);
            let marker = null;
            let currentLatLng = defaultLatLng;
            // 現在住所の取得
            (async ()=>{
                try {
                    const res = await fetch('/api/user_location', {
                        credentials: 'include'
                    });
                    const data = await res.json();
                    if (data?.lat != null && data?.lng != null) {
                        currentLatLng = [
                            Number(data.lat),
                            Number(data.lng)
                        ];
                        if (savedLocationEl) {
                            savedLocationEl.textContent = `${Number(data.lat).toFixed(5)}, ${Number(data.lng).toFixed(5)}`;
                        }
                    } else {
                        if (savedLocationEl) savedLocationEl.textContent = '未設定';
                    }
                } catch (err) {
                    console.warn('住所取得に失敗:', err);
                    if (savedLocationEl) savedLocationEl.textContent = '取得エラー';
                }
                marker = L.marker(currentLatLng, {
                    draggable: true
                }).addTo(map);
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
            if (map) {
                map.on('click', (e)=>{
                    if (!marker) return;
                    marker.setLatLng(e.latlng);
                    updateDisplay([
                        e.latlng.lat,
                        e.latlng.lng
                    ]);
                });
            }
            // ドラッグ（marker生成後にハンドラを付与）
            const attachDragHandler = ()=>{
                if (!marker) return;
                marker.on('move', (e)=>{
                    updateDisplay([
                        e.latlng.lat,
                        e.latlng.lng
                    ]);
                });
            };
            const markerTimer = window.setInterval(()=>{
                if (marker) {
                    attachDragHandler();
                    clearInterval(markerTimer);
                }
            }, 50);
            // 住所の保存
            if (confirmBtn) {
                confirmBtn.addEventListener('click', async ()=>{
                    if (!marker) return;
                    const latlng = marker.getLatLng();
                    try {
                        const res = await fetch('/api/user_location', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            credentials: 'include',
                            body: JSON.stringify({
                                lat: latlng.lat,
                                lng: latlng.lng
                            })
                        });
                        if (!res.ok) throw new Error('保存失敗');
                        alert('住所を保存しました！');
                        if (savedLocationEl) {
                            savedLocationEl.textContent = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
                        }
                    } catch (err) {
                        alert('保存に失敗しました。');
                        console.error(err);
                    }
                });
            }
            // 住所の削除
            if (deleteLocationBtn) {
                deleteLocationBtn.addEventListener('click', async ()=>{
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
                geocodeBtn.addEventListener('click', async ()=>{
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
                        const newLatLng = [
                            Number(data.lat),
                            Number(data.lng)
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
        // ========== 初期化（元の window.addEventListener('DOMContentLoaded', ...) 相当） ==========
        (async ()=>{
            // 認証チェック
            try {
                const res = await fetch('/api/me', {
                    credentials: 'include'
                });
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
            if (idBtn) idBtn.addEventListener('click', ()=>requestChangeLink('username'));
            const emailBtn = document.getElementById('sendEmailChangeLinkBtn');
            if (emailBtn) emailBtn.addEventListener('click', ()=>requestChangeLink('email'));
            const pwBtn = document.getElementById('sendPasswordChangeLinkBtn');
            if (pwBtn) pwBtn.addEventListener('click', ()=>requestChangeLink('password'));
            // ★ アカウント削除用リンク送信ボタン
            const delBtn = document.getElementById('sendDeleteAccountLinkBtn');
            if (delBtn) {
                delBtn.addEventListener('click', ()=>{
                    if (!confirm('本当にアカウント削除用リンクを送信しますか？\nこの後の操作は元に戻せません。')) {
                        return;
                    }
                    requestChangeLink('delete');
                });
            }
            // currentId / currentEmail を 2 箇所に反映（元HTMLの <script> 部分）
            const mainId = document.getElementById('currentId');
            const linkId = document.getElementById('currentIdDisplayForLink');
            const mainEmail = document.getElementById('currentEmail');
            const linkEmail = document.getElementById('currentEmailDisplayForLink');
            const sync = ()=>{
                if (mainId && linkId) linkId.textContent = mainId.textContent;
                if (mainEmail && linkEmail) linkEmail.textContent = mainEmail.textContent;
            };
            sync();
            setTimeout(sync, 500);
            setTimeout(sync, 1500);
            // 地図機能の初期化
            await initMapFeatures();
        })();
    }, []);
    // JSX 側はほぼ元HTMLそのまま
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                id: "navbar-placeholder"
            }, void 0, false, {
                fileName: "[project]/frontend/app/settings/page.tsx",
                lineNumber: 350,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "settings-container",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        children: "⚙ 設定"
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/settings/page.tsx",
                        lineNumber: 353,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "setting-section",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                children: "📍 住所の設定（地図でピンを動かす）："
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/settings/page.tsx",
                                lineNumber: 357,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                id: "map",
                                style: {
                                    height: 400
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/settings/page.tsx",
                                lineNumber: 358,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                id: "locationDisplay",
                                children: "選択された位置：--"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/settings/page.tsx",
                                lineNumber: 359,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                id: "confirmLocation",
                                children: "✅ この位置を保存"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/settings/page.tsx",
                                lineNumber: 360,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/settings/page.tsx",
                        lineNumber: 356,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            margin: '10px 0'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                id: "addressInput",
                                placeholder: "住所を入力してください",
                                style: {
                                    width: 400,
                                    height: 40,
                                    fontSize: '1rem',
                                    padding: 6
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/settings/page.tsx",
                                lineNumber: 365,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                id: "geocodeBtn",
                                children: "🔍 ピンを住所に移動"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/settings/page.tsx",
                                lineNumber: 376,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/settings/page.tsx",
                        lineNumber: 364,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "setting-section",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                children: "📍 現在設定されている住所："
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/settings/page.tsx",
                                lineNumber: 381,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "location-display-row",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        id: "savedLocationDisplay",
                                        className: "location-text",
                                        children: "--"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/settings/page.tsx",
                                        lineNumber: 383,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        id: "deleteLocation",
                                        className: "delete-btn",
                                        children: "🗑️ 削除"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/settings/page.tsx",
                                        lineNumber: 389,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/settings/page.tsx",
                                lineNumber: 382,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/settings/page.tsx",
                        lineNumber: 380,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "setting-section",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                children: "👤 アカウント情報"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/settings/page.tsx",
                                lineNumber: 400,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "field-row",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: "現在のID："
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/settings/page.tsx",
                                        lineNumber: 403,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        id: "currentId",
                                        children: "--"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/settings/page.tsx",
                                        lineNumber: 404,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/settings/page.tsx",
                                lineNumber: 402,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "field-row",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: "現在のメール："
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/settings/page.tsx",
                                        lineNumber: 407,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        id: "currentEmail",
                                        children: "--"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/settings/page.tsx",
                                        lineNumber: 408,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/settings/page.tsx",
                                lineNumber: 406,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/settings/page.tsx",
                        lineNumber: 399,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "setting-section",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                children: "✏️ アカウント情報の変更"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/settings/page.tsx",
                                lineNumber: 414,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "row",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            "現在のID：",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                id: "currentIdDisplayForLink",
                                                children: "--"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/settings/page.tsx",
                                                lineNumber: 420,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/app/settings/page.tsx",
                                        lineNumber: 418,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        id: "sendIdChangeLinkBtn",
                                        children: "ID変更用リンクを送信"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/settings/page.tsx",
                                        lineNumber: 422,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/settings/page.tsx",
                                lineNumber: 417,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                id: "idChangeMsg",
                                className: "msg"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/settings/page.tsx",
                                lineNumber: 426,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "row",
                                style: {
                                    marginTop: 8
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            "現在のメールアドレス：",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                id: "currentEmailDisplayForLink",
                                                children: "--"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/settings/page.tsx",
                                                lineNumber: 432,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/app/settings/page.tsx",
                                        lineNumber: 430,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        id: "sendEmailChangeLinkBtn",
                                        children: "メール変更用リンクを送信"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/settings/page.tsx",
                                        lineNumber: 434,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/settings/page.tsx",
                                lineNumber: 429,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                id: "emailChangeMsg",
                                className: "msg"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/settings/page.tsx",
                                lineNumber: 438,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "row",
                                style: {
                                    marginTop: 8
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: "現在のパスワード：••••••••"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/settings/page.tsx",
                                        lineNumber: 442,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        id: "sendPasswordChangeLinkBtn",
                                        children: "パスワード変更用リンクを送信"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/settings/page.tsx",
                                        lineNumber: 443,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/settings/page.tsx",
                                lineNumber: 441,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                id: "passwordChangeMsg",
                                className: "msg"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/settings/page.tsx",
                                lineNumber: 447,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "row",
                                style: {
                                    marginTop: 16
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: "アカウントの削除："
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/settings/page.tsx",
                                        lineNumber: 451,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        id: "sendDeleteAccountLinkBtn",
                                        className: "danger-btn",
                                        children: "アカウント削除用リンクを送信"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/settings/page.tsx",
                                        lineNumber: 452,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/settings/page.tsx",
                                lineNumber: 450,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                id: "deleteAccountMsg",
                                className: "msg"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/settings/page.tsx",
                                lineNumber: 459,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/settings/page.tsx",
                        lineNumber: 413,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/app/settings/page.tsx",
                lineNumber: 352,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
}),
];

//# sourceMappingURL=frontend_app_settings_page_tsx_e19b2cb8._.js.map