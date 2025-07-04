document.addEventListener("DOMContentLoaded", () => {
  const isAuthPage = location.pathname.includes("/auth/");

  const navbarHTML = `
    <style>
      .navbar {
        position: fixed;
        top: 0; left: 0; right: 0;
        height: 60px;
        background: linear-gradient(90deg, #0f2027, #203a43, #2c5364);
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        z-index: 2000;
        font-family: 'Orbitron', sans-serif;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2); /* ✅ 影を追加 */
      }

      .navbar .brand {
        font-weight: bold;
        font-size: 20px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .navbar .brand::before {
        content: "🌍 旅行先提案Webシステム";
        font-size: 22px;
      }

      .navbar nav {
        display: flex;
        gap: 16px;
        align-items: center;
      }

      .navbar nav a,
      .navbar nav button {
        text-decoration: none;
        font-weight: bold;
        font-size: 16px;
        background: none;
        border: none;
        cursor: pointer;
        transition: color 0.3s ease;
      }

      .navbar nav a:hover,
      .navbar nav button:hover {
        color: #1abc9c;
      }

      .navbar-toggle {
        display: none;
        font-size: 24px;
        cursor: pointer;
      }

      @media screen and (max-width: 890px) {
        .navbar nav {
          display: none;
          flex-direction: column;
          position: absolute;
          top: 60px;
          left: 0;
          width: 100%;
          background: #1e2a38;
        }

        .navbar.open nav {
          display: flex;
        }

        .navbar-toggle {
          display: block;
        }
      }

      /* ✅ ライトモード用のスタイル */
      body.light .navbar {
        background: linear-gradient(90deg, #f0f0f0, #ffffff);
        color: black;
      }

      body.light .navbar nav a,
      body.light .navbar nav button {
        color: black;
      }

      body.light .navbar nav a:hover,
      body.light .navbar nav button:hover {
        color: #3498db;
      }
    </style>

    <div class="navbar" id="navbar">
      <div class="brand"></div>
      <div class="navbar-toggle" id="navbarToggle">☰</div>
      <nav>
        ${
          isAuthPage
            ? `<button id="themeToggle">🌓 モード切替</button>`
            : `
          <a href="../home.html">🏠 ホーム</a>
          <a href="../settings.html">⚙️ 設定</a>
          <button id="themeToggle">🌓 モード切替</button>
          <button id="logoutButton">🔓 ログアウト</button>`
        }
      </nav>
    </div>
  `;

  document.getElementById("navbar-placeholder").innerHTML = navbarHTML;

  // ☰ トグルメニュー
  const toggle = document.getElementById("navbarToggle");
  const navbar = document.getElementById("navbar");
  if (toggle) {
    toggle.addEventListener("click", () => {
      navbar.classList.toggle("open");
    });
  }

  // ✅ 最初に適用（認証画面でモード切替が反映されない対策）
  const savedTheme = localStorage.getItem("theme") || "light";
  document.body.className = savedTheme;

  // 🌓 テーマ切り替え
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = document.body.className;
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      document.body.className = newTheme;
      localStorage.setItem("theme", newTheme);
    });
  }
if (!isAuthPage) {
  (async () => {
    try {
      const res = await fetch('/api/has_location', { credentials: 'include' });
      if (!res.ok) return;

      const data = await res.json();

      if (!data.hasLocation && !document.getElementById('location-alert-bar')) {
        const alertBar = document.createElement('div');
        alertBar.id = 'location-alert-bar';
        alertBar.textContent = '📍 現在、住所が設定されていません。設定ページから登録してください。';

        const navbar = document.querySelector('.navbar');
        const topOffset = navbar ? navbar.offsetHeight : 60;

        alertBar.style.cssText = `
          position: fixed;
          top: ${topOffset}px;
          left: 0;
          right: 0;
          background-color: #e74c3c;
          color: white;
          text-align: center;
          padding: 10px;
          font-weight: bold;
          font-family: 'Orbitron', sans-serif;
          z-index: 1999;
          border-bottom: 2px solid #c0392b;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;

        document.body.appendChild(alertBar);
      }
    } catch (err) {
      console.error('住所確認エラー:', err);
    }
  })();
}





// 🔓 ログアウト処理（サーバーにもリクエスト送信）
const logoutButton = document.getElementById("logoutButton");
if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    try {
      // サーバー側にトークン削除を要求（Cookie削除）
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include' // ✅ Cookieを含めて送信
      });
    } catch (err) {
      console.error('ログアウトAPIエラー:', err);
    }

    // クライアント側の状態も削除
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("avatar_url");

    alert("ログアウトしました。");
    window.location.href = "auth/login.html";
  });
}


});
