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
    const decoded = jwt.verify(token, JWT_SECRET);
    
    //console.log('[AUTH] デコード成功:', decoded); // ← デバッグ用
    
    // ✅ decoded.uuid ではなく decoded.user_uuid を確認
    if (!decoded?.user_uuid) {
      console.warn('[AUTH] トークンに user_uuid が無い');
      console.warn('[AUTH] decoded の中身:', decoded); // ← 追加デバッグ
      return res.status(401).json({ error: 'Invalid token payload' });
    }
    
    req.user = decoded;
    
    //console.log('[AUTH] req.user セット完了:', req.user); // ← 確認用
    
    return next();
  } catch (err) {
    console.warn('[AUTH] トークン検証失敗:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { authenticate };