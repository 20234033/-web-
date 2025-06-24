
const express = require('express');
require('dotenv').config(); // これをファイルの最上部付近に追加
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');

const port = 3000; // APIサーバーが稼働するポート番号

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

app.post('/api/login', (req, res) => {
  const { identifier, password } = req.body;
  console.log(`[LOGIN] Identifier: ${identifier}, Password: ${password}`);
  res.json({ message: 'ログイン成功（仮）' });
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

//URL設定
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


// 全観光地一覧取得API（オプション拡張用）
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


//スコア計算API
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











// エラー用HTMLページを返す関数
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
