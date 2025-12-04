'use client';

import { FormEvent, useEffect, useRef } from 'react';

export default function PasswordResetContactPage() {
  const tokenRef = useRef<string | null>(null);

  // forgot で発行したトークンがない場合は戻す
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = window.sessionStorage.getItem('pw_reset_token');

    if (!token) {
      alert('パスワード再設定の手順を最初からやり直してください。');
      window.location.href = '/auth/forgot';
      return;
    }

    tokenRef.current = token;
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pending_token: token,
          code,
          newPassword,
        }),
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

  return (
    <>
      <div className="auth-container">
        <h1>📩 確認コードを入力してください</h1>
        <p className="description">
          メールでお送りした <strong>6桁の確認コード</strong> と
          <br />
          新しいパスワードを入力してください。
        </p>

        <form className="auth-form" id="verifyForm" onSubmit={handleSubmit}>
          <label htmlFor="code">6桁の確認コード</label>
          <input
            type="text"
            id="code"
            name="code"
            maxLength={6}
            inputMode="numeric"
            pattern="[0-9]{6}"
            required
            placeholder="例: 123456"
          />

          <label htmlFor="newPassword">新しいパスワード</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            minLength={8}
            required
            placeholder="8文字以上"
          />

          <label htmlFor="newPassword2">新しいパスワード（確認）</label>
          <input
            type="password"
            id="newPassword2"
            name="newPassword2"
            minLength={8}
            required
            placeholder="同じパスワードを再入力"
          />

          <button type="submit">パスワードを変更する</button>
        </form>

        <div className="auth-links">
          <a href="/auth/forgot">← メールアドレスの入力に戻る</a> |{' '}
          <a href="/auth/login">ログイン画面へ</a>
        </div>
      </div>
    </>
  );
}
