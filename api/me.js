const express = require('express');
const router = express.Router();
const { authenticate } = require('./middleware/authenticate');
const pool = require('./db'); // ← あなたのDB接続モジュールに応じて変更

router.get('/api/me', authenticate, async (req, res) => {
  const userUuid = req.user?.uuid;

  if (!userUuid) {
    return res.status(401).json({ error: 'Invalid token payload' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, mail_address, avatar_url, location_lat, location_lng FROM USERS WHERE uuid = ?',
      [userUuid]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];
    res.json({
      uuid: userUuid,
      id: user.id,
      email: user.mail_address,
      avatar_url: user.avatar_url,
      location_lat: user.location_lat,
      location_lng: user.location_lng,
    });
  } catch (err) {
    console.error('[me取得失敗]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
