
const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const app = express();
app.use(cookieParser());
const meRoute = require('./me');






const mariadb = require('mariadb');
const cors = require('cors');

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

    const imagePath = `/image/${image.filename}`;

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

// /api/spots: MariaDBのspotsテーブルから観光地を取得
app.get('/api/spots', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      'SELECT spot_id AS id, title, genre, description, lat, lng FROM spots'
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

//回答を回答履歴テーブルへ保存するAPI
app.post('/api/submit-answers', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const { userId, spotId, answerLat, answerLng, distanceKm, score } = req.body;

    if (!userId || !spotId || !answerLat || !answerLng || distanceKm === undefined || score === undefined) {
      return res.status(400).json({
        success: false,
        message: '必要なパラメータ（userId, spotId, answerLat, answerLng, distanceKm, score）が不足しています。',
      });
    }

    const parsedSpotId = parseInt(spotId);
    const parsedAnswerLat = parseFloat(answerLat);
    const parsedAnswerLng = parseFloat(answerLng);
    const parsedDistanceKm = parseFloat(distanceKm);
    const parsedScore = parseInt(score);

    if (isNaN(parsedSpotId) || isNaN(parsedAnswerLat) || isNaN(parsedAnswerLng) || isNaN(parsedDistanceKm) || isNaN(parsedScore)) {
      return res.status(400).json({
        success: false,
        message: '1つ以上のパラメータのデータ型が不正です。spotId, answerLat, answerLng, distanceKm, score が数値であることを確認してください。',
      });
    }

    const result = await conn.query(
      `INSERT INTO user_answers (user_id, spot_id, answer_lat, answer_lng, distance_km, score)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, parsedSpotId, parsedAnswerLat, parsedAnswerLng, parsedDistanceKm, parsedScore]
    );

    res.json({
      success: true,
      message: '回答が正常に保存されました。',
      data: {
        userId: userId,
        spotId: parsedSpotId,
        answerLat: parsedAnswerLat,
        answerLng: parsedAnswerLng,
        distanceKm: parsedDistanceKm,
        score: parsedScore,
      },
    });
  } catch (err) {
    console.error('[回答提出エラー]', err);
    res.status(500).json({ success: false, message: '回答のデータベースへの保存に失敗しました。', error: err.message });
  } finally {
    if (conn) conn.release();
  }
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
