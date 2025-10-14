const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/auth');

const authenticate = (req, res, next) => {
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null);

  if (!token) {
    console.warn('[AUTH] トークンが見つかりません');
    return res.status(401).json({ error: 'Token not found' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET); // ← 統一鍵
    if (!decoded?.uuid) {
      console.warn('[AUTH] トークンに uuid が無い');
      return res.status(401).json({ error: 'Invalid token payload' });
    }
    // サーバ全体で uuid を使うポリシーに統一
    req.user = { uuid: decoded.uuid };
    return next();
  } catch (err) {
    console.warn('[AUTH] トークン検証失敗:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { authenticate };
