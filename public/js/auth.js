export async function checkAuthOrRedirect() {
  try {
    const res = await fetch('/api/me');
    const json = await res.json();
    if (!json.success) {
      location.href = 'login';
    }
  } catch (err) {
    console.error('認証チェック失敗:', err);
    location.href = 'login';
  }
}
