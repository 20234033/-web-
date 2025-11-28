'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Kind = 'username' | 'email' | 'password' | 'delete_account' | null;

export default function AccountChangePage() {
  const searchParams = useSearchParams();
  const [kind, setKind] = useState<Kind>(null);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [statusOk, setStatusOk] = useState<boolean>(false);

  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword1, setNewPassword1] = useState('');
  const [newPassword2, setNewPassword2] = useState('');

  const token = searchParams.get('token') || '';

  const setMsg = (text: string, ok = false) => {
    setStatusMsg(text || '');
    setStatusOk(ok);
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const fetchChangeInfo = async (t: string) => {
    const res = await fetch(`/api/account/change_info?token=${encodeURIComponent(t)}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'トークンの確認に失敗しました');
    }
    return res.json() as Promise<{ kind: Kind }>;
  };

  const applyChange = async (body: Record<string, unknown>) => {
    const res = await fetch('/api/account/change_apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(text || '変更に失敗しました');
    }
    return text;
  };

  // 初期ロード（トークン確認 & kind 取得）
  useEffect(() => {
    if (!token) {
      setMsg('トークンが指定されていません。URLを再確認してください。', false);
      return;
    }

    (async () => {
      try {
        setMsg('トークンを確認しています...', false);
        const info = await fetchChangeInfo(token);
        if (!info.kind) {
          setMsg('不明な変更種別です。リンクが壊れている可能性があります。', false);
          return;
        }
        setKind(info.kind);
        setMsg('', false);
      } catch (e: any) {
        console.error(e);
        setMsg(e?.message || 'トークンの確認に失敗しました。', false);
      }
    })();
  }, [token]);

  // ID変更
  const handleChangeUsername = async () => {
    if (!token) {
      setMsg('トークンが無効です。URLを再確認してください。', false);
      return;
    }

    const trimmed = newUsername.trim();
    if (!trimmed) {
      setMsg('新しいIDを入力してください。', false);
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setMsg('IDは英数字とアンダースコア（_）のみ使用できます。', false);
      return;
    }

    // 重複チェック
    try {
      const checkRes = await fetch('/api/check_id?id=' + encodeURIComponent(trimmed));
      let checkData: any = {};
      try {
        checkData = await checkRes.json();
      } catch (err) {
        console.error('ID重複チェックのJSONパースに失敗:', err);
      }

      if (checkData && checkData.exists) {
        setMsg('このIDはすでに使用されています。別のIDを指定してください。', false);
        return;
      }
    } catch (err) {
      console.error('ID重複チェックエラー:', err);
      setMsg('IDの重複チェックに失敗しました。時間をおいて再度お試しください。', false);
      return;
    }

    try {
      await applyChange({ token, kind: 'username', newUsername: trimmed });
      setMsg('IDを変更しました。ログインし直してください。', true);
    } catch (e: any) {
      setMsg(e?.message || 'IDの変更に失敗しました。', false);
    }
  };

  // メール変更
  const handleChangeEmail = async () => {
    if (!token) {
      setMsg('トークンが無効です。URLを再確認してください。', false);
      return;
    }

    const trimmed = newEmail.trim();
    if (!trimmed) {
      setMsg('新しいメールアドレスを入力してください。', false);
      return;
    }
    if (!isValidEmail(trimmed)) {
      setMsg('メールアドレスの形式が正しくありません。', false);
      return;
    }

    try {
      await applyChange({ token, kind: 'email', newEmail: trimmed });
      setMsg('メールアドレスを変更しました。ログインし直してください。', true);
    } catch (e: any) {
      setMsg(e?.message || 'メールアドレスの変更に失敗しました。', false);
    }
  };

  // パスワード変更
  const handleChangePassword = async () => {
    if (!token) {
      setMsg('トークンが無効です。URLを再確認してください。', false);
      return;
    }

    if (!newPassword1 || !newPassword2) {
      setMsg('新しいパスワードを2回入力してください。', false);
      return;
    }
    if (newPassword1 !== newPassword2) {
      setMsg('パスワードが一致していません。', false);
      return;
    }
    if (newPassword1.length < 8) {
      setMsg('パスワードは8文字以上で入力してください。', false);
      return;
    }

    try {
      await applyChange({ token, kind: 'password', newPassword: newPassword1 });
      setMsg('パスワードを変更しました。新しいパスワードでログインしてください。', true);
    } catch (e: any) {
      setMsg(e?.message || 'パスワードの変更に失敗しました。', false);
    }
  };

  // アカウント削除
  const handleDeleteAccount = async () => {
    if (!token) {
      setMsg('トークンが無効です。URLを再確認してください。', false);
      return;
    }

    const ok = window.confirm('本当にアカウントを削除してよろしいですか？');
    if (!ok) return;

    try {
      await applyChange({ token, kind: 'delete_account' });
      setMsg('アカウントを削除しました。ご利用ありがとうございました。', true);
    } catch (e: any) {
      setMsg(e?.message || 'アカウントの削除に失敗しました。', false);
    }
  };

  return (
    <>
      {/* auth 系ページで共通の CSS を読み込み */}
      <link rel="stylesheet" href="/css/style.css" />

      <div className="auth-container">
        <h1>アカウント情報の変更</h1>
        <p id="statusMsg" className={`msg ${statusMsg ? (statusOk ? 'ok' : 'err') : ''}`}>
          {statusMsg}
        </p>

        {/* ID変更 */}
        {kind === 'username' && (
          <div id="form-username" className="change-form">
            <h2>IDの変更</h2>
            <p>新しいIDを入力してください。（英数字とアンダースコアのみ）</p>
            <input
              id="newUsername"
              type="text"
              placeholder="新しいID"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
            <button id="submitUsernameBtn" onClick={handleChangeUsername}>
              IDを変更する
            </button>
          </div>
        )}

        {/* メールアドレス変更 */}
        {kind === 'email' && (
          <div id="form-email" className="change-form">
            <h2>メールアドレスの変更</h2>
            <p>新しいメールアドレスを入力してください。</p>
            <input
              id="newEmail"
              type="email"
              placeholder="新しいメールアドレス"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <button id="submitEmailBtn" onClick={handleChangeEmail}>
              メールアドレスを変更する
            </button>
          </div>
        )}

        {/* パスワード変更 */}
        {kind === 'password' && (
          <div id="form-password" className="change-form">
            <h2>パスワードの変更</h2>
            <p>新しいパスワードを入力してください。（8文字以上）</p>
            <input
              id="newPassword"
              type="password"
              placeholder="新しいパスワード"
              value={newPassword1}
              onChange={(e) => setNewPassword1(e.target.value)}
            />
            <input
              id="newPassword2"
              type="password"
              placeholder="新しいパスワード（確認用）"
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
            />
            <button id="submitPasswordBtn" onClick={handleChangePassword}>
              パスワードを変更する
            </button>
          </div>
        )}

        {/* アカウント削除 */}
        {kind === 'delete_account' && (
          <div id="form-delete" className="change-form">
            <h2>アカウント削除</h2>
            <p className="warning">
              この操作を行うと、アカウントおよび関連するデータが削除される場合があります。
              <br />
              元に戻すことはできません。本当に削除してよろしいですか？
            </p>
            <button id="submitDeleteBtn" className="danger-btn" onClick={handleDeleteAccount}>
              アカウントを削除する
            </button>
          </div>
        )}

        <p style={{ marginTop: 16 }}>
          手続きをやめる場合は <a href="/auth/login">ログイン画面</a> に戻ってください。
        </p>
      </div>
    </>
  );
}
