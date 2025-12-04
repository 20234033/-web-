(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/app/add_result/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AddResultPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/navigation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
const buildStreetViewUrl = (spot)=>{
    if (!spot) return null;
    if (spot.streetViewUrl) return spot.streetViewUrl;
    if (typeof spot.lat !== 'number' || typeof spot.lng !== 'number') {
        return null;
    }
    return `https://www.google.com/maps/embed?pb=!1m0!3m2!1sja!2sjp!4v1717900000000!6m8!1m7!1sCAoSLEFGMVFpcFBHNG4yTTI5UHBUMXQ3cEpNclRLclZzMXN1OGpOa2Y1b1kydGpm!2m2!1d${spot.lat}!2d${spot.lng}!3f0!4f0!5f1.1924812503605782`;
};
function AddResultPage() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const mapContainerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const mapRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [spot, setSpot] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [streetViewUrl, setStreetViewUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // ===== CSS 注入 =====
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AddResultPage.useEffect": ()=>{
            const existing = document.getElementById('add-result-style');
            if (!existing) {
                const style = document.createElement('style');
                style.id = 'add-result-style';
                style.textContent = `
html, body {
  margin: 0;
  height: 100%;
  overflow: hidden;
  font-family: 'Arial', sans-serif;
}

#result-map {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.info-box {
  position: absolute;
  top: 80px;
  right: 20px;
  width: 320px;
  background: rgba(255, 255, 255, 0.95);
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  z-index: 1001;
}

.info-box h3 {
  margin: 0 0 8px;
  color: #ff9800;
  font-size: 20px;
}

.info-box p {
  margin: 6px 0;
  font-size: 14px;
}

.info-box img {
  width: 100%;
  border-radius: 8px;
  margin-top: 8px;
}

#streetview-container {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 320px;
  height: 200px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  z-index: 1001;
  transition: transform 0.3s ease;
}

#streetview-container:hover {
  transform: scale(1.2);
}

#streetview-container iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.bottom-buttons {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 16px;
  z-index: 1001;
}

.bottom-buttons button {
  padding: 10px 18px;
  font-size: 16px;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  background-color: #1976d2;
  color: white;
  cursor: pointer;
  transition: background 0.3s ease;
}

.bottom-buttons button:hover {
  background-color: #0d47a1;
}
      `;
                document.head.appendChild(style);
            }
        }
    }["AddResultPage.useEffect"], []);
    // ===== localStorage から newSpot を取得 =====
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AddResultPage.useEffect": ()=>{
            try {
                const raw = ("TURBOPACK compile-time truthy", 1) ? window.localStorage.getItem('newSpot') : "TURBOPACK unreachable";
                if (!raw) {
                    alert('観光地の情報が見つかりません。');
                    router.replace('/addition');
                    return;
                }
                const parsed = JSON.parse(raw);
                const title = parsed?.title;
                const latNum = Number(parsed?.lat);
                const lngNum = Number(parsed?.lng);
                if (!title || Number.isNaN(latNum) || Number.isNaN(lngNum)) {
                    alert('観光地の情報が不正です。');
                    router.replace('/addition');
                    return;
                }
                // 画像プロパティは全部ケア
                const image = parsed.image ?? parsed.image_path ?? parsed.imagePath ?? null;
                const s = {
                    title,
                    description: parsed.description ?? '',
                    lat: latNum,
                    lng: lngNum,
                    image,
                    streetViewUrl: parsed.streetViewUrl ?? null
                };
                setSpot(s);
                setStreetViewUrl(buildStreetViewUrl(s));
            // 🔸 ここは一旦削除しないようにする（リロード対応）
            // window.localStorage.removeItem('newSpot');
            } catch (e) {
                console.error('[add_result] failed to load newSpot', e);
                alert('観光地の情報の読み込みに失敗しました。');
                router.replace('/addition');
            }
        }
    }["AddResultPage.useEffect"], [
        router
    ]);
    // ===== Leaflet で地図を描画 =====
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AddResultPage.useEffect": ()=>{
            if (!spot) return;
            if (!mapContainerRef.current) return;
            let cancelled = false;
            ({
                "AddResultPage.useEffect": async ()=>{
                    if (!document.querySelector('link[href*="leaflet.css"]')) {
                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
                        document.head.appendChild(link);
                    }
                    const leafletModule = await __turbopack_context__.A("[project]/frontend/node_modules/leaflet/dist/leaflet-src.js [app-client] (ecmascript, async loader)");
                    if (cancelled) return;
                    const L = leafletModule.default ?? leafletModule;
                    const map = L.map(mapContainerRef.current).setView([
                        spot.lat,
                        spot.lng
                    ], 14);
                    mapRef.current = map;
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; OpenStreetMap contributors'
                    }).addTo(map);
                    L.marker([
                        spot.lat,
                        spot.lng
                    ]).addTo(map).bindPopup(spot.title).openPopup();
                }
            })["AddResultPage.useEffect"]();
            return ({
                "AddResultPage.useEffect": ()=>{
                    cancelled = true;
                    if (mapRef.current) {
                        mapRef.current.remove();
                        mapRef.current = null;
                    }
                }
            })["AddResultPage.useEffect"];
        }
    }["AddResultPage.useEffect"], [
        spot
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                id: "navbar-placeholder"
            }, void 0, false, {
                fileName: "[project]/frontend/app/add_result/page.tsx",
                lineNumber: 246,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                id: "result-map",
                ref: mapContainerRef
            }, void 0, false, {
                fileName: "[project]/frontend/app/add_result/page.tsx",
                lineNumber: 248,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "info-box",
                id: "infoBox",
                children: spot ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: "📍 追加された観光地"
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/add_result/page.tsx",
                            lineNumber: 253,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            children: spot.title
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/add_result/page.tsx",
                            lineNumber: 254,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: spot.description
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/add_result/page.tsx",
                            lineNumber: 255,
                            columnNumber: 13
                        }, this),
                        spot.image && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                            src: spot.image,
                            alt: "観光地画像"
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/add_result/page.tsx",
                            lineNumber: 257,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    children: "観光地情報を読み込み中..."
                }, void 0, false, {
                    fileName: "[project]/frontend/app/add_result/page.tsx",
                    lineNumber: 261,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/app/add_result/page.tsx",
                lineNumber: 250,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                id: "streetview-container",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("iframe", {
                    id: "streetview",
                    src: streetViewUrl ?? undefined,
                    allowFullScreen: true,
                    loading: "lazy"
                }, void 0, false, {
                    fileName: "[project]/frontend/app/add_result/page.tsx",
                    lineNumber: 266,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/app/add_result/page.tsx",
                lineNumber: 265,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bottom-buttons",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>router.push('/addition'),
                        children: "➕ 観光地をさらに追加"
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/add_result/page.tsx",
                        lineNumber: 275,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>router.push('/home'),
                        children: "🏠 ホームに戻る"
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/add_result/page.tsx",
                        lineNumber: 281,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/app/add_result/page.tsx",
                lineNumber: 274,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
_s(AddResultPage, "yFFqDABi+PvQUAQ49HVjCfdlQ5Q=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = AddResultPage;
var _c;
__turbopack_context__.k.register(_c, "AddResultPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=frontend_app_add_result_page_tsx_15d9a3e7._.js.map