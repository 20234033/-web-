
const express = require('express');
require('dotenv').config(); // これをファイルの最上部付近に追加
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');


const mariadb = require('mariadb');

// DB接続プール
const pool = mariadb.createPool({
  host: 'localhost',
  user: 'geoapp',
  password: 'Password',
  database: 'website',
  connectionLimit: 5
});


const app = express();
const PORT = process.env.PORT || 3000;

// 📁 パス定義
const publicPath = path.join(__dirname, '..', 'public');
const imageDir = path.join(publicPath, 'image');
const dataDir = path.join(publicPath, 'data');
const jsonFilePath = path.join(dataDir, 'sightseeing.json');

// 📁 ディレクトリ作成（存在しない場合）
if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(jsonFilePath)) fs.writeFileSync(jsonFilePath, '[]', 'utf-8');

// 🧰 ミドルウェア設定
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(publicPath));

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



app.post('/api/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'IDまたはメールアドレスとパスワードを入力してください。' });
  }

  try {
    const conn = await pool.getConnection();
    const rows = await conn.query(
      'SELECT * FROM USERS WHERE id = ? OR mail_address = ? LIMIT 1',
      [identifier, identifier]
    );
    conn.release();

    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'ログイン情報が正しくありません。' });
    }

    res.json({ message: 'ログイン成功', user: { id: user.id, avatar_url: user.avatar_url } });
  } catch (err) {
    console.error('[ログイン失敗]', err);
    res.status(500).json({ error: 'ログイン処理中にエラーが発生しました。' });
  }
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
    conn = await pool.getConnection(); // try内に移動

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

    const imagePath = `/uploads/${image.filename}`;

    const result = await conn.query(
      `INSERT INTO spots (title, genre, description, lat, lng, image_path, street_view_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, genre || null, description, latNum, lngNum, imagePath, streetViewUrl || null]
    );

    res.json({
      success: true,
      data: {
        id: Number(result.insertId),
        title, genre, description, lat: latNum, lng: lngNum,
        imagePath, streetViewUrl
      }
    });

  } catch (err) {
    console.error('保存エラー:', err);
    res.status(500).json({ success: false, error: err.message || 'DB保存に失敗しました' });
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

app.get('/api/spots', (req, res) => {
  const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
  const spots = JSON.parse(jsonData);
  res.json({ data: spots });
});


// ✅ 全観光地一覧取得API（オプション拡張用）
app.get('/api/spots', (req, res) => {
  try {
    const data = fs.readFileSync(jsonFilePath, 'utf-8');
    const spots = JSON.parse(data);
    res.json({ success: true, data: spots });
  } catch (err) {
    console.error('[❌ LOAD ERROR]', err);
    res.status(500).json({ error: '読み込みエラー' });
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
