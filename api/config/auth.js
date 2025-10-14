// config/auth.js
require('dotenv').config(); // 念のためここでも読み込む
const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY || 'dev-secret';
module.exports = { JWT_SECRET };
