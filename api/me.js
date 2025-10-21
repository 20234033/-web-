// routes/me.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('./middleware/authenticate');
const pool = require('./db'); // mysql2/promise のプールを想定

/**
 * GET /api/me
 * - Cookie(token) で認証済み（authenticate）
 * - USERS(uuid, id, mail_address, avatar_url, location_lat, location_lng)
 * - レスポンス: { uuid, id, email, avatar_url, location_lat, location_lng }
 */
router.get('/me', authenticate, async (req, res) => {
  const userUuid = req.user?.uuid;
  if (!userUuid) {
    // 認証ミドルウェアを通っているのに uuid が無いのはトークン不正
    return res.status(401).json({ error: 'Invalid token payload' });
  }

  try {
    // mysql2/promise: query() は [rows, fields] を返す
    const [rows] = await pool.query(
      `SELECT uuid, id, mail_address, avatar_url, location_lat, location_lng
         FROM USERS
        WHERE uuid = ?
        LIMIT 1`,
      [userUuid]
    );

    // rows は必ず配列
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const u = rows[0];

    // 念のため、期待キーだけ返す（余計な列が混ざらないように）
    return res.json({
      uuid: u.uuid,
      id: u.id,
      email: u.mail_address,
      avatar_url: u.avatar_url ?? null,
      location_lat: u.location_lat ?? null,
      location_lng: u.location_lng ?? null,
    });
  } catch (err) {
    console.error('[me取得失敗]', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
