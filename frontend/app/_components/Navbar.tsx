'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type Theme = 'light' | 'dark';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  // 旧 navbar.js と同じ判定ロジック
  const isAuthPage = pathname?.includes('/auth/') ?? false;

  const [theme, setTheme] = useState<Theme>('light');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLocationAlert, setShowLocationAlert] = useState(false);

  // ===== テーマ初期化（旧 navbar.js 相当） =====
  useEffect(() => {
    const saved =
      (typeof window !== 'undefined'
        ? (localStorage.getItem('theme') as Theme | null)
        : null) || 'light';

    setTheme(saved);
    document.body.className = saved;
  }, []);

  // ===== 住所アラート（/api/has_location） =====
  useEffect(() => {
    if (isAuthPage) {
      setShowLocationAlert(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/has_location`, {
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        setShowLocationAlert(!data.hasLocation);
      } catch (err) {
        console.error('住所確認エラー:', err);
      }
    })();
  }, [isAuthPage]);

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.body.className = next;
    localStorage.setItem('theme', next);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('ログアウトAPIエラー:', err);
    }

    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('avatar_url');

    alert('ログアウトしました。');
    router.push('/auth/login');
  };

  return (
    <>
      {/* ここ、HTML 構造を元 navbar.html と揃えている */}
      <div className={`navbar ${menuOpen ? 'open' : ''}`} id="navbar">
        {/* brand は中身を空にして ::before でテキストを出す（元と同じ） */}
        <div className="brand" />

        <div
          className="navbar-toggle"
          id="navbarToggle"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </div>

        <nav>
          {isAuthPage ? (
            <button id="themeToggle" type="button" onClick={toggleTheme}>
              🌓 モード切替
            </button>
          ) : (
            <>
              <a href="/home">🏠 ホーム</a>
              <a href="/settings">⚙️ 設定</a>
              <button id="themeToggle" type="button" onClick={toggleTheme}>
                🌓 モード切替
              </button>
              <button id="logoutButton" type="button" onClick={handleLogout}>
                🔓 ログアウト
              </button>
            </>
          )}
        </nav>
      </div>

      {showLocationAlert && (
        <div id="location-alert-bar">
          📍 現在、住所が設定されていません。設定ページから登録してください。
        </div>
      )}
    </>
  );
}
