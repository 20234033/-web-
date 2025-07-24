const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    console.warn('[AUTH] トークンが見つかりません');
    return res.status(401).json({ error: 'Token not found' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[AUTH] トークン検証成功:', decoded);
    req.user = decoded; // 例: { uuid, username }
    next();
  } catch (err) {
    console.warn('[AUTH] トークン検証失敗:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { authenticate };
