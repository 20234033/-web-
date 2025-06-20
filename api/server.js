
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
  database: 'sightseeing',
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
app.post('/api/register', (req, res) => {
  const { id, email, password } = req.body;
  console.log(`[REGISTER] ID: ${id}, Email: ${email}, Password: ${password}`);
  res.json({ message: '登録が成功しました（仮）' });
});

app.post('/api/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'IDまたはメールアドレスとパスワードを入力してください。' });
  }

  try {
    const conn = await pool.getConnection();
    const rows = await conn.query(
      'SELECT * FROM users WHERE id = ? OR mail_address = ? LIMIT 1',
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
// ✅ 新しい観光地を保存するAPI
app.post('/api/save-spot', upload.single('image'), (req, res) => {
  try {
    const { title, genre, description, lat, lng } = req.body;
    if (!title || !description || !lat || !lng) {
      return res.status(400).json({ error: '必須フィールドが不足しています。' });
    }

    // JSON読み込み
    let spots = [];
    try {
      const raw = fs.readFileSync(jsonFilePath, 'utf-8');
      spots = JSON.parse(raw);
    } catch (e) {
      console.warn('⚠ JSON読み込み失敗 → 初期化', e);
    }

    // ID割り当て（既存の最大ID + 1）
    const maxId = spots.length > 0 ? Math.max(...spots.map(s => s.id || 0)) : 0;
    const newId = maxId + 1;

    const newSpot = {
      id: newId,
      title,
      genre: genre || '',
      description,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      image: req.file ? `/image/${req.file.filename}` : null,
      createdAt: new Date().toISOString()
    };

    spots.push(newSpot);
    fs.writeFileSync(jsonFilePath, JSON.stringify(spots, null, 2), 'utf-8');
    console.log(`[✅ SPOT追加] ID:${newId} - ${title}`);

    res.json({ success: true, data: newSpot });
  } catch (err) {
    console.error('[❌ SAVE ERROR]', err);
    res.status(500).json({ error: '保存中にエラーが発生しました。' });
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
