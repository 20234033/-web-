export async function checkAuthOrRedirect() {
  try {
    const res = await fetch('/api/me');
    const json = await res.json();
    if (!json.success) {
      location.href = 'login.html';
    }
  } catch (err) {
    console.error('認証チェック失敗:', err);
    location.href = 'login.html';
  }
}
