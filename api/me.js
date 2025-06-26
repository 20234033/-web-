const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();
const SECRET_KEY = 'abcde12345';

router.get('/', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: '未認証です。' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    res.json({ id: decoded.id }); // 必要に応じてユーザ情報を返してもOK
  } catch (err) {
    res.status(401).json({ error: 'トークンが無効です。' });
  }
});

module.exports = router;
