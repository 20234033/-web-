'use client';

import { FormEvent } from 'react';

export default function LoginPage() {
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const identifier = String(formData.get('identifier') || '');
    const password = String(formData.get('password') || '');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
        credentials: 'include', // Cookie を送受信
      });

      console.log('レスポンスステータス:', response.status);

      const result = await response.json();
      console.log('レスポンスJSON:', result);

      if (response.ok) {
        const user = result.user;
        // 旧 login.html と同じ localStorage 挙動
        localStorage.setItem('user_id', user.id);
        localStorage.setItem('username', user.id);
        localStorage.setItem('avatar_url', user.avatar_url || '');
        alert('ログイン成功');
        window.location.href = '/home';
      } else {
        alert(result.error || 'ログインに失敗しました。');
      }
    } catch (err: any) {
      console.error('ログイン中のエラー:', err?.name, err?.message);
      alert('サーバーとの通信中にエラーが発生しました。');
    }
  };

  return (
    <>
      {/* ここから元の body 内レイアウトと同等の構造 */}
      <div className="auth-container">
        <h2>ログイン</h2>
        <form id="loginForm" onSubmit={handleSubmit}>
          <input
            type="text"
            name="identifier"
            placeholder="ユーザーIDまたはメールアドレス"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="パスワード"
            required
          />
          <button type="submit">ログイン</button>
        </form>

        <div className="auth-links">
          <a href="/auth/register">新規登録</a> |{' '}
          <a href="/auth/forgot">パスワードをお忘れですか？</a>
        </div>
      </div>
    </>
  );
}
