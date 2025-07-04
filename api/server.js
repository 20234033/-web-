require('dotenv').config(); // .envを最上部で読み込む

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const mariadb = require('mariadb');
const cors = require('cors');
const db = require('./db.js'); // もしくは './database' など、正しいパスで


const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'your-default-secret';

// ✅ DB接続プール（poolは後で使えるようにmodule.exportsしてもOK）
const pool = mariadb.createPool({
  host: 'localhost',
  user: 'geoapp',
  password: 'Password',
  database: 'website',
  connectionLimit: 5
});

// 📁 パス定義
const publicPath = path.join(__dirname, '..', 'public');
const imageDir = path.join(publicPath, 'image');
const dataDir = path.join(publicPath, 'data');
const jsonFilePath = path.join(dataDir, 'sightseeing.json');

// 📁 ディレクトリ作成（初回用）
if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(jsonFilePath)) fs.writeFileSync(jsonFilePath, '[]', 'utf-8');

// ✅ ミドルウェア設定
app.use(cookieParser()); // JWT読み取り用
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(publicPath)); // 静的ファイル
app.use('/image', express.static(path.join(__dirname, '..', 'public', 'image')));


app.use(cors({
  origin: true, // ← フロントのURLポート番号を正確に指定
  credentials: true
}));

// ✅ APIルート読み込み（cookieParserの後に）
const meRoute = require('./me');
app.use(meRoute);

// 💡 必要であれば pool も他ファイルで使えるようにexport可能
module.exports = { app, pool, SECRET_KEY };

// 🖼 multer 設定（画像保存）
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imageDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = crypto.randomBytes(8).toString('hex') + ext;
    cb(null, filename);
  }
});
const upload = multer({ storage });

// 🔐 初期リダイレクト（例：ログインページ）
app.get('/', (req, res) => {
  res.redirect('/auth/login.html');
});

// 🔐 認証API（仮）
app.post('/api/register', async (req, res) => {
  const { id, email, password } = req.body;

  if (!id || !email || !password) {
    return res.status(400).json({ error: '全ての項目を入力してください。' });
  }

  try {
    const conn = await pool.getConnection();

    // 既存ユーザー確認
    const exists = await conn.query(
      'SELECT id FROM USERS WHERE id = ? OR mail_address = ?',
      [id, email]
    );
    if (exists.length > 0) {
      conn.release();
      return res.status(409).json({ error: '既に使用されているIDまたはメールアドレスです。' });
    }

    // パスワードハッシュ化
    const hash = await bcrypt.hash(password, 10);

    // 登録
    await conn.query(
      'INSERT INTO USERS (id, mail_address, password_hash) VALUES (?, ?, ?)',
      [id, email, hash]
    );
    conn.release();

    console.log(`[✅ 登録完了] ID: ${id} / Email: ${email}`);

    // 仮のメール送信成功を返す
    res.json({ message: '登録が完了しました（仮）' });

  } catch (err) {
    console.error('[❌ 登録エラー]', err);
    res.status(500).json({ error: '登録中にエラーが発生しました。' });
  }
});

const authenticate = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // JWTに { user_id } が含まれていることが前提
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
// me.js や /api/me の中
app.get('/api/me', authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await pool.query(
      'SELECT username, avatar_url, location_lat, location_lng FROM USERS WHERE id = ?',
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0]; // ← ここ重要

    res.json({
      id: userId,
      username: user.username,
      avatar_url: user.avatar_url,
      location_lat: user.location_lat,
      location_lng: user.location_lng
    });
  } catch (err) {
    console.error('ユーザー情報取得エラー:', err);
    res.status(500).json({ error: 'DB error' });
  }
});




app.post('/api/login', async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'IDまたはメールアドレスとパスワードを入力してください。' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    const rows = await conn.query(
      'SELECT * FROM USERS WHERE id = ? OR mail_address = ? LIMIT 1',
      [identifier, identifier]
    );

    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'ログイン情報が正しくありません。' });
    }

    // ✅ JWT トークン生成
    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '7d' });

    // ✅ Cookie に保存
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // ← ✅ HTTP環境ではfalseにする
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // ✅ 応答
    res.json({
      message: 'ログイン成功',
      user: {
        id: user.id,
        avatar_url: user.avatar_url || null,
      },
    });

  } catch (err) {
    console.error('[ログイン失敗]', err);
    res.status(500).json({ error: 'ログイン処理中にエラーが発生しました。' });
  } finally {
    if (conn) conn.release();
  }
});



app.post('/api/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: false, // 本番では true（HTTPS）
    sameSite: 'Lax'
  });
  res.json({ message: 'ログアウト完了' });
});




app.post('/api/reset-password', (req, res) => {
  const { identifier } = req.body;
  console.log(`[RESET] Identifier: ${identifier}`);
  res.json({ message: 'パスワードリセットリンクを送信しました（仮）' });
});

// ✅ 新しい観光地を保存するAPI
app.post('/api/save-spot', upload.single('image'), async (req, res) => {
  let conn;

  try {
    conn = await pool.getConnection();

    const { title, genre, description, lat, lng, streetViewUrl } = req.body;
    const image = req.file;

    // 入力チェック
    if (!title || !description || !lat || !lng || !image) {
      return res.status(400).json({ success: false, error: '必須項目が不足しています' });
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({ success: false, error: '緯度経度が数値ではありません' });
    }

    const imagePath = `/image/${image.filename}`;

    const result = await conn.query(
      `INSERT INTO spots (title, genre, description, lat, lng, image_path, street_view_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, genre || null, description, latNum, lngNum, imagePath, streetViewUrl || null]
    );

    res.json({
      success: true,
      data: {
        spot_id: Number(result.insertId),
        title,
        genre,
        description,
        lat: latNum,
        lng: lngNum,
        imagePath,
        streetViewUrl
      }
    });

  } catch (err) {
    console.error('保存エラー:', err);
    res.status(500).json({ success: false, error: err.message || 'DB保存に失敗しました' });
  } finally {
    if (conn) conn.release();
  }
});
// これより上に authenticate を定義しておく必要があります

app.get('/api/has_location', authenticate, async (req, res) => {
  console.log("📍 /api/has_location called");

  const userId = req.user?.id;
  console.log("🔑 userId:", userId);

  if (!userId) {
    console.warn("⚠️ userId が undefined です。JWTの構造を確認してください。");
    return res.status(400).json({ error: 'User ID missing from token' });
  }

  try {
    const rows = await pool.query(
      'SELECT location_lat, location_lng FROM USERS WHERE id = ?',
      [userId]
    );

    console.log("📦 DB Query Raw Result:", rows);

    // ✅ MariaDBのドライバが1件のみ返す形式なら、rows自体がその1件になる
    const user = Array.isArray(rows) ? rows[0] : rows;
    console.log("🧍‍♂️ user:", user);

    if (!user || user.location_lat === undefined) {
      console.warn("⚠️ 該当ユーザーが見つかりません");
      return res.json({ hasLocation: false });
    }

    const hasLocation = user.location_lat !== null && user.location_lng !== null;

    return res.json({
      hasLocation,
      lat: user.location_lat,
      lng: user.location_lng
    });

  } catch (err) {
    console.error('❌ DBアクセスエラー (/api/has_location):', err);
    return res.status(500).json({ error: 'DB error' });
  }
});




app.post('/api/answer', async (req, res) => {
  const { user_id, spot_id, answer_lat, answer_lng, distance_km, score } = req.body;
  let conn;

  // バリデーション
  if (!user_id || !spot_id || answer_lat == null || answer_lng == null || distance_km == null || score == null) {
    return res.status(400).json({ success: false, error: 'すべての項目が必須です' });
  }

  try {
    conn = await pool.getConnection();

    await conn.query(`
      INSERT INTO user_answers (user_id, spot_id, answer_lat, answer_lng, distance_km, score)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, spot_id, answer_lat, answer_lng, distance_km, score]
    );

    res.json({ success: true });

  } catch (err) {
    console.error('[保存エラー]', err);
    res.status(500).json({ success: false, error: 'DB保存に失敗しました' });
  } finally {
    if (conn) conn.release();
  }
});

app.get('/api/history/:user_id', async (req, res) => {
  const userId = req.params.user_id;
  let conn;

  try {
    conn = await pool.getConnection();

    const rows = await conn.query(
      `SELECT 
          ua.score, ua.answered_at, 
          s.title, s.genre, s.description, 
          s.lat, s.lng, s.image_path
       FROM user_answers ua
       JOIN spots s ON ua.spot_id = s.spot_id
       WHERE ua.user_id = ?
       ORDER BY ua.answered_at DESC`,
      [userId]
    );

    res.json({ success: true, history: rows });
  } catch (err) {
    console.error('履歴取得エラー:', err);
    res.status(500).json({ success: false, error: '履歴取得に失敗しました' });
  } finally {
    if (conn) conn.release();
  }
});






app.get('/api/streetview-url', (req, res) => {
  const { lat, lng } = req.query;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!lat || !lng) {
    return res.status(400).json({ success: false, error: '緯度と経度が必要です。' });
  }

  const url = `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${lat},${lng}&heading=210&pitch=10&fov=80`;
  res.json({ success: true, url });
});

// ✅ Google Street View画像取得API
app.get('/api/streetview', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: '緯度(lat)と経度(lng)が必要です。' });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  const imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${lat},${lng}&heading=210&pitch=10&fov=80&key=${apiKey}`;

  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Google APIからの取得失敗: ${response.status}`);
    }

    const buffer = await response.buffer();
    res.set('Content-Type', 'image/jpeg');
    res.send(buffer);
  } catch (err) {
    console.error('[❌ StreetView ERROR]', err);
    res.status(500).json({ error: 'StreetView取得中にエラーが発生しました。' });
  }
});
// ✅ /api/directions?fromLat=...&fromLng=...&toLat=...&toLng=...
app.get('/api/directions', async (req, res) => {
  const { fromLat, fromLng, toLat, toLng } = req.query;
  const apiKey = process.env.GOOGLE_API_KEY;

  // 座標チェック
  if (![fromLat, fromLng, toLat, toLng].every(val => val !== undefined && !isNaN(val))) {
    return res.status(400).json({ success: false, error: '緯度・経度が不正です。' });
  }

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&mode=driving&key=${apiKey}`;

  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url);
    const data = await response.json();

    // APIレスポンスログ（開発用）
    console.log('[📦 Directions API status]:', data.status);
    if (data.status !== 'OK') {
      return res.status(502).json({
        success: false,
        error: 'Google Directions API からの応答が OK ではありません。',
        details: data.status,
        message: data.error_message || null,
      });
    }

    // デバッグ用にルート情報の概要を出力
    if (!data.routes || data.routes.length === 0) {
      return res.status(404).json({ success: false, error: 'ルートが見つかりません。' });
    }

    res.json({
      success: true,
      route: {
        summary: data.routes[0].summary,
        overview_polyline: data.routes[0].overview_polyline,
        legs: data.routes[0].legs,
      }
    });
  } catch (err) {
    console.error('[❌ Directions API ERROR]', err);
    res.status(500).json({ success: false, error: 'サーバー側でエラーが発生しました。' });
  }
});


app.get('/api/user_answers', authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    const rows = await db.query(
      'SELECT * FROM user_answers WHERE user_id = ? ORDER BY answered_at DESC',
      [userId]
    );
    res.json({ success: true, history: rows });  // ← 修正ポイント
  } catch (err) {
    console.error('DBエラー:', err);
    res.status(500).json({ success: false, error: 'DB error' });
  }
});
// ユーザーの住所を取得
app.get('/api/user_location', authenticate, async (req, res) => {
  try {
    const [row] = await db.query('SELECT location_lat, location_lng FROM USERS WHERE id = ?', [req.user.id]);
    res.json({ lat: row?.location_lat, lng: row?.location_lng });
  } catch (err) {
    console.error('住所取得エラー:', err);
    res.status(500).json({ error: '住所取得に失敗しました' });
  }
});

// ユーザーの住所を保存
app.post('/api/user_location', authenticate, async (req, res) => {
  const { lat, lng } = req.body;
  try {
    await db.query('UPDATE USERS SET location_lat = ?, location_lng = ? WHERE id = ?', [lat, lng, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('住所保存エラー:', err);
    res.status(500).json({ error: '住所保存に失敗しました' });
  }
});
app.delete('/api/user_location', authenticate, async (req, res) => {
  try {
    await db.query(
      'UPDATE users SET location_lat = NULL, location_lng = NULL WHERE id = ?',
      [req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('住所削除エラー:', err);
    res.status(500).json({ error: '住所削除に失敗しました' });
  }
});




// /api/spots: MariaDBのspotsテーブルから観光地を取得
app.get('/api/spots', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      'SELECT spot_id as id, title, genre, description, lat, lng, image_path FROM spots'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('観光地データ取得エラー:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'データベース読み込み失敗',
    });
  } finally {
    if (conn) conn.release();
  }
});

// ✅ エラー用HTMLページを返す関数
const renderErrorPage = (statusCode = 500) => `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>エラーが発生しました (${statusCode})</title>
  <link rel="stylesheet" href="/css/style.css">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>body { padding-top: 60px; }</style>
</head>
<body>
  <div id="navbar-placeholder"></div>
  <div class="auth-container">
    <h1>🚫 エラーが発生しました (${statusCode})</h1>
    <p class="description">お探しのページは存在しないか、現在利用できません。</p>
    <a href="/auth/login.html" class="button">ログイン画面に戻る</a>
  </div>
  <script src="/js/navbar.js"></script>
</body>
</html>
`;

// ⚠ 404ページ
app.use((req, res) => {
  res.status(404).send(renderErrorPage(404));
});

// ⚠ 500内部エラー
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send(renderErrorPage(500));
});

// 🚀 サーバー起動
app.listen(PORT, () => {
  console.log(`🌍 サーバー起動中: http://localhost:${PORT}`);
});
