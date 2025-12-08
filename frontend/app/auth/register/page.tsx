'use client';

import { FormEvent } from 'react';

export default function RegisterPage() {
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const id = String(formData.get('id') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const pass = String(formData.get('pass') || '');
    const confirm = String(formData.get('confirm') || '');

    // ========= ID validation =========
    if (!/^[a-zA-Z0-9_]+$/.test(id)) {
      alert('ユーザーIDは英数字と _ のみ使用できます。');
      return;
    }

    // ========= password length =========
    if (pass.length < 8) {
      alert('パスワードは8文字以上で入力してください。');
      return;
    }

    // ========= password match =========
    if (pass !== confirm) {
      alert('パスワードが一致しません。');
      return;
    }

    // ========= ID duplication check =========
    try {
      const checkRes = await fetch('/api/check_id?id=' + encodeURIComponent(id));
      const checkData = await checkRes.json();

      if (checkData?.exists) {
        alert('このユーザーIDはすでに使用されています。');
        return;
      }
    } catch (err) {
      console.error('ID重複チェックエラー:', err);
      alert('IDの重複チェックに失敗しました。');
      return;
    }

    // ========= Register request =========
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, email, password: pass }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.warn('register: JSON ではないレスポンス', jsonErr);
      }

      if (!res.ok) {
        alert(data?.error || '登録に失敗しました。');
        return;
      }

      alert(
        data?.message ||
          '登録が完了しました！メールを確認して認証を行ってください。'
      );
      window.location.href = '/auth/login';
    } catch (err) {
      console.error('登録エラー:', err);
      alert('サーバーとの通信に失敗しました。');
    }
  };

  return (
    <div className="auth-container">
      <h2>新規登録</h2>
      <form id="registerForm" onSubmit={handleSubmit}>
        <input type="text" name="id" placeholder="ユーザーID" required />
        <input type="email" name="email" placeholder="メールアドレス" required />
        <input
          type="password"
          name="pass"
          placeholder="パスワード（8文字以上）"
          required
        />
        <input
          type="password"
          name="confirm"
          placeholder="パスワード確認"
          required
        />
        <button type="submit">登録</button>
      </form>

      <div className="auth-links">
        <a href="/auth/login">ログインへ戻る</a>
      </div>
    </div>
  );
}
