'use client';

import { useEffect, FormEvent } from 'react';
import Script from 'next/script';

export default function ForgotPage() {
  // body class維持（他ページでも整合性あり）
  useEffect(() => {
    document.body.classList.remove('dark');
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const identifier = String(formData.get('identifier') || '').trim();

    if (!identifier) {
      alert('ユーザーIDまたはメールアドレスを入力してください。');
      return;
    }

    try {
      const res = await fetch('/api/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });

      const data = await res.json();
      console.log('[forgot] response:', data);

      if (!res.ok) {
        alert(data.error || 'パスワード再設定メールの送信に失敗しました。');
        return;
      }

      if (!data.ok) {
        alert(data.message || 'パスワード再設定メールの送信に失敗しました。');
        return;
      }

      // pending_token の保存
      if (data.pending_token) {
        sessionStorage.setItem('pw_reset_token', data.pending_token);
      }

      alert('パスワード再設定用の確認コードをメールで送信しました。メールを確認してください。');

      // contact へ遷移
      window.location.href = '/auth/contact';

    } catch (err) {
      console.error('[forgot] error:', err);
      alert('サーバーとの通信に失敗しました。');
    }
  };

  return (
    <>
      <div id="navbar-placeholder"></div>

      <div className="auth-container">
        <h1>🔑 パスワードをお忘れですか？</h1>
        <p className="description">
          ご登録時のユーザーIDまたはメールアドレスを入力してください。<br />
          パスワード再設定用の「6桁の確認コード」をメールでお送りします。
        </p>

        <form className="auth-form" id="forgotForm" onSubmit={handleSubmit}>
          <label htmlFor="identifier">🆔 ユーザーID または 📧 メールアドレス</label>
          <input
            type="text"
            id="identifier"
            name="identifier"
            placeholder="ユーザーID または メールアドレス"
            required
          />

          <button type="submit">確認コードを送信</button>
        </form>

        <div className="auth-links">
          <a href="/auth/login">← ログインに戻る</a>
        </div>
      </div>

      <Script src="/js/navbar.js" strategy="afterInteractive" />
      <link rel="stylesheet" href="./css/style.css" />
    </>
  );
}
