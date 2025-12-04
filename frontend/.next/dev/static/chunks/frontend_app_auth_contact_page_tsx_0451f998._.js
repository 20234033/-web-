(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/app/auth/contact/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PasswordResetContactPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
function PasswordResetContactPage() {
    _s();
    const tokenRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // forgot で発行したトークンがない場合は戻す
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PasswordResetContactPage.useEffect": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            const token = window.sessionStorage.getItem('pw_reset_token');
            if (!token) {
                alert('パスワード再設定の手順を最初からやり直してください。');
                window.location.href = '/auth/forgot';
                return;
            }
            tokenRef.current = token;
        }
    }["PasswordResetContactPage.useEffect"], []);
    const handleSubmit = async (e)=>{
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const code = String(formData.get('code') || '').trim();
        const newPassword = String(formData.get('newPassword') || '');
        const newPassword2 = String(formData.get('newPassword2') || '');
        const token = tokenRef.current;
        if (!token) {
            alert('パスワード再設定の手順を最初からやり直してください。');
            window.location.href = '/auth/forgot';
            return;
        }
        if (!/^[0-9]{6}$/.test(code)) {
            alert('確認コードは6桁の数字で入力してください。');
            return;
        }
        if (newPassword.length < 8) {
            alert('パスワードは8文字以上にしてください。');
            return;
        }
        if (newPassword !== newPassword2) {
            alert('新しいパスワードが一致しません。');
            return;
        }
        try {
            const res = await fetch('/api/password/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pending_token: token,
                    code,
                    newPassword
                })
            });
            const data = await res.json();
            console.log('[reset] response:', data);
            if (!res.ok) {
                alert(data.error || 'パスワードの変更に失敗しました。');
                return;
            }
            if (!data.ok) {
                alert(data.error || data.message || 'パスワードの変更に失敗しました。');
                return;
            }
            // 成功したのでトークンを消す
            window.sessionStorage.removeItem('pw_reset_token');
            alert('パスワードを変更しました。新しいパスワードでログインしてください。');
            window.location.href = '/auth/login';
        } catch (err) {
            console.error('[reset] error:', err);
            alert('サーバーとの通信に失敗しました。');
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "auth-container",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    children: "📩 確認コードを入力してください"
                }, void 0, false, {
                    fileName: "[project]/frontend/app/auth/contact/page.tsx",
                    lineNumber: 92,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "description",
                    children: [
                        "メールでお送りした ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                            children: "6桁の確認コード"
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/auth/contact/page.tsx",
                            lineNumber: 94,
                            columnNumber: 21
                        }, this),
                        " と",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                            fileName: "[project]/frontend/app/auth/contact/page.tsx",
                            lineNumber: 95,
                            columnNumber: 11
                        }, this),
                        "新しいパスワードを入力してください。"
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/app/auth/contact/page.tsx",
                    lineNumber: 93,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                    className: "auth-form",
                    id: "verifyForm",
                    onSubmit: handleSubmit,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            htmlFor: "code",
                            children: "6桁の確認コード"
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/auth/contact/page.tsx",
                            lineNumber: 100,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "text",
                            id: "code",
                            name: "code",
                            maxLength: 6,
                            inputMode: "numeric",
                            pattern: "[0-9]{6}",
                            required: true,
                            placeholder: "例: 123456"
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/auth/contact/page.tsx",
                            lineNumber: 101,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            htmlFor: "newPassword",
                            children: "新しいパスワード"
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/auth/contact/page.tsx",
                            lineNumber: 112,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "password",
                            id: "newPassword",
                            name: "newPassword",
                            minLength: 8,
                            required: true,
                            placeholder: "8文字以上"
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/auth/contact/page.tsx",
                            lineNumber: 113,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            htmlFor: "newPassword2",
                            children: "新しいパスワード（確認）"
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/auth/contact/page.tsx",
                            lineNumber: 122,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "password",
                            id: "newPassword2",
                            name: "newPassword2",
                            minLength: 8,
                            required: true,
                            placeholder: "同じパスワードを再入力"
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/auth/contact/page.tsx",
                            lineNumber: 123,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "submit",
                            children: "パスワードを変更する"
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/auth/contact/page.tsx",
                            lineNumber: 132,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/app/auth/contact/page.tsx",
                    lineNumber: 99,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "auth-links",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            href: "/auth/forgot",
                            children: "← メールアドレスの入力に戻る"
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/auth/contact/page.tsx",
                            lineNumber: 136,
                            columnNumber: 11
                        }, this),
                        " |",
                        ' ',
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            href: "/auth/login",
                            children: "ログイン画面へ"
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/auth/contact/page.tsx",
                            lineNumber: 137,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/app/auth/contact/page.tsx",
                    lineNumber: 135,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/app/auth/contact/page.tsx",
            lineNumber: 91,
            columnNumber: 7
        }, this)
    }, void 0, false);
}
_s(PasswordResetContactPage, "kKyXvrOtEp3hdhpSryFEH5+acNM=");
_c = PasswordResetContactPage;
var _c;
__turbopack_context__.k.register(_c, "PasswordResetContactPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=frontend_app_auth_contact_page_tsx_0451f998._.js.map