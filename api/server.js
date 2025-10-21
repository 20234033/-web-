require('dotenv').config(); // .envを最上部で読み込む


const { JWT_SECRET } = require('./config/auth'); 

if (!JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET is empty');
  process.exit(1);
}

console.log('[BOOT] JWT_SECRET length =', String(JWT_SECRET).length);
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
const AWS = require('aws-sdk');
const { authenticate } = require('./middleware/authenticate.js'); // ← これがあること

const s3 = new AWS.S3({
  region: process.env.AWS_REGION
});

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'your-default-secret';

// ✅ DB接続プール（poolは後で使えるようにmodule.exportsしてもOK）
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: process.env.DB_CONNECTION_LIMIT || 5 
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
  origin: 'http://localhost:3000', // ← フロントのURLにする
  credentials: true                // ← これがないとCookieが送られない
}));

// ✅ APIルート読み込み（cookieParserの後に）
const meRoute = require('./me');
app.use('/api', meRoute);         // ← /api/me でアクセスできる

// 💡 必要であれば pool も他ファイルで使えるようにexport可能
module.exports = { app, pool, SECRET_KEY };

// ✅ ローカル保存用の multer.diskStorage 設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
  fs.mkdirSync(imageDir, { recursive: true });
  cb(null, imageDir); // ← ここを imageDir に統一
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

// 🖼 multer 設定（画像保存）
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

    const exists = await conn.query(
      'SELECT user_name FROM users WHERE user_name = ? OR mail_address = ?',
      [id, email]
    );
    if (exists.length > 0) {
      conn.release();
      return res.status(409).json({ error: '既に使用されているIDまたはメールアドレスです。' });
    }

    const uuid = crypto.randomUUID(); // ← 必須！
    const hash = await bcrypt.hash(password, 10);

    await conn.query(
      'INSERT INTO users (user_uuid, user_name, mail_address, password_hash) VALUES (?, ?, ?, ?)',
      [uuid, id, email, hash]
    );

    conn.release();
    res.json({ message: '登録が完了しました' });

  } catch (err) {
    console.error('[❌ 登録エラー]', err);
    res.status(500).json({ error: '登録中にエラーが発生しました。' });
  }
});






// me.js や /api/me の中
app.get('/api/me', authenticate, async (req, res) => {
  const userUuid = req.user?.user_uuid;

  if (!userUuid) {
    console.warn('[me] トークンペイロードに uuid が含まれていません');
    return res.status(401).json({ error: 'Invalid token payload' });
  }

  try {
    const rows = await pool.query(
      'SELECT user_uuid, user_name, mail_address, address_lat, address_lng FROM users WHERE user_uuid = ?',
      [userUuid]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'user not found' });
    }

    const user = rows[0];

    res.json({
      user_uuid: user.user_uuid,                    // ← 内部用ID
      user_name: user.user_name,                        // ← 表示名
      mail_address: user.mail_address,
      location_lat: user.location_lat,
      location_lng: user.location_lng
    });

  } catch (err) {
    console.error('[me取得失敗]', err);
    res.status(500).json({ error: 'Internal Server Error' });
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

    //ログイン処理
    const rows = await conn.query(
      'SELECT * FROM users WHERE user_name = ? OR mail_address = ? LIMIT 1',
      [identifier, identifier]
    );

    //結果が空かチェック
    if (!rows || rows.length === 0) {
      console.warn('[WARN] ユーザーが見つかりません:', identifier);
      return res.status(401).json({ error: 'ログイン情報が正しくありません。' });
    }

    const user = rows[0];

    //パスワード比較
    if (!user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'ログイン情報が正しくありません。' });
    }


    //JWTトークン生成
    const { JWT_SECRET } = require('./config/auth.js');
    const token = jwt.sign({ user_uuid: user.user_uuid }, JWT_SECRET, { expiresIn: '7d' });
    //Cookie にセット
    res.cookie('token', token, {
      httpOnly: true,
       secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'ログイン成功',
      user: {
        user_name: user.user_name,
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/api/update_account', authenticate, async (req, res) => {
  const userUuid = req.user?.user_uuid;
  if (!userUuid) {
    return res.status(401).send('認証情報が無効です（uuidなし）');
  }

  // 受け取り（任意の組み合わせOK）
  let { username, email, currentPassword, newPassword } = req.body || {};

  // フロントの undefined/null 対策
  if (typeof username !== 'string') username = '';
  if (typeof email !== 'string') email = '';
  if (typeof currentPassword !== 'string') currentPassword = '';
  if (typeof newPassword !== 'string') newPassword = '';

  // どれかを変えるときは currentPassword 必須（安全のため）
  const wantsChangeUsername = username.trim().length > 0;
  const wantsChangeEmail = email.trim().length > 0;
  const wantsChangePassword = newPassword.trim().length > 0;

  if (!wantsChangeUsername && !wantsChangeEmail && !wantsChangePassword) {
    return res.status(400).send('変更項目がありません');
  }
  if (!currentPassword) {
    return res.status(400).send('現在のパスワードを入力してください');
  }

  // 前処理
  const normalizedEmail = wantsChangeEmail ? email.trim().toLowerCase() : null;
  const newId = wantsChangeUsername ? username.trim() : null;

  // 軽いバリデーション（必要なら強化）
  if (wantsChangeEmail && !EMAIL_REGEX.test(normalizedEmail)) {
    return res.status(400).send('メールアドレスの形式が不正です');
  }
  if (wantsChangeUsername && newId.length < 3) {
    return res.status(400).send('IDは3文字以上にしてください');
  }
  if (wantsChangePassword && newPassword.length < 8) {
    return res.status(400).send('パスワードは8文字以上にしてください');
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // 現在ユーザーの取得（uuidで）
    const rows = await conn.query('SELECT * FROM users WHERE user_uuid = ? LIMIT 1', [userUuid]);
    if (!rows || rows.length === 0) {
      return res.status(404).send('ユーザーが見つかりません');
    }
    const user = rows[0];

    // 現在パスワードの検証
    const ok = user.password_hash && await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) {
      return res.status(403).send('現在のパスワードが正しくありません');
    }

    // 重複チェック（必要なときのみ）
    if (wantsChangeUsername) {
      const dupeId = await conn.query('SELECT user_uuid FROM users WHERE user_name = ? AND user_uuid != ? LIMIT 1', [newId, userUuid]);
      if (dupeId.length > 0) return res.status(409).send('そのIDは既に使用されています');
    }
    if (wantsChangeEmail) {
      const dupeMail = await conn.query('SELECT user_uuid FROM users WHERE mail_address = ? AND user_uuid != ? LIMIT 1', [normalizedEmail, userUuid]);
      if (dupeMail.length > 0) return res.status(409).send('そのメールアドレスは既に使用されています');
    }

    // 更新フィールドを組み立て
    const updates = [];
    const values = [];

    if (wantsChangeUsername) {
      updates.push('user_name = ?');
      values.push(newId);
    }
    if (wantsChangeEmail) {
      updates.push('mail_address = ?');
      values.push(normalizedEmail);
    }
    if (wantsChangePassword) {
      const hashed = await bcrypt.hash(newPassword, 10);
      updates.push('password_hash = ?');
      values.push(hashed);
    }

    if (updates.length === 0) {
      return res.status(400).send('変更項目がありません');
    }

    values.push(userUuid);

    // アップデート実行
    await conn.query(`UPDATE users SET ${updates.join(', ')} WHERE user_uuid = ?`, values);

    // 更新後のレコードを取得
    const after = await conn.query(
      'SELECT user_uuid, user_name, mail_address, address_lat, address_lng, created_at FROM users WHERE user_uuid = ? LIMIT 1',
      [userUuid]
    );
    const updated = after[0];

    // JWTを再発行（常に uuid をペイロードに保持）
    const cookieSecure = process.env.NODE_ENV === 'production';
      const { JWT_SECRET } = require('./config/auth.js');
      const token = jwt.sign({ user_uuid: userUuid }, JWT_SECRET, { expiresIn: '7d' });    res.cookie('token', token, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSecure ? 'None' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // 正常レスポンス
    return res.json({
      success: true,
      message: 'アカウント情報を更新しました',
      user: {
        user_uuid: updated.user_uuid,
        user_name: updated.user_name,
        mail_address: updated.mail_address,
        address_lat: updated.address_lat,
        address_lng: updated.address_lng,
        created_at: updated.created_at
      }
    });

  } catch (err) {
    console.error('[update_account error]', err);

    // MariaDB: 重複キー（ユニーク制約）に引っかかった場合の保険
    if (err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062)) {
      return res.status(409).send('IDまたはメールアドレスが既に使用されています');
    }

    return res.status(500).send('更新に失敗しました');
  } finally {
    if (conn) conn.release();
  }
});

app.post('/api/reset-password', (req, res) => {
  const { identifier } = req.body;
  console.log(`[RESET] Identifier: ${identifier}`);
  res.json({ message: 'パスワードリセットリンクを送信しました（仮）' });
});

app.post('/api/force-logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  });
  res.json({ ok: true });
});

// ✅ 新しい観光地を保存するAPI
app.post('/api/save-spot', authenticate, upload.single('image'), async (req, res) => {
  let conn;
  const userUuid = req.user?.user_uuid;

  if (!userUuid) {
  console.warn("⚠️ userUuid が undefined です。JWTの構造を確認してください。");
  return res.status(400).json({ error: 'User UUID missing from token' });

  }
  try {
    conn = await pool.getConnection();

    const { title, genre, description, lat, lng, streetViewUrl } = req.body;
    const file = req.file;

    // ✅ 入力チェック
    if (!title || !description || !lat || !lng || !file) {
      return res.status(400).json({ success: false, error: '必須項目が不足しています' });
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({ success: false, error: '緯度経度が数値ではありません' });
    }

    // ✅ ローカルのパスを生成
    const relativePath = `image/${file.filename}`;
    const imageUrl = `/image/${file.filename}`; // フロントエンドで使うパス

    // ✅ DB保存
    const result = await conn.query(
      `INSERT INTO spots (title, genre, description, latitude, longitude, image_path, street_view_url, user_uuid)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, genre || null, description, latNum, lngNum, relativePath, streetViewUrl, userUuid || null]
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
        imagePath: imageUrl,
        streetViewUrl,
        userUuid: userUuid
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

  const userUuid = req.user?.user_uuid;
  console.log("🔑 userUuid:", userUuid);

  if (!userUuid) {
    console.warn("⚠️ userUuid が undefined です。JWTの構造を確認してください。");
    return res.status(400).json({ error: 'User UUID missing from token' });
  }

  try {
    const rows = await pool.query(
      'SELECT address_lat, address_lng FROM users WHERE user_uuid = ?',
      [userUuid]
    );

    console.log("📦 DB Query Raw Result:", rows);

    const user = Array.isArray(rows) ? rows[0] : rows;
    console.log("🧍‍♂️ user:", user);

    if (!user || user.address_lat === undefined || user.address_lng === undefined) {
      console.warn("⚠️ 該当ユーザーが見つかりません、または住所未設定");
      return res.json({ hasLocation: false });
    }

    const hasLocation = user.address_lat !== null && user.address_lng !== null;

    return res.json({
      hasLocation,
      lat: user.address_lat,
      lng: user.address_lng
    });

  } catch (err) {
    console.error('❌ DBアクセスエラー (/api/has_location):', err);
    return res.status(500).json({ error: 'DB error' });
  }
});





app.post('/api/answer', authenticate, async (req, res) => {
  const { spot_id, answer_lat, answer_lng, distance_km, score } = req.body;
  let conn;

  // 🔍 バリデーション
  if (
    spot_id == null ||
    answer_lat == null ||
    answer_lng == null ||
    distance_km == null ||
    score == null
  ) {
    return res.status(400).json({ success: false, error: 'すべての項目が必須です' });
  }

  // 数値としてパースして不正入力を防止（任意）
  const parsedLat = parseFloat(answer_lat);
  const parsedLng = parseFloat(answer_lng);
  const parsedDist = parseFloat(distance_km);
  const parsedScore = parseInt(score);

  if (
    isNaN(parsedLat) ||
    isNaN(parsedLng) ||
    isNaN(parsedDist) ||
    isNaN(parsedScore)
  ) {
    return res.status(400).json({ success: false, error: '数値項目の形式が不正です' });
  }

  try {
    conn = await pool.getConnection();
    const userUuid = req.user.user_uuid;

    await conn.query(`
      INSERT INTO user_answers 
        (user_uuid, spot_id, answer_lat, answer_lng, distance_km, score)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [userUuid, spot_id, parsedLat, parsedLng, parsedDist, parsedScore]
    );

    res.json({ success: true });

  } catch (err) {
    console.error('[保存エラー]', err);
    res.status(500).json({ success: false, error: 'DB保存に失敗しました' });
  } finally {
    if (conn) conn?.release();
  }
});



app.get('/api/history/:user_id', async (req, res) => {
  const userUuid = req.params.user_uuid;
  let conn;

  try {
    conn = await pool.getConnection();

const rows = await conn.query(
  `SELECT 
      ua.spot_id AS spot_id,  -- 明示的に spot_id を返す
      ua.score, 
      ua.answered_at, 
      s.title, 
      s.genre, 
      s.description, 
      s.latitude AS lat, 
      s.longitude AS lng, 
      s.image_path
   FROM user_answers ua
   JOIN spots s ON ua.spot_id = s.spot_id
   WHERE ua.user_uuid = ?
   ORDER BY ua.answered_at DESC`,
  [userUuid]
);


    const BASE_URL = `${req.protocol}://${req.get('host')}/`;

    const processedRows = rows.map(row => ({
      ...row,
      image_path: row.image_path
        ? BASE_URL + row.image_path.replace(/^\/?/, '')
        : null
    }));

    res.json({ success: true, history: processedRows });

  } catch (err) {
    console.error('履歴取得エラー:', err);
    res.status(500).json({ success: false, error: '履歴取得に失敗しました' });
  } finally {
    if (conn) conn.release();
  }
});
app.get('/api/history/:uuid', async (req, res) => {
  const userUuid = req.params.user_uuid;
  if (!userUuid) {
    return res.status(401).json({ error: '認証情報が無効です。(undefined)' });
  }
  let conn;

  // UUIDの形式チェック
  if (!userUuid || typeof userUuid !== 'string' || userUuid.length !== 36) {
    return res.status(400).json({ success: false, error: 'UUIDが無効です' });
  }

  try {
    conn = await pool.getConnection();

    // 回答履歴とスポット情報を結合して取得
    const rows = await conn.query(
      `SELECT 
          ua.spot_id,         -- ✅ 必要（home.jsで使う）
          ua.score, 
          ua.answered_at, 
          s.title, 
          s.genre, 
          s.description, 
          s.latitude AS lat, 
          s.longitude AS lng, 
          s.image_path
       FROM user_answers ua
       JOIN spots s ON ua.spot_id = s.spot_id
       WHERE ua.user_uuid = ?
       ORDER BY ua.answered_at DESC`,
      [userUuid]
    );

    const BASE_URL = `${req.protocol}://${req.get('host')}/`;

    // image_path をURLに整形
    const history = rows.map(row => ({
      ...row,
      image_path: row.image_path
        ? BASE_URL + row.image_path.replace(/^\/?/, '') // `/images/foo.jpg` → `http://host/images/foo.jpg`
        : null
    }));

    res.json({ success: true, history });

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

// ✅ /api/geocode?address=〇〇
app.get('/api/geocode', async (req, res) => {
  const { address } = req.query;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!address) {
    return res.status(400).json({ success: false, error: '住所を指定してください。' });
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return res.status(404).json({ success: false, error: '住所が見つかりませんでした。' });
    }

    const { lat, lng } = data.results[0].geometry.location;
    res.json({ success: true, lat, lng });
  } catch (err) {
    console.error('[❌ Geocode ERROR]', err);
    res.status(500).json({ success: false, error: 'ジオコーディングに失敗しました。' });
  }
});


app.get('/api/user_answers', authenticate, async (req, res) => {
  const userUuid = req.user.user_uuid;

  try {
    const rows = await db.query(
      'SELECT * FROM user_answers WHERE user_uuid = ? ORDER BY answered_at DESC',
      [userUuid]
    );
    res.json({ success: true, history: rows });  // ← 修正ポイント
  } catch (err) {
    console.error('DBエラー:', err);
    res.status(500).json({ success: false, error: 'DB error' });
  }
});
// ユーザーの住所を取得
app.get('/api/user_location', authenticate, async (req, res) => {
  const userUuid = req.user.user_uuid;
  try {
    const [row] = await db.query('SELECT address_lat, address_lng FROM users WHERE user_uuid = ?', [userUuid]);
    res.json({ lat: row?.address_lat, lng: row?.address_lng });
  } catch (err) {
    console.error('住所取得エラー:', err);
    res.status(500).json({ error: '住所取得に失敗しました' });
  }
});

// ユーザーの住所を保存
app.post('/api/user_location', authenticate, async (req, res) => {
  const userUuid = req.user.user_uuid;

  if (!userUuid) {
  return res.status(401).json({ error: '認証情報が無効です。(undefined)' });
  }

  const { lat, lng } = req.body;
  try {
    await db.query(
      'UPDATE users SET address_lat = ?, address_lng = ? WHERE user_uuid = ?',
      [lat, lng, userUuid]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('住所保存エラー:', err);
    res.status(500).json({ error: '住所保存に失敗しました' });
  }
});

//ユーザーの住所を削除
app.delete('/api/user_location', authenticate, async (req, res) => {
  const userUuid = req.user.user_uuid;

  if (!userUuid) {
  return res.status(401).json({ error: '認証情報が無効です。(undefined)' });
  }

  try {
    await db.query(
      'UPDATE users SET address_lat = NULL, address_lng = NULL WHERE user_uuid = ?',
      userUuid
    );
    res.json({ success: true });
  } catch (err) {
    console.error('住所削除エラー:', err);
    res.status(500).json({ error: '住所削除に失敗しました' });
  }
});


app.get('/api/score', (req, res) => {

    //文字列からfloat型へ変換
    const SelLat = parseFloat(req.query.SelLat);
    const SelLng = parseFloat(req.query.SelLng);
    const CorLat = parseFloat(req.query.CorLat);
    const CorLng = parseFloat(req.query.CorLng);
    if (isNaN(SelLat) || isNaN(SelLng) || isNaN(CorLat) || isNaN(CorLng)) {
        return res.status(400).json({ 
            success: false, 
            message: '緯度経度のパラメータが不正です。数値で指定してください。' 
        });
    }
    const R = 6371; 
    const toRad = deg => deg * (Math.PI / 180);
    const dLat = toRad(CorLat - SelLat);
    const dLng = toRad(CorLng - SelLng);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(SelLat)) * Math.cos(toRad(CorLat)) *
              Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    const score = Math.max(0, 100 - Math.round(distance));
    
    res.json({
      success:true,
      SelectedLat: SelLat,
      SelectedLng: SelLng,
      CorrectLat: CorLat,
      CorrectLng: CorLng,
      Distance: parseFloat(distance.toFixed(2)),//小数点以下２桁に丸める
      score: score
      });
  });




// /api/spots: MariaDBのspotsテーブルから観光地を取得
app.get('/api/spots', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();

    const rows = await conn.query(
      'SELECT spot_id as id, title, genre, description, latitude, longitude, image_path FROM spots'
    );

    // ✅ ローカルの image_path をフルURLに変換（例: http://localhost:3000/image/xxx.jpg）
    const BASE_URL = `${req.protocol}://${req.get('host')}/`;

    const processedRows = rows.map(row => ({
      ...row,
      image_path: row.image_path
        ? BASE_URL + row.image_path.replace(/^\/?/, '') // 先頭のスラッシュを除去
        : null
    }));

    res.json({ success: true, data: processedRows });

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
