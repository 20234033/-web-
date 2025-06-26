const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();

const SECRET_KEY = process.env.SECRET_KEY;
const pool = require('./db'); // ← これは pool を export しているファイル（必要に応じて調整）

router.get('/api/me', async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'トークンがありません。' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    const conn = await pool.getConnection();
    const rows = await conn.query('SELECT id, avatar_url FROM USERS WHERE id = ? LIMIT 1', [decoded.id]);
    conn.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'ユーザーが見つかりません。' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('[認証エラー]', err);
    res.status(401).json({ error: '無効なトークンです。' });
  }
});

module.exports = router;
