'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type ChangeInfoResponse = {
  kind?: string;
  [key: string]: any;
};

export default function DeleteAccountPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [statusMsg, setStatusMsg] = useState('');
  const [statusOk, setStatusOk] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);

  const setMsg = (text: string, ok = false) => {
    setStatusMsg(text || '');
    setStatusOk(ok);
  };

  const fetchChangeInfo = async (t: string): Promise<ChangeInfoResponse> => {
    const res = await fetch('/api/account/change_info?token=' + encodeURIComponent(t));
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'トークンの確認に失敗しました');
    }
    return res.json();
  };

  const applyDelete = async (t: string) => {
    const res = await fetch('/api/account/change_apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: t, kind: 'delete' }), // 元のHTMLと同じ kind: 'delete'
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(text || '削除に失敗しました');
    }
    return text;
  };

  useEffect(() => {
    if (!token) {
      setMsg('トークンが指定されていません。URLを再確認してください。', false);
      return;
    }

    (async () => {
      setMsg('トークンを確認しています...', false);
      try {
        const info = await fetchChangeInfo(token);
        if (info.kind !== 'delete') {
          setMsg('このリンクはアカウント削除用ではありません。', false);
          return;
        }
      } catch (e: any) {
        console.error(e);
        setMsg(e?.message || 'トークンの確認に失敗しました。', false);
        return;
      }

      setMsg('アカウント削除の準備ができました。', true);
      setPanelVisible(true);
    })();
  }, [token]);

  const handleDeleteClick = async () => {
    if (!token) {
      setMsg('トークンが無効です。URLを再確認してください。', false);
      return;
    }

    const ok = window.confirm(
      '本当にアカウントを削除しますか？\nこの操作は元に戻せません。'
    );
    if (!ok) return;

    try {
      await applyDelete(token);
      setMsg('アカウントを削除しました。ご利用ありがとうございました。', true);
      setPanelVisible(false);
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message || '削除に失敗しました。', false);
    }
  };

  return (
    <>
      {/* 既存の style.css をそのまま利用 */}
      <link rel="stylesheet" href="/css/style.css" />

      <div className="auth-container">
        <h1>アカウント削除</h1>
        <p id="statusMsg" className={`msg ${statusMsg ? (statusOk ? 'ok' : 'err') : ''}`}>
          {statusMsg}
        </p>

        {panelVisible && (
          <div id="deletePanel">
            <p>
              この操作を実行すると、
              <strong>アカウントと関連データが削除されます。</strong>
              <br />
              一度削除すると元に戻すことはできません。本当によろしいですか？
            </p>
            <button
              id="deleteAccountBtn"
              className="danger-btn"
              type="button"
              onClick={handleDeleteClick}
            >
              アカウントを削除する
            </button>
          </div>
        )}

        <p style={{ marginTop: 16 }}>
          削除をやめる場合は <a href="/auth/login">ログイン画面</a> に戻ってください。
        </p>
      </div>
    </>
  );
}
