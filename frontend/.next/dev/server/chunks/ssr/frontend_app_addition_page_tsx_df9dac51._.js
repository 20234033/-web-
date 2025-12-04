module.exports = [
"[project]/frontend/app/addition/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdditionPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/navigation.js [app-ssr] (ecmascript)");
'use client';
;
;
;
const API_BASE = ("TURBOPACK compile-time value", "http://localhost:3000") || 'http://localhost:3000';
function AdditionPage() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    // ==== refs ====
    const mapContainerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const streetviewRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const leftPanelRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const mapRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const markerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const currentStreetViewUrlRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])('');
    const lastGeocodeQueryRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])('');
    const isComposingRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    // ==== 状態 ====
    const [streetViewUrl, setStreetViewUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [title, setTitle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [genre, setGenre] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('historic');
    const [description, setDescription] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [previewUrl, setPreviewUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [selectedImageFile, setSelectedImageFile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [aiStatus, setAiStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [aiLoading, setAiLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    // ==== CSS 注入 & テーマ / body クラス ====
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const existing = document.getElementById('addition-page-style');
        if (!existing) {
            const style = document.createElement('style');
            style.id = 'addition-page-style';
            style.textContent = `
        :root[data-theme="light"]{
          color-scheme:light;
          --bg:#f7f7f8; --text:#0f172a; --subtle:#475569;
          --panel:#ffffff; --border:#e5e7eb; --primary:#4f46e5;
        }
        :root[data-theme="dark"] {
          color-scheme:dark;
          --bg:#0b0f14; --text:#e5e7eb; --subtle:#9aa4b2;
          --panel:#111827; --border:#1f2937; --primary:#6366f1;
        }
        :root{ --nav-h:56px; }

        html, body{
          margin:0; padding:0; height:100%;
          font-family:'Orbitron','Arial',sans-serif;
          background:var(--bg); color:var(--text);
          overflow:hidden;
        }

        .addition-layout{
          display:grid;
          grid-template-columns: 360px 1fr;
          gap:12px;
          height:calc(100dvh - var(--nav-h));
          padding:12px;
          box-sizing:border-box;
        }

        #leftPanel{
          display:grid;
          grid-template-rows: var(--left-sv-h, 260px) 8px 1fr;
          gap:12px;
          background:var(--panel);
          border:1px solid var(--border);
          border-radius:12px;
          padding:12px;
          overflow:hidden;
        }
        #streetview-container{
          width:100%; height:100%;
          border:1px solid var(--border);
          border-radius:12px;
          overflow:hidden;
          background:#0001;
          position:static;
          box-shadow:none;
          transition:none;
        }
        #streetview{ width:100%; height:100%; border:none; }

        .left-resizer{
          align-self:stretch;
          cursor:row-resize;
          position:relative;
          user-select:none; touch-action:none;
          border-radius:6px; background:transparent;
        }
        .left-resizer::before{
          content:""; position:absolute; left:50%; top:50%;
          transform:translate(-50%,-50%);
          width:64px; height:3px;
          border-radius:2px; background:var(--border); opacity:.9;
        }

        .left-form{
          overflow:auto; padding-right:4px;
        }
        .left-form label{ display:block; margin-top:10px; font-weight:600; }
        .left-form input[type="text"],
        .left-form textarea,
        .left-form select{
          width:100%; margin-top:6px; padding:8px 10px;
          border:1px solid var(--border); border-radius:8px; font-size:14px;
          background:var(--panel); color:var(--text);
        }
        .left-form textarea{ min-height:96px; resize:vertical; }
        .custom-file-upload{
          display:inline-block; padding:8px 12px; margin-top:8px;
          border:1px solid #888; border-radius:8px; cursor:pointer; user-select:none;
          background:#f6f6f6;
        }
        .custom-file-upload input{ display:none; }
        #aiStatus{ margin-left:6px; color:#666; font-size:12px; }
        #fileNameDisplay{ margin-left:8px; color:#444; font-size:12px; }
        #preview{
          display:none; width:100%; max-height:220px; object-fit:cover;
          margin-top:10px; border-radius:10px; border:1px solid #ddd;
        }
        #deleteImage{ display:none; margin-top:8px; }
        #confirmBtn{
          width:100%; margin-top:14px; padding:12px;
          border:none; border-radius:10px; font-weight:700; cursor:pointer;
          background:var(--primary); color:#fff;
        }

        .right-panel{
          display:grid; grid-template-rows:1fr;
          gap:12px; min-height:0;
        }
        #map{
          width:100%; height:100%;
          border:1px solid var(--border);
          border-radius:12px;
          background:#0001;
          position:static;
          margin:0;
        }

        /* 📍ピン用 */
        .custom-pin-icon {
          font-size: 24px;
          line-height: 24px;
          text-align: center;
          transform: translateY(-4px);
        }

        @media (max-width: 820px){
          .addition-layout{
            grid-template-columns: 1fr;
            grid-template-rows: auto 60vh;
          }
        }
      `;
            document.head.appendChild(style);
        }
        if (!document.documentElement.hasAttribute('data-theme')) {
            document.documentElement.setAttribute('data-theme', 'light');
        }
        document.body.classList.add('addition-page');
        return ()=>{
            document.body.classList.remove('addition-page');
        };
    }, []);
    // ==== ナビ高さ → CSS変数 ====
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const applyNavHeight = ()=>{
            const host = document.getElementById('navbar-placeholder');
            const navEl = host && host.firstElementChild ? host.firstElementChild : host;
            const h = Math.max(0, Math.round(navEl?.getBoundingClientRect().height || 56));
            document.documentElement.style.setProperty('--nav-h', `${h}px`);
            if (host) host.style.height = `${h}px`;
        };
        applyNavHeight();
        window.addEventListener('resize', applyNavHeight);
        const host = document.getElementById('navbar-placeholder');
        let obs = null;
        if (host) {
            obs = new MutationObserver(applyNavHeight);
            obs.observe(host, {
                childList: true,
                subtree: true
            });
        }
        return ()=>{
            window.removeEventListener('resize', applyNavHeight);
            obs?.disconnect();
        };
    }, []);
    // ==== StreetView URL 更新 ====
    const updateStreetViewUrl = async (lat, lng)=>{
        try {
            const res = await fetch(`${API_BASE}/api/streetview-url?lat=${lat}&lng=${lng}`);
            const data = await res.json();
            if (data.success && data.url) {
                setStreetViewUrl(data.url);
                currentStreetViewUrlRef.current = data.url;
            } else {
                throw new Error('URL取得失敗');
            }
        } catch (err) {
            console.error('Street View URL取得失敗:', err);
            setStreetViewUrl(null);
            currentStreetViewUrlRef.current = '';
        }
    };
    // ==== Leaflet 初期化 ====
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let cancelled = false;
        (async ()=>{
            if (!mapContainerRef.current) return;
            if (!document.querySelector('link[href*="leaflet.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
                document.head.appendChild(link);
            }
            const leafletModule = await __turbopack_context__.A("[project]/frontend/node_modules/leaflet/dist/leaflet-src.js [app-ssr] (ecmascript, async loader)");
            const L = leafletModule.default ?? leafletModule;
            if (cancelled) return;
            const defaultLL = [
                35.6812,
                139.7671
            ]; // 東京駅
            const map = L.map(mapContainerRef.current).setView(defaultLL, 5);
            mapRef.current = map;
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);
            const pinIcon = L.divIcon({
                className: 'custom-pin-icon',
                html: '📍',
                iconSize: [
                    24,
                    24
                ],
                iconAnchor: [
                    12,
                    24
                ]
            });
            const marker = L.marker(defaultLL, {
                draggable: true,
                icon: pinIcon
            }).addTo(map);
            markerRef.current = marker;
            // 初期 Street View
            updateStreetViewUrl(defaultLL[0], defaultLL[1]);
            map.on('click', (e)=>{
                marker.setLatLng(e.latlng);
                updateStreetViewUrl(e.latlng.lat, e.latlng.lng);
            });
            marker.on('moveend', (e)=>{
                const { lat, lng } = e.target.getLatLng();
                updateStreetViewUrl(lat, lng);
            });
            setTimeout(()=>{
                try {
                    map.invalidateSize();
                } catch  {
                /* noop */ }
            }, 0);
        })();
        return ()=>{
            cancelled = true;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);
    // ==== 左パネル内：SV高さリサイズ ====
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const panel = leftPanelRef.current;
        if (!panel) return;
        const resizer = panel.querySelector('.left-resizer');
        if (!resizer) return;
        const savedPx = parseInt((("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : '') || '', 10);
        if (!Number.isNaN(savedPx)) {
            panel.style.setProperty('--left-sv-h', `${savedPx}px`);
        }
        let dragging = false;
        let startY = 0;
        let startH = 0;
        const getPanelRect = ()=>panel.getBoundingClientRect();
        const applyHeight = (px)=>{
            const rect = getPanelRect();
            const min = 140;
            const max = Math.max(180, rect.height - 140);
            const h = Math.max(min, Math.min(max, px | 0));
            panel.style.setProperty('--left-sv-h', `${h}px`);
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            if (mapRef.current) {
                try {
                    mapRef.current.invalidateSize();
                } catch  {
                /* noop */ }
            }
        };
        const onMove = (clientY)=>{
            const delta = clientY - startY;
            applyHeight(startH + delta);
        };
        const onMouseMove = (e)=>{
            if (!dragging) return;
            onMove(e.clientY);
        };
        const onMouseUp = ()=>{
            dragging = false;
        };
        const onTouchMove = (e)=>{
            if (!dragging) return;
            const t = e.touches[0];
            if (t) onMove(t.clientY);
        };
        const onTouchEnd = ()=>{
            dragging = false;
        };
        const onMouseDown = (e)=>{
            e.preventDefault();
            dragging = true;
            startY = e.clientY;
            const current = getComputedStyle(panel).getPropertyValue('--left-sv-h').trim() || '260';
            startH = parseInt(current, 10) || 260;
        };
        const onTouchStart = (e)=>{
            const t = e.touches[0];
            if (!t) return;
            dragging = true;
            startY = t.clientY;
            const current = getComputedStyle(panel).getPropertyValue('--left-sv-h').trim() || '260';
            startH = parseInt(current, 10) || 260;
        };
        const onKeyDown = (e)=>{
            const step = e.shiftKey ? 60 : 20;
            const current = parseInt(getComputedStyle(panel).getPropertyValue('--left-sv-h') || '260', 10) || 260;
            if (e.key === 'ArrowUp') {
                applyHeight(current + step);
                e.preventDefault();
            } else if (e.key === 'ArrowDown') {
                applyHeight(current - step);
                e.preventDefault();
            }
        };
        resizer.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        resizer.addEventListener('touchstart', onTouchStart, {
            passive: true
        });
        window.addEventListener('touchmove', onTouchMove, {
            passive: true
        });
        window.addEventListener('touchend', onTouchEnd);
        window.addEventListener('touchcancel', onTouchEnd);
        resizer.addEventListener('keydown', onKeyDown);
        return ()=>{
            resizer.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            resizer.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
            window.removeEventListener('touchcancel', onTouchEnd);
            resizer.removeEventListener('keydown', onKeyDown);
        };
    }, []);
    // ==== ジオコーディング ====
    const normalizeQuery = (s)=>s.replace(/\s+/g, ' ').trim();
    const geocodeAndMove = async (raw)=>{
        const q = normalizeQuery(raw);
        if (!q) return;
        if (q === lastGeocodeQueryRef.current) return;
        try {
            const res = await fetch(`${API_BASE}/api/geocode?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            if (!data.success || !data.lat || !data.lng) {
                alert('場所が見つかりませんでした。キーワードを変えてお試しください。');
                return;
            }
            lastGeocodeQueryRef.current = q;
            const newLatLng = [
                data.lat,
                data.lng
            ];
            if (markerRef.current) {
                markerRef.current.setLatLng(newLatLng);
            }
            if (mapRef.current) {
                mapRef.current.setView(newLatLng, 15);
            }
            updateStreetViewUrl(data.lat, data.lng);
        } catch (err) {
            console.error('ジオコーディングエラー:', err);
            alert('住所の変換に失敗しました。');
        }
    };
    // ==== 画像アップロード ====
    const handleImageChange = (e)=>{
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedImageFile(file);
        setPreviewUrl((prev)=>{
            if (prev && prev.startsWith('blob:')) {
                URL.revokeObjectURL(prev);
            }
            return URL.createObjectURL(file);
        });
    };
    const handleDeleteImage = ()=>{
        setSelectedImageFile(null);
        setPreviewUrl((prev)=>{
            if (prev && prev.startsWith('blob:')) {
                URL.revokeObjectURL(prev);
            }
            return null;
        });
    };
    // ==== AI 自動生成 ====
    const handleAiSuggest = async ()=>{
        try {
            const trimmedTitle = title.trim();
            if (!trimmedTitle) {
                alert('観光地のタイトルを入力してください。');
                return;
            }
            setAiLoading(true);
            setAiStatus('生成中…');
            let lat = null;
            let lng = null;
            try {
                if (markerRef.current) {
                    const pos = markerRef.current.getLatLng();
                    lat = pos.lat;
                    lng = pos.lng;
                }
            } catch  {
            /* noop */ }
            const res = await fetch(`${API_BASE}/api/ai/spot-suggestion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: trimmedTitle,
                    lat,
                    lng
                })
            });
            const json = await res.json();
            if (!json.success) {
                throw new Error(json.error || '生成に失敗しました');
            }
            const s = json.suggestion;
            // 生成後タイトルを geocode 用に保持
            let nextTitle = trimmedTitle;
            if (s.title) {
                setTitle(s.title);
                nextTitle = s.title;
            }
            if (s.genre) setGenre(s.genre);
            if (s.description) setDescription(s.description);
            // ★ 生成結果タイトルでピンを移動
            await geocodeAndMove(nextTitle);
            setAiStatus(json.fallback ? '（ローカル推定で生成）' : '✓ 生成しました');
            setTimeout(()=>setAiStatus(''), 2000);
        } catch (e) {
            console.error('[AI生成エラー]', e);
            setAiStatus('生成に失敗しました');
        } finally{
            setAiLoading(false);
        }
    };
    // ==== 送信 ====
    const handleSubmit = async ()=>{
        if (!markerRef.current) {
            alert('地図の初期化がまだ完了していません。少し待ってから再度お試しください。');
            return;
        }
        const latlng = markerRef.current.getLatLng();
        const trimmedTitle = title.trim();
        const trimmedDesc = description.trim();
        if (!trimmedTitle || !trimmedDesc || !selectedImageFile) {
            alert('タイトル・説明・画像を入力してください');
            return;
        }
        const formData = new FormData();
        formData.append('title', trimmedTitle);
        formData.append('genre', genre);
        formData.append('description', trimmedDesc);
        // ← number → string に修正
        formData.append('lat', String(latlng.lat));
        formData.append('lng', String(latlng.lng));
        formData.append('image', selectedImageFile);
        formData.append('streetViewUrl', currentStreetViewUrlRef.current || '');
        try {
            const response = await fetch(`${API_BASE}/api/save-spot`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                const spot = result.data;
                spot.streetViewUrl = currentStreetViewUrlRef.current || '';
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
                router.push('/add_result');
            } else {
                alert('保存に失敗しました: ' + (result.error || ''));
            }
        } catch (err) {
            console.error(err);
            alert('通信エラーが発生しました');
        }
    };
    // ==== JSX ====
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                id: "navbar-placeholder"
            }, void 0, false, {
                fileName: "[project]/frontend/app/addition/page.tsx",
                lineNumber: 597,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "addition-layout",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        id: "leftPanel",
                        "aria-label": "操作パネル",
                        ref: leftPanelRef,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                id: "streetview-container",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("iframe", {
                                    id: "streetview",
                                    ref: streetviewRef,
                                    src: streetViewUrl ?? undefined,
                                    allowFullScreen: true
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/addition/page.tsx",
                                    lineNumber: 607,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/addition/page.tsx",
                                lineNumber: 606,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "left-resizer",
                                role: "separator",
                                "aria-orientation": "horizontal",
                                tabIndex: 0
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/addition/page.tsx",
                                lineNumber: 615,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "left-form",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: "📍 観光地のタイトル："
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/addition/page.tsx",
                                        lineNumber: 623,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        id: "title",
                                        placeholder: "例：白川郷",
                                        value: title,
                                        onChange: (e)=>setTitle(e.target.value),
                                        onCompositionStart: ()=>{
                                            isComposingRef.current = true;
                                        },
                                        onCompositionEnd: ()=>{
                                            isComposingRef.current = false;
                                        },
                                        onKeyDown: (e)=>{
                                            if (e.key === 'Enter' && !e.shiftKey && !isComposingRef.current) {
                                                e.preventDefault();
                                                geocodeAndMove(title);
                                            }
                                        },
                                        onBlur: ()=>{
                                            const q = normalizeQuery(title);
                                            if (q && q !== lastGeocodeQueryRef.current) {
                                                geocodeAndMove(q);
                                            }
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/addition/page.tsx",
                                        lineNumber: 624,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            marginTop: 10
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                id: "aiSuggestBtn",
                                                type: "button",
                                                onClick: handleAiSuggest,
                                                disabled: aiLoading,
                                                children: "✨ AIで自動生成"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/addition/page.tsx",
                                                lineNumber: 655,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                id: "aiStatus",
                                                children: aiStatus
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/addition/page.tsx",
                                                lineNumber: 663,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/app/addition/page.tsx",
                                        lineNumber: 654,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: "🎨 ジャンル："
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/addition/page.tsx",
                                        lineNumber: 666,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        id: "genre",
                                        value: genre,
                                        onChange: (e)=>setGenre(e.target.value),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "historic",
                                                children: "歴史的建造物"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/addition/page.tsx",
                                                lineNumber: 672,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "nature",
                                                children: "自然"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/addition/page.tsx",
                                                lineNumber: 673,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "city",
                                                children: "都市景観"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/addition/page.tsx",
                                                lineNumber: 674,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "culture",
                                                children: "文化的名所"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/addition/page.tsx",
                                                lineNumber: 675,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/app/addition/page.tsx",
                                        lineNumber: 667,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: "📝 観光地の説明："
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/addition/page.tsx",
                                        lineNumber: 678,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                        id: "description",
                                        placeholder: "ここに観光地の説明を入力してください...",
                                        value: description,
                                        onChange: (e)=>setDescription(e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/addition/page.tsx",
                                        lineNumber: 679,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "imageUpload",
                                        children: "🖼 観光地の写真をアップロード："
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/addition/page.tsx",
                                        lineNumber: 686,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "custom-file-upload",
                                        children: [
                                            "ファイルを選択",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "file",
                                                id: "imageUpload",
                                                accept: "image/*",
                                                onChange: handleImageChange
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/addition/page.tsx",
                                                lineNumber: 689,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/app/addition/page.tsx",
                                        lineNumber: 687,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        id: "fileNameDisplay",
                                        children: selectedImageFile ? selectedImageFile.name : '未選択'
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/addition/page.tsx",
                                        lineNumber: 696,
                                        columnNumber: 13
                                    }, this),
                                    previewUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                        id: "preview",
                                        src: previewUrl,
                                        alt: "プレビュー画像",
                                        style: {
                                            display: 'block'
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/addition/page.tsx",
                                        lineNumber: 701,
                                        columnNumber: 15
                                    }, this),
                                    previewUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        id: "deleteImage",
                                        type: "button",
                                        style: {
                                            display: 'block'
                                        },
                                        onClick: handleDeleteImage,
                                        children: "削除"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/addition/page.tsx",
                                        lineNumber: 709,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        id: "confirmBtn",
                                        type: "button",
                                        onClick: handleSubmit,
                                        children: "✅ この観光地を追加"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/addition/page.tsx",
                                        lineNumber: 719,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/addition/page.tsx",
                                lineNumber: 622,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/addition/page.tsx",
                        lineNumber: 601,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "right-panel",
                        "aria-label": "地図",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            id: "map",
                            ref: mapContainerRef
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/addition/page.tsx",
                            lineNumber: 731,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/addition/page.tsx",
                        lineNumber: 730,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/app/addition/page.tsx",
                lineNumber: 599,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
}),
];

//# sourceMappingURL=frontend_app_addition_page_tsx_df9dac51._.js.map