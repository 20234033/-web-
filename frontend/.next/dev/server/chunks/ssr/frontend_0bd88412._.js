module.exports = [
"[project]/frontend/app/result/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ResultPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$script$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/script.js [app-ssr] (ecmascript)");
'use client';
;
;
;
function ResultPage() {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // ===== CSS を注入（元の <style> 相当） =====
        const existingStyle = document.getElementById('result-style');
        if (!existingStyle) {
            const style = document.createElement('style');
            style.id = 'result-style';
            style.textContent = `
    :root {
      --nav-h: 56px;
    }

    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
      font-family: 'Orbitron', sans-serif;
      overflow: hidden;
    }

    #navbar-placeholder {
      z-index: 2000;
    }

    #result-layout {
      position: fixed;
      top: var(--nav-h, 56px);
      left: 0;
      right: 0;
      bottom: 0;

      display: flex;
      gap: 12px;
      align-items: stretch;

      padding: 8px;
      box-sizing: border-box;
      overflow: hidden;
      margin: 0;
    }

    #result-sidebar {
      width: clamp(260px, 28vw, 340px);
      height: 100%;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;

      padding-right: 6px;
      padding-top: var(--sidebar-pad, 14px);

      border-radius: 12px;
      border: 1px solid transparent;
      background: transparent;
    }

    #scoreText { padding: 12px; }
    #place-info { margin-top: 16px; }

    #map-wrap {
      flex: 1 1 auto;
      min-width: 0;
      height: 100%;
      min-height: 0;
      overflow: hidden;
    }

    #result-map {
      width: 100%;
      height: 100%;
    }

    .streetview-frame {
      width: 100%;
      height: 200px;
      border: 0;
      border-radius: 12px;
      transition: transform .2s ease;
    }
    .streetview-frame:hover {
      transform: scale(1.02);
    }
      `;
            document.head.appendChild(style);
        }
        // Leaflet の CSS を（念のため）注入
        if (!document.querySelector('link[href*="leaflet.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }
        // ========= 数学ユーティリティ =========
        const getDistanceKm = (lat1, lon1, lat2, lon2)=>{
            const R = 6371;
            const toRad = (d)=>d * Math.PI / 180;
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
            return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };
        const decodePolyline = (encoded)=>{
            const pts = [];
            let i = 0;
            let lat = 0;
            let lng = 0;
            while(i < encoded.length){
                let b;
                let shift = 0;
                let result = 0;
                do {
                    b = encoded.charCodeAt(i++) - 63;
                    result |= (b & 0x1f) << shift;
                    shift += 5;
                }while (b >= 0x20)
                const dlat = result & 1 ? ~(result >> 1) : result >> 1;
                lat += dlat;
                shift = 0;
                result = 0;
                do {
                    b = encoded.charCodeAt(i++) - 63;
                    result |= (b & 0x1f) << shift;
                    shift += 5;
                }while (b >= 0x20)
                const dlng = result & 1 ? ~(result >> 1) : result >> 1;
                lng += dlng;
                pts.push([
                    lat / 1e5,
                    lng / 1e5
                ]);
            }
            return pts;
        };
        // ========= Street View 埋め込みヘルパ =========
        const buildStreetViewEmbedURL = (lat, lng)=>{
            const L = encodeURIComponent(lat);
            const G = encodeURIComponent(lng);
            return `https://www.google.com/maps?q=&layer=c&cbll=${L},${G}&cbp=11,0,0,0,0&output=svembed`;
        };
        const isEmbeddableGoogleURL = (url)=>{
            if (!url) return false;
            try {
                const u = new URL(url);
                return u.hostname.endsWith('google.com') && (u.pathname.includes('/maps/embed') || u.searchParams.get('output') === 'svembed');
            } catch  {
                return false;
            }
        };
        // ========= テーマ / ナビまわり =========
        const isDarkSiteTheme = ()=>document.body.classList.contains('dark');
        let resultMap = null;
        const measureAndApplyNavHeight = ()=>{
            const host = document.getElementById('navbar-placeholder');
            const navEl = host && host.firstElementChild ? host.firstElementChild : host;
            const navH = Math.max(0, Math.round(navEl?.getBoundingClientRect().height || 56));
            document.documentElement.style.setProperty('--nav-h', `${navH}px`);
            if (host) host.style.height = `${navH}px`;
            if (resultMap) {
                setTimeout(()=>{
                    resultMap.invalidateSize();
                }, 0);
            }
        };
        // ========= 下部ボタン & 画面遷移 =========
        const retry = ()=>{
            const fromAddition = localStorage.getItem('fromAddition');
            localStorage.removeItem('fromAddition');
            if (fromAddition) {
                location.href = 'addition';
            } else {
                location.href = 'play';
            }
        };
        const goHome = ()=>{
            location.href = 'home';
        };
        const injectBottomButtons = (sidebarEl)=>{
            if (!sidebarEl) return;
            if (sidebarEl.querySelector('.sidebar-actions')) return;
            const actions = document.createElement('div');
            actions.className = 'sidebar-actions';
            const row = document.createElement('div');
            row.className = 'btn-row';
            row.style.display = 'flex';
            row.style.gap = '8px';
            row.style.flexWrap = 'wrap';
            const retryBtn = document.createElement('button');
            retryBtn.type = 'button';
            retryBtn.className = 'btn';
            retryBtn.innerHTML = 'もう一度<br>プレイ';
            retryBtn.addEventListener('click', retry);
            const homeBtn = document.createElement('button');
            homeBtn.type = 'button';
            homeBtn.className = 'btn primary';
            homeBtn.textContent = 'ホームへ';
            homeBtn.addEventListener('click', goHome);
            row.appendChild(retryBtn);
            row.appendChild(homeBtn);
            actions.appendChild(row);
            sidebarEl.appendChild(actions);
        };
        // ====== メイン処理（元の DOMContentLoaded 相当） ======
        const navHost = document.getElementById('navbar-placeholder');
        const layout = document.getElementById('result-layout');
        const sidebarEl = document.getElementById('result-sidebar');
        const mapWrapper = document.getElementById('map-wrap');
        const mapEl = document.getElementById('result-map');
        const scoreText = document.getElementById('scoreText');
        // レイアウト調整（JSで上書き）
        if (layout) {
            Object.assign(layout.style, {
                position: 'fixed',
                top: 'var(--nav-h, 56px)',
                left: '0',
                right: '0',
                bottom: '0',
                display: 'flex',
                gap: '12px',
                alignItems: 'stretch',
                padding: '8px',
                boxSizing: 'border-box',
                overflow: 'hidden',
                margin: '0'
            });
        }
        if (sidebarEl) {
            Object.assign(sidebarEl.style, {
                height: '100%',
                overflowY: 'auto',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                width: 'clamp(260px, 28vw, 340px)'
            });
        }
        if (mapWrapper) {
            Object.assign(mapWrapper.style, {
                flex: '1 1 auto',
                minWidth: '0',
                height: '100%',
                overflow: 'hidden'
            });
        }
        if (mapEl) {
            Object.assign(mapEl.style, {
                width: '100%',
                height: '100%'
            });
        }
        // ナビ高さの初期測定 & 監視
        measureAndApplyNavHeight();
        const navObserver = navHost && new MutationObserver(measureAndApplyNavHeight);
        if (navObserver && navHost) {
            navObserver.observe(navHost, {
                childList: true,
                subtree: true
            });
        }
        window.addEventListener('resize', measureAndApplyNavHeight);
        window.addEventListener('load', ()=>setTimeout(measureAndApplyNavHeight, 0));
        // メインの async ロジック
        let bodyObserver = null;
        (async ()=>{
            // Leaflet 読み込み
            const leafletModule = await __turbopack_context__.A("[project]/frontend/node_modules/leaflet/dist/leaflet-src.js [app-ssr] (ecmascript, async loader)");
            const L = leafletModule.default ?? leafletModule;
            // ===== 地図初期化 =====
            resultMap = L.map('result-map', {
                zoomControl: true
            }).setView([
                35.7,
                139.7
            ], 10);
            const lightTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            });
            const darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap &copy; CARTO'
            });
            const applyTiles = ()=>{
                if (!resultMap) return;
                const wantDark = isDarkSiteTheme();
                if (wantDark) {
                    if (resultMap.hasLayer(lightTiles)) {
                        resultMap.removeLayer(lightTiles);
                    }
                    if (!resultMap.hasLayer(darkTiles)) {
                        darkTiles.addTo(resultMap);
                    }
                } else {
                    if (resultMap.hasLayer(darkTiles)) {
                        resultMap.removeLayer(darkTiles);
                    }
                    if (!resultMap.hasLayer(lightTiles)) {
                        lightTiles.addTo(resultMap);
                    }
                }
                setTimeout(()=>{
                    resultMap.invalidateSize();
                }, 0);
            };
            applyTiles();
            // body の class 変化（テーマ切り替え）を監視
            bodyObserver = new MutationObserver(applyTiles);
            bodyObserver.observe(document.body, {
                attributes: true,
                attributeFilter: [
                    'class'
                ]
            });
            // ===== 必要データ取得 =====
            const correctRaw = localStorage.getItem('correctCoords');
            const answerRaw = localStorage.getItem('lastAnswerCoords');
            const correctSpotRaw = localStorage.getItem('correctSpot');
            const correct = correctRaw ? JSON.parse(correctRaw) : null;
            const answer = answerRaw ? JSON.parse(answerRaw) : null;
            const correctSpot = correctSpotRaw ? JSON.parse(correctSpotRaw) : null;
            if (!correct || !answer || !correctSpot) {
                if (scoreText) {
                    scoreText.innerHTML = '<p>情報が足りません。再度プレイしてください。</p>';
                }
                injectBottomButtons(sidebarEl);
                return;
            }
            // ===== スコア表示 =====
            try {
                const res = await fetch(`/api/score?SelLat=${answer.lat}&SelLng=${answer.lng}&CorLat=${correct.lat}&CorLng=${correct.lng}`);
                const data = await res.json();
                if (!data.success) throw new Error('スコア取得に失敗');
                const distanceKm = Number(data.Distance || 0);
                const score = Number(data.score || 0);
                localStorage.setItem('lastScore', String(score));
                if (scoreText) {
                    const title = correctSpot.title || '観光地';
                    const desc = correctSpot.description || '';
                    const img = correctSpot.image_path || '';
                    scoreText.innerHTML = `
        <div style="height: var(--sidebar-pad, 32px);"></div>
        <h2 style="margin:0 0 12px 0; font-size:1.2rem; font-weight:700;">${title}</h2>
        距離: <span>${distanceKm.toFixed(1)}km</span><br>
        スコア: <span>${score}</span> / 100
        <div id="place-info" style="margin-top: 16px;">
          <p>${desc}</p>
          ${img ? `<img src="${img}" alt="観光地画像" style="max-width:100%; border-radius:10px; margin-top:10px;">` : ''}
        </div>
      `;
                }
            } catch (err) {
                console.error('スコアAPI通信エラー:', err);
                if (scoreText) {
                    scoreText.innerHTML = `
        <div style="height: var(--sidebar-pad, 32px);"></div>
        <h2 style="margin:0 0 12px 0; font-size:1.2rem; font-weight:700;">情報の取得に失敗</h2>
        <p>スコア情報の取得に失敗しました。</p>
      `;
                }
            }
            // ===== マーカー・線 =====
            L.marker([
                correct.lat,
                correct.lng
            ]).addTo(resultMap).bindPopup('🎯 正解地点').openPopup();
            L.marker([
                answer.lat,
                answer.lng
            ]).addTo(resultMap).bindPopup('📍 あなたのピン');
            L.polyline([
                [
                    answer.lat,
                    answer.lng
                ],
                [
                    correct.lat,
                    correct.lng
                ]
            ], {
                color: 'red',
                weight: 2
            }).addTo(resultMap);
            resultMap.fitBounds(L.latLngBounds([
                [
                    answer.lat,
                    answer.lng
                ],
                [
                    correct.lat,
                    correct.lng
                ]
            ]), {
                padding: [
                    30,
                    30
                ]
            });
            // ===== Street View 埋め込み =====
            try {
                let finalUrl = null;
                try {
                    const r = await fetch(`/api/streetview-url?lat=${correct.lat}&lng=${correct.lng}`);
                    const j = await r.json();
                    if (j?.success && j?.url) {
                        finalUrl = isEmbeddableGoogleURL(j.url) ? j.url : null;
                    }
                } catch  {
                // ignore
                }
                if (!finalUrl) {
                    finalUrl = buildStreetViewEmbedURL(correct.lat, correct.lng);
                }
                if (sidebarEl) {
                    const wrap = document.createElement('div');
                    wrap.id = 'streetview-container';
                    wrap.style.marginTop = '12px';
                    wrap.innerHTML = `
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="font-weight:600;">📷 Google ストリートビュー</div>
            <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${encodeURIComponent(correct.lat)},${encodeURIComponent(correct.lng)}" target="_blank" rel="noopener" class="btn">新しいタブで開く</a>
          </div>
          <iframe class="streetview-frame" loading="lazy" allow="fullscreen" referrerpolicy="no-referrer-when-downgrade" style="width:100%;height:200px;border:0;border-radius:10px;"></iframe>
          <div class="sv-fallback" style="display:none;margin-top:8px;font-size:.9rem;color:var(--subtle);">ストリートビューを読み込めませんでした。上のボタンから Google マップでご確認ください。</div>
        </div>
      `;
                    sidebarEl.appendChild(wrap);
                    const iframe = wrap.querySelector('iframe');
                    const fallbackMsg = wrap.querySelector('.sv-fallback');
                    if (iframe) {
                        let loaded = false;
                        iframe.addEventListener('load', ()=>{
                            loaded = true;
                        });
                        iframe.src = finalUrl;
                        setTimeout(()=>{
                            if (!loaded && fallbackMsg) {
                                fallbackMsg.style.display = 'block';
                            }
                        }, 4000);
                    }
                }
            } catch (err) {
                console.warn('Street View 埋め込み処理エラー:', err);
            }
            // ===== 自宅 → 観光地：距離・ルート =====
            try {
                const locRes = await fetch('/api/has_location', {
                    credentials: 'include'
                });
                if (!locRes.ok) throw new Error('住所情報取得に失敗');
                const locData = await locRes.json();
                if (locData.hasLocation && locData.lat != null && locData.lng != null) {
                    const userLat = Number(locData.lat);
                    const userLng = Number(locData.lng);
                    const houseIcon = L.icon({
                        iconUrl: 'https://cdn-icons-png.flaticon.com/512/25/25694.png',
                        iconSize: [
                            32,
                            32
                        ],
                        iconAnchor: [
                            16,
                            32
                        ],
                        popupAnchor: [
                            0,
                            -30
                        ]
                    });
                    L.marker([
                        userLat,
                        userLng
                    ], {
                        icon: houseIcon
                    }).addTo(resultMap).bindPopup('🏠 自宅');
                    const d = getDistanceKm(userLat, userLng, correct.lat, correct.lng);
                    const carH = (d / 60).toFixed(1);
                    const trainH = (d / 80).toFixed(1);
                    const cost = Math.round(d * 15);
                    if (scoreText) {
                        const travelInfo = document.createElement('div');
                        travelInfo.innerHTML = `
          <hr style="margin: 20px 0;">
          <h4>🧭 自宅からの移動情報</h4>
          <p>
            🏠 登録住所 ➡ ${correctSpot.title || '目的地'}（観光地）<br>
            直線距離: 約 <strong>${d.toFixed(1)} km</strong><br>
            🚗 車（概算）: 約 <strong>${carH} 時間</strong><br>
            🚃 電車（概算）: 約 <strong>${trainH} 時間</strong>・運賃 約 <strong>${cost} 円</strong>
          </p>`;
                        scoreText.appendChild(travelInfo);
                    }
                    const directionsRes = await fetch(`/api/directions?fromLat=${userLat}&fromLng=${userLng}&toLat=${correct.lat}&toLng=${correct.lng}&mode=driving`);
                    const dir = await directionsRes.json();
                    if (dir.success && dir.route?.overview_polyline?.points) {
                        const points = decodePolyline(dir.route.overview_polyline.points);
                        const routeLine = L.polyline(points, {
                            color: 'blue',
                            weight: 4
                        }).addTo(resultMap).bindPopup('🚗 推奨ルート');
                        resultMap.fitBounds(routeLine.getBounds(), {
                            padding: [
                                30,
                                30
                            ]
                        });
                        const minutes = Math.round((dir.route.duration || 0) / 60);
                        const km = (dir.route.distance || 0) / 1000;
                        if (scoreText) {
                            const routeInfo = document.createElement('div');
                            routeInfo.style.marginTop = '8px';
                            routeInfo.innerHTML = `<p>🗺️ 経路（実測）: 距離 約 <strong>${km.toFixed(1)} km</strong>・所要 約 <strong>${minutes} 分</strong></p>`;
                            scoreText.appendChild(routeInfo);
                        }
                    } else {
                        console.warn('経路が見つかりませんでした:', dir?.message);
                    }
                }
            } catch (err) {
                console.warn('移動情報の取得に失敗:', err);
            }
            // ===== 楽天ホテル（簡易カード） =====
            try {
                const r = await fetch(`/api/hotels_nearby_rakuten?lat=${correct.lat}&lng=${correct.lng}`);
                const rk = await r.json();
                if (rk.success && rk.count > 0) {
                    const wrap = document.createElement('div');
                    wrap.innerHTML = `
        <hr style="margin:20px 0;">
        <h4>🏨 観光地付近のホテル（半径 ${rk.radiusKm} km・楽天）</h4>
        <div id="r-hotel-list" style="display:grid; gap:12px; grid-template-columns: repeat(auto-fill,minmax(260px,1fr));"></div>
      `;
                    if (scoreText) scoreText.appendChild(wrap);
                    const list = wrap.querySelector('#r-hotel-list');
                    rk.hotels.forEach((h)=>{
                        if (h.lat && h.lng) {
                            L.marker([
                                h.lat,
                                h.lng
                            ]).addTo(resultMap).bindPopup(`🏨 ${h.name || 'ホテル'}`);
                        }
                        if (!list) return;
                        const card = document.createElement('div');
                        card.className = 'card';
                        const priceText = h.minCharge != null ? `最安目安: ¥${Number(h.minCharge).toLocaleString()}` : '';
                        const rateText = h.reviewAverage != null && h.reviewCount != null ? `評価 ${h.reviewAverage} / 5（${h.reviewCount}件）` : '';
                        card.innerHTML = `
          ${h.thumbnail ? `<img src="${h.thumbnail}" alt="${h.name || ''}" style="width:100%;height:140px;object-fit:cover;border-radius:8px;margin-bottom:8px;">` : ''}
          ${h.name ? `<div style="font-weight:600;margin-bottom:4px;">${h.name}</div>` : ''}
          ${h.address ? `<div style="font-size:.9rem;color:var(--subtle);margin-bottom:4px;">${h.address}</div>` : ''}
          ${priceText ? `<div style="font-size:.9rem;margin-bottom:4px;">${priceText}</div>` : ''}
          ${rateText ? `<div style="font-size:.9rem;color:var(--subtle);margin-bottom:8px;">${rateText}</div>` : ''}
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            ${h.infoUrl ? `<a href="${h.infoUrl}" target="_blank" rel="noopener" class="btn">施設情報</a>` : ''}
            ${h.planUrl ? `<a href="${h.planUrl}" target="_blank" rel="noopener" class="btn primary">空室・料金を確認</a>` : ''}
          </div>
        `;
                        list.appendChild(card);
                    });
                    const pts = rk.hotels.filter((h)=>h.lat && h.lng).map((h)=>[
                            h.lat,
                            h.lng
                        ]);
                    if (pts.length > 0) {
                        const bounds = L.latLngBounds([
                            [
                                correct.lat,
                                correct.lng
                            ]
                        ], ...pts);
                        resultMap.fitBounds(bounds, {
                            padding: [
                                30,
                                30
                            ]
                        });
                    }
                } else {
                    const wrap = document.createElement('div');
                    wrap.innerHTML = '<hr style="margin:20px 0;"><p>🏨 楽天: 付近のホテルは見つかりませんでした（最大3.0km）。</p>';
                    if (scoreText) scoreText.appendChild(wrap);
                }
            } catch (err) {
                console.warn('楽天ホテル取得エラー:', err);
                const wrap = document.createElement('div');
                wrap.innerHTML = '<hr style="margin:20px 0;"><p>🏨 楽天ホテル情報の取得に失敗しました。</p>';
                if (scoreText) scoreText.appendChild(wrap);
            }
            injectBottomButtons(sidebarEl);
        })();
        // クリーンアップ
        return ()=>{
            window.removeEventListener('resize', measureAndApplyNavHeight);
            if (navObserver) navObserver.disconnect();
            if (bodyObserver) bodyObserver.disconnect();
        };
    }, []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                id: "navbar-placeholder"
            }, void 0, false, {
                fileName: "[project]/frontend/app/result/page.tsx",
                lineNumber: 769,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                id: "result-layout",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                        id: "result-sidebar",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                id: "scoreText",
                                children: "スコア計算中..."
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/result/page.tsx",
                                lineNumber: 773,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                id: "place-info"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/result/page.tsx",
                                lineNumber: 774,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/result/page.tsx",
                        lineNumber: 772,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        id: "map-wrap",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            id: "result-map"
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/result/page.tsx",
                            lineNumber: 779,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/result/page.tsx",
                        lineNumber: 778,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/app/result/page.tsx",
                lineNumber: 771,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$script$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                src: "/js/navbar.js",
                strategy: "afterInteractive"
            }, void 0, false, {
                fileName: "[project]/frontend/app/result/page.tsx",
                lineNumber: 784,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
}),
"[project]/frontend/node_modules/@swc/helpers/cjs/_interop_require_default.cjs [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
exports._ = _interop_require_default;
}),
"[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxRuntime; //# sourceMappingURL=react-jsx-runtime.js.map
}),
"[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-dom.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactDOM; //# sourceMappingURL=react-dom.js.map
}),
"[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/contexts/head-manager-context.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['contexts'].HeadManagerContext; //# sourceMappingURL=head-manager-context.js.map
}),
"[project]/frontend/node_modules/next/dist/client/set-attributes-from-props.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "setAttributesFromProps", {
    enumerable: true,
    get: function() {
        return setAttributesFromProps;
    }
});
const DOMAttributeNames = {
    acceptCharset: 'accept-charset',
    className: 'class',
    htmlFor: 'for',
    httpEquiv: 'http-equiv',
    noModule: 'noModule'
};
const ignoreProps = [
    'onLoad',
    'onReady',
    'dangerouslySetInnerHTML',
    'children',
    'onError',
    'strategy',
    'stylesheets'
];
function isBooleanScriptAttribute(attr) {
    return [
        'async',
        'defer',
        'noModule'
    ].includes(attr);
}
function setAttributesFromProps(el, props) {
    for (const [p, value] of Object.entries(props)){
        if (!props.hasOwnProperty(p)) continue;
        if (ignoreProps.includes(p)) continue;
        // we don't render undefined props to the DOM
        if (value === undefined) {
            continue;
        }
        const attr = DOMAttributeNames[p] || p.toLowerCase();
        if (el.tagName === 'SCRIPT' && isBooleanScriptAttribute(attr)) {
            // Correctly assign boolean script attributes
            // https://github.com/vercel/next.js/pull/20748
            ;
            el[attr] = !!value;
        } else {
            el.setAttribute(attr, String(value));
        }
        // Remove falsy non-zero boolean attributes so they are correctly interpreted
        // (e.g. if we set them to false, this coerces to the string "false", which the browser interprets as true)
        if (value === false || el.tagName === 'SCRIPT' && isBooleanScriptAttribute(attr) && (!value || value === 'false')) {
            // Call setAttribute before, as we need to set and unset the attribute to override force async:
            // https://html.spec.whatwg.org/multipage/scripting.html#script-force-async
            el.setAttribute(attr, '');
            el.removeAttribute(attr);
        }
    }
}
if ((typeof exports.default === 'function' || typeof exports.default === 'object' && exports.default !== null) && typeof exports.default.__esModule === 'undefined') {
    Object.defineProperty(exports.default, '__esModule', {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
} //# sourceMappingURL=set-attributes-from-props.js.map
}),
"[project]/frontend/node_modules/next/dist/client/request-idle-callback.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    cancelIdleCallback: null,
    requestIdleCallback: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    cancelIdleCallback: function() {
        return cancelIdleCallback;
    },
    requestIdleCallback: function() {
        return requestIdleCallback;
    }
});
const requestIdleCallback = typeof self !== 'undefined' && self.requestIdleCallback && self.requestIdleCallback.bind(window) || function(cb) {
    let start = Date.now();
    return self.setTimeout(function() {
        cb({
            didTimeout: false,
            timeRemaining: function() {
                return Math.max(0, 50 - (Date.now() - start));
            }
        });
    }, 1);
};
const cancelIdleCallback = typeof self !== 'undefined' && self.cancelIdleCallback && self.cancelIdleCallback.bind(window) || function(id) {
    return clearTimeout(id);
};
if ((typeof exports.default === 'function' || typeof exports.default === 'object' && exports.default !== null) && typeof exports.default.__esModule === 'undefined') {
    Object.defineProperty(exports.default, '__esModule', {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
} //# sourceMappingURL=request-idle-callback.js.map
}),
"[project]/frontend/node_modules/next/dist/client/script.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    default: null,
    handleClientScriptLoad: null,
    initScriptLoader: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    default: function() {
        return _default;
    },
    handleClientScriptLoad: function() {
        return handleClientScriptLoad;
    },
    initScriptLoader: function() {
        return initScriptLoader;
    }
});
const _interop_require_default = __turbopack_context__.r("[project]/frontend/node_modules/@swc/helpers/cjs/_interop_require_default.cjs [app-ssr] (ecmascript)");
const _interop_require_wildcard = __turbopack_context__.r("[project]/frontend/node_modules/@swc/helpers/cjs/_interop_require_wildcard.cjs [app-ssr] (ecmascript)");
const _jsxruntime = __turbopack_context__.r("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-runtime.js [app-ssr] (ecmascript)");
const _reactdom = /*#__PURE__*/ _interop_require_default._(__turbopack_context__.r("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-dom.js [app-ssr] (ecmascript)"));
const _react = /*#__PURE__*/ _interop_require_wildcard._(__turbopack_context__.r("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)"));
const _headmanagercontextsharedruntime = __turbopack_context__.r("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/contexts/head-manager-context.js [app-ssr] (ecmascript)");
const _setattributesfromprops = __turbopack_context__.r("[project]/frontend/node_modules/next/dist/client/set-attributes-from-props.js [app-ssr] (ecmascript)");
const _requestidlecallback = __turbopack_context__.r("[project]/frontend/node_modules/next/dist/client/request-idle-callback.js [app-ssr] (ecmascript)");
const ScriptCache = new Map();
const LoadCache = new Set();
const insertStylesheets = (stylesheets)=>{
    // Case 1: Styles for afterInteractive/lazyOnload with appDir injected via handleClientScriptLoad
    //
    // Using ReactDOM.preinit to feature detect appDir and inject styles
    // Stylesheets might have already been loaded if initialized with Script component
    // Re-inject styles here to handle scripts loaded via handleClientScriptLoad
    // ReactDOM.preinit handles dedup and ensures the styles are loaded only once
    if (_reactdom.default.preinit) {
        stylesheets.forEach((stylesheet)=>{
            _reactdom.default.preinit(stylesheet, {
                as: 'style'
            });
        });
        return;
    }
    // Case 2: Styles for afterInteractive/lazyOnload with pages injected via handleClientScriptLoad
    //
    // We use this function to load styles when appdir is not detected
    // TODO: Use React float APIs to load styles once available for pages dir
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
};
const loadScript = (props)=>{
    const { src, id, onLoad = ()=>{}, onReady = null, dangerouslySetInnerHTML, children = '', strategy = 'afterInteractive', onError, stylesheets } = props;
    const cacheKey = id || src;
    // Script has already loaded
    if (cacheKey && LoadCache.has(cacheKey)) {
        return;
    }
    // Contents of this script are already loading/loaded
    if (ScriptCache.has(src)) {
        LoadCache.add(cacheKey);
        // It is possible that multiple `next/script` components all have same "src", but has different "onLoad"
        // This is to make sure the same remote script will only load once, but "onLoad" are executed in order
        ScriptCache.get(src).then(onLoad, onError);
        return;
    }
    /** Execute after the script first loaded */ const afterLoad = ()=>{
        // Run onReady for the first time after load event
        if (onReady) {
            onReady();
        }
        // add cacheKey to LoadCache when load successfully
        LoadCache.add(cacheKey);
    };
    const el = document.createElement('script');
    const loadPromise = new Promise((resolve, reject)=>{
        el.addEventListener('load', function(e) {
            resolve();
            if (onLoad) {
                onLoad.call(this, e);
            }
            afterLoad();
        });
        el.addEventListener('error', function(e) {
            reject(e);
        });
    }).catch(function(e) {
        if (onError) {
            onError(e);
        }
    });
    if (dangerouslySetInnerHTML) {
        // Casting since lib.dom.d.ts doesn't have TrustedHTML yet.
        el.innerHTML = dangerouslySetInnerHTML.__html || '';
        afterLoad();
    } else if (children) {
        el.textContent = typeof children === 'string' ? children : Array.isArray(children) ? children.join('') : '';
        afterLoad();
    } else if (src) {
        el.src = src;
        // do not add cacheKey into LoadCache for remote script here
        // cacheKey will be added to LoadCache when it is actually loaded (see loadPromise above)
        ScriptCache.set(src, loadPromise);
    }
    (0, _setattributesfromprops.setAttributesFromProps)(el, props);
    if (strategy === 'worker') {
        el.setAttribute('type', 'text/partytown');
    }
    el.setAttribute('data-nscript', strategy);
    // Load styles associated with this script
    if (stylesheets) {
        insertStylesheets(stylesheets);
    }
    document.body.appendChild(el);
};
function handleClientScriptLoad(props) {
    const { strategy = 'afterInteractive' } = props;
    if (strategy === 'lazyOnload') {
        window.addEventListener('load', ()=>{
            (0, _requestidlecallback.requestIdleCallback)(()=>loadScript(props));
        });
    } else {
        loadScript(props);
    }
}
function loadLazyScript(props) {
    if (document.readyState === 'complete') {
        (0, _requestidlecallback.requestIdleCallback)(()=>loadScript(props));
    } else {
        window.addEventListener('load', ()=>{
            (0, _requestidlecallback.requestIdleCallback)(()=>loadScript(props));
        });
    }
}
function addBeforeInteractiveToCache() {
    const scripts = [
        ...document.querySelectorAll('[data-nscript="beforeInteractive"]'),
        ...document.querySelectorAll('[data-nscript="beforePageRender"]')
    ];
    scripts.forEach((script)=>{
        const cacheKey = script.id || script.getAttribute('src');
        LoadCache.add(cacheKey);
    });
}
function initScriptLoader(scriptLoaderItems) {
    scriptLoaderItems.forEach(handleClientScriptLoad);
    addBeforeInteractiveToCache();
}
/**
 * Load a third-party scripts in an optimized way.
 *
 * Read more: [Next.js Docs: `next/script`](https://nextjs.org/docs/app/api-reference/components/script)
 */ function Script(props) {
    const { id, src = '', onLoad = ()=>{}, onReady = null, strategy = 'afterInteractive', onError, stylesheets, ...restProps } = props;
    // Context is available only during SSR
    let { updateScripts, scripts, getIsSsr, appDir, nonce } = (0, _react.useContext)(_headmanagercontextsharedruntime.HeadManagerContext);
    // if a nonce is explicitly passed to the script tag, favor that over the automatic handling
    nonce = restProps.nonce || nonce;
    /**
   * - First mount:
   *   1. The useEffect for onReady executes
   *   2. hasOnReadyEffectCalled.current is false, but the script hasn't loaded yet (not in LoadCache)
   *      onReady is skipped, set hasOnReadyEffectCalled.current to true
   *   3. The useEffect for loadScript executes
   *   4. hasLoadScriptEffectCalled.current is false, loadScript executes
   *      Once the script is loaded, the onLoad and onReady will be called by then
   *   [If strict mode is enabled / is wrapped in <OffScreen /> component]
   *   5. The useEffect for onReady executes again
   *   6. hasOnReadyEffectCalled.current is true, so entire effect is skipped
   *   7. The useEffect for loadScript executes again
   *   8. hasLoadScriptEffectCalled.current is true, so entire effect is skipped
   *
   * - Second mount:
   *   1. The useEffect for onReady executes
   *   2. hasOnReadyEffectCalled.current is false, but the script has already loaded (found in LoadCache)
   *      onReady is called, set hasOnReadyEffectCalled.current to true
   *   3. The useEffect for loadScript executes
   *   4. The script is already loaded, loadScript bails out
   *   [If strict mode is enabled / is wrapped in <OffScreen /> component]
   *   5. The useEffect for onReady executes again
   *   6. hasOnReadyEffectCalled.current is true, so entire effect is skipped
   *   7. The useEffect for loadScript executes again
   *   8. hasLoadScriptEffectCalled.current is true, so entire effect is skipped
   */ const hasOnReadyEffectCalled = (0, _react.useRef)(false);
    (0, _react.useEffect)(()=>{
        const cacheKey = id || src;
        if (!hasOnReadyEffectCalled.current) {
            // Run onReady if script has loaded before but component is re-mounted
            if (onReady && cacheKey && LoadCache.has(cacheKey)) {
                onReady();
            }
            hasOnReadyEffectCalled.current = true;
        }
    }, [
        onReady,
        id,
        src
    ]);
    const hasLoadScriptEffectCalled = (0, _react.useRef)(false);
    (0, _react.useEffect)(()=>{
        if (!hasLoadScriptEffectCalled.current) {
            if (strategy === 'afterInteractive') {
                loadScript(props);
            } else if (strategy === 'lazyOnload') {
                loadLazyScript(props);
            }
            hasLoadScriptEffectCalled.current = true;
        }
    }, [
        props,
        strategy
    ]);
    if (strategy === 'beforeInteractive' || strategy === 'worker') {
        if (updateScripts) {
            scripts[strategy] = (scripts[strategy] || []).concat([
                {
                    id,
                    src,
                    onLoad,
                    onReady,
                    onError,
                    ...restProps,
                    nonce
                }
            ]);
            updateScripts(scripts);
        } else if (getIsSsr && getIsSsr()) {
            // Script has already loaded during SSR
            LoadCache.add(id || src);
        } else if (getIsSsr && !getIsSsr()) {
            loadScript({
                ...props,
                nonce
            });
        }
    }
    // For the app directory, we need React Float to preload these scripts.
    if (appDir) {
        // Injecting stylesheets here handles beforeInteractive and worker scripts correctly
        // For other strategies injecting here ensures correct stylesheet order
        // ReactDOM.preinit handles loading the styles in the correct order,
        // also ensures the stylesheet is loaded only once and in a consistent manner
        //
        // Case 1: Styles for beforeInteractive/worker with appDir - handled here
        // Case 2: Styles for beforeInteractive/worker with pages dir - Not handled yet
        // Case 3: Styles for afterInteractive/lazyOnload with appDir - handled here
        // Case 4: Styles for afterInteractive/lazyOnload with pages dir - handled in insertStylesheets function
        if (stylesheets) {
            stylesheets.forEach((styleSrc)=>{
                _reactdom.default.preinit(styleSrc, {
                    as: 'style'
                });
            });
        }
        // Before interactive scripts need to be loaded by Next.js' runtime instead
        // of native <script> tags, because they no longer have `defer`.
        if (strategy === 'beforeInteractive') {
            if (!src) {
                // For inlined scripts, we put the content in `children`.
                if (restProps.dangerouslySetInnerHTML) {
                    // Casting since lib.dom.d.ts doesn't have TrustedHTML yet.
                    restProps.children = restProps.dangerouslySetInnerHTML.__html;
                    delete restProps.dangerouslySetInnerHTML;
                }
                return /*#__PURE__*/ (0, _jsxruntime.jsx)("script", {
                    nonce: nonce,
                    dangerouslySetInnerHTML: {
                        __html: `(self.__next_s=self.__next_s||[]).push(${JSON.stringify([
                            0,
                            {
                                ...restProps,
                                id
                            }
                        ])})`
                    }
                });
            } else {
                // @ts-ignore
                _reactdom.default.preload(src, restProps.integrity ? {
                    as: 'script',
                    integrity: restProps.integrity,
                    nonce,
                    crossOrigin: restProps.crossOrigin
                } : {
                    as: 'script',
                    nonce,
                    crossOrigin: restProps.crossOrigin
                });
                return /*#__PURE__*/ (0, _jsxruntime.jsx)("script", {
                    nonce: nonce,
                    dangerouslySetInnerHTML: {
                        __html: `(self.__next_s=self.__next_s||[]).push(${JSON.stringify([
                            src,
                            {
                                ...restProps,
                                id
                            }
                        ])})`
                    }
                });
            }
        } else if (strategy === 'afterInteractive') {
            if (src) {
                // @ts-ignore
                _reactdom.default.preload(src, restProps.integrity ? {
                    as: 'script',
                    integrity: restProps.integrity,
                    nonce,
                    crossOrigin: restProps.crossOrigin
                } : {
                    as: 'script',
                    nonce,
                    crossOrigin: restProps.crossOrigin
                });
            }
        }
    }
    return null;
}
Object.defineProperty(Script, '__nextScript', {
    value: true
});
const _default = Script;
if ((typeof exports.default === 'function' || typeof exports.default === 'object' && exports.default !== null) && typeof exports.default.__esModule === 'undefined') {
    Object.defineProperty(exports.default, '__esModule', {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
} //# sourceMappingURL=script.js.map
}),
"[project]/frontend/node_modules/next/script.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = __turbopack_context__.r("[project]/frontend/node_modules/next/dist/client/script.js [app-ssr] (ecmascript)");
}),
];

//# sourceMappingURL=frontend_0bd88412._.js.map