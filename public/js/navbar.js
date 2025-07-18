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
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
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
    transition: right 0.3s ease;
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
    padding: 6px 8px;
  }

  .navbar nav a:hover,
  .navbar nav button:hover {
    color: #1abc9c;
  }

  .navbar-toggle {
    display: none;
    width: 30px;
    height: 20px;
    position: relative;
    cursor: pointer;
    z-index: 2001;
  }

  .navbar-toggle span {
    position: absolute;
    height: 3px;
    width: 100%;
    background-color: white;
    left: 0;
    transition: all 0.3s ease;
    border-radius: 2px;
  }

  .navbar-toggle span:nth-child(1) {
    top: 0;
  }

  .navbar-toggle span:nth-child(2) {
    top: 8px;
  }

  .navbar-toggle span:nth-child(3) {
    top: 16px;
  }

  .navbar.open .navbar-toggle span:nth-child(1) {
    transform: rotate(45deg);
    top: 8px;
  }

  .navbar.open .navbar-toggle span:nth-child(2) {
    opacity: 0;
  }

  .navbar.open .navbar-toggle span:nth-child(3) {
    transform: rotate(-45deg);
    top: 8px;
  }

  @media screen and (max-width: 890px) {
    .navbar nav {
      position: fixed;
      top: 60px;
      right: -300px;
      width: 250px;
      height: 100%;
      flex-direction: column;
      align-items: flex-start;
      padding: 20px;
      gap: 16px;
      z-index: 1998;
      background-color: #1e2a38;
    }

    .navbar.open nav {
      right: 0;
    }

    .navbar-toggle {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .navbar nav a,
    .navbar nav button {
      width: 100%;
      text-align: left;
      padding: 10px;
      font-size: 18px;
    }

    body.dark .navbar nav a,
    body.dark .navbar nav button {
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      color: white;
    }

    body.light .navbar nav a,
    body.light .navbar nav button {
      background-color: rgba(0, 0, 0, 0.05);
      border-radius: 6px;
      color: black;
    }

    body.dark .navbar nav a:hover,
    body.dark .navbar nav button:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    body.light .navbar nav a:hover,
    body.light .navbar nav button:hover {
      background-color: rgba(52, 152, 219, 0.1);
    }
  }

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

  body.light .navbar nav {
    background-color: transparent;
    border-left: none;
  }

  body.dark .navbar nav {
    color: white;
  }

  body.dark .navbar nav a,
  body.dark .navbar nav button {
    color: white;
  }

  body.dark .navbar nav a:hover,
  body.dark .navbar nav button:hover {
    color: #1abc9c;
  }

  body.light .navbar-toggle span {
    background-color: black;
  }
</style>

<div class="navbar" id="navbar">
  <div class="brand"></div>
  <div class="navbar-toggle" id="navbarToggle">
    <span></span>
    <span></span>
    <span></span>
  </div>
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

  const toggle = document.getElementById("navbarToggle");
  const navbar = document.getElementById("navbar");
  if (toggle) {
    toggle.addEventListener("click", () => {
      navbar.classList.toggle("open");
    });
  }

  const savedTheme = localStorage.getItem("theme") || "light";
  document.body.className = savedTheme;

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
        const res = await fetch("/api/has_location", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();

        if (!data.hasLocation && !document.getElementById("location-alert-bar")) {
          const alertBar = document.createElement("div");
          alertBar.id = "location-alert-bar";
          alertBar.textContent = "📍 現在、住所が設定されていません。設定ページから登録してください。";

          const navbar = document.querySelector(".navbar");
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
        console.error("住所確認エラー:", err);
      }
    })();
  }

  const logoutButton = document.getElementById("logoutButton");
  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      try {
        await fetch("/api/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch (err) {
        console.error("ログアウトAPIエラー:", err);
      }

      localStorage.removeItem("user_id");
      localStorage.removeItem("username");
      localStorage.removeItem("avatar_url");

      alert("ログアウトしました。");
      window.location.href = "auth/login.html";
    });
  }
});
