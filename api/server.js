const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); // ルート固定




const { JWT_SECRET } = require('./config/auth'); 

if (!JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET is empty');
  process.exit(1);
}


console.log('[BOOT] JWT_SECRET length =', String(JWT_SECRET).length);
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const mariadb = require('mariadb');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const AWS = require('aws-sdk');
const { authenticate } = require('./middleware/authenticate.js'); // ← これがあること
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");


const s3 = new AWS.S3({
  region: process.env.AWS_REGION
});
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

const sentFrom = new Sender(
  process.env.VERIFY_FROM_EMAIL,      // 例: "no-reply@xxxxx"
  process.env.VERIFY_FROM_NAME || "旅行先提案Webシステム"
);

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'your-default-secret';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAI = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}
const MODEL_CANDIDATES = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b'
];

const pool = require('./db'); 
const db = pool;

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
app.set('trust proxy', 1);
app.use(cookieParser()); // JWT読み取り用
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(publicPath, { extensions: ['html'] }));
app.use('/image', express.static(path.join(__dirname, '..', 'public', 'image')));

app.use(cors({
  origin: ['http://localhost:3000', 'http://ec2-54-150-237-229.ap-northeast-1.compute.amazonaws.com'],
  credentials: true,
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



async function sendLoginNotificationEmail(toEmail, userId) {
  if (!toEmail) {
    console.warn('[MAIL] 宛先メールアドレスが空です。スキップします。');
    return;
  }

  const recipients = [new Recipient(toEmail, userId || toEmail)];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject("ログイン通知 - 旅行先提案Webシステム")
    .setHtml(`
      <p>ユーザーID: <b>${userId || '(不明)'}</b> でログインが行われました。</p>
      <p>このメールはシステムのテスト用に送信されています。</p>
      <p>もし心当たりがない場合は、パスワードの変更をご検討ください。</p>
    `)
    .setText(
      [
        `ユーザーID: ${userId || '(不明)'} でログインが行われました。`,
        '',
        'このメールはシステムのテスト用に送信されています。',
        'もし心当たりがない場合は、パスワードの変更をご検討ください。'
      ].join('\n')
    );

  console.log('[MAIL] ログイン通知メール送信開始 →', toEmail);

  await mailerSend.email.send(emailParams);

  console.log('[MAIL] ログイン通知メール送信完了 →', toEmail);
}




async function listGeminiModels() {
  const fetch = (await import('node-fetch')).default;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`);
  return r.json();
}
async function callGeminiGenerate(model, prompt) {
  const fetch = (await import('node-fetch')).default;
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const body = {
    generationConfig: {
      temperature: 1.0,     // 多様性アップ（0.7〜1.2くらいで調整）
      topP: 0.95,
      topK: 40,
      // maxOutputTokens: 256, // 必要なら制限
      // candidateCount: 1
    },
    contents: [
      { role: 'user', parts: [{ text: prompt }] }
    ]
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text().catch(()=> '');
    const e = new Error(`Gemini ${model} ${res.status} ${res.statusText}: ${errText}`);
    e.status = res.status;
    throw e;
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text.trim();
}

async function generateWithGeminiFallback(prompt) {
  let lastError;
  for (const m of MODEL_CANDIDATES) {
    try {
      return await callGeminiGenerate(m, prompt);
    } catch (e) {
      // 404/400 はモデル非対応のことが多い→次の候補へ
      if (e.status !== 404 && e.status !== 400) lastError = e;
      continue;
    }
  }
  throw lastError || new Error('No Gemini model worked');
}
// 住所ヒントが未実装ならこれも追加（既に同名関数があれば不要）
async function reverseGeocode(lat, lng) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  const fetch = (await import('node-fetch')).default;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=ja&key=${apiKey}`;
  const r = await fetch(url);
  const json = await r.json();
  if (json.status !== 'OK' || !json.results?.length) return null;
  return {
    formatted: json.results[0].formatted_address,
    components: json.results[0].address_components || []
  };
}

app.get("/verify-email", async (req, res) => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    return res.status(400).send("不正なリクエストです。");
  }

  try {
    const now = new Date();

    const [rows] = await db.query(
      `SELECT id, email_verify_expires_at
       FROM users
       WHERE email_verify_token = ? AND email_verified = 0`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).send("トークンが無効か、すでに認証済みです。");
    }

    const user = rows[0];

    if (user.email_verify_expires_at && user.email_verify_expires_at < now) {
      return res.status(400).send("トークンの有効期限が切れています。");
    }

    await db.query(
      `UPDATE users
       SET email_verified = 1,
           email_verify_token = NULL,
           email_verify_expires_at = NULL
       WHERE id = ?`,
      [user.id]
    );

    // 🔥 認証完了したら certification.html に飛ばす！
    return res.redirect("/auth/certification.html");

  } catch (err) {
    console.error("verify-email error:", err);
    return res.status(500).send("サーバーエラーが発生しました。");
  }
});






// 🔐 初期リダイレクト（例：ログインページ）
app.get('/', (req, res) => {
  res.redirect('/auth/login.html');
});

// 🔐 認証API（仮）
// 🔐 ユーザー登録（メール認証つき）
app.post('/api/register', async (req, res) => {
  const { id, email, password } = req.body;

  if (!id || !email || !password) {
    return res.status(400).json({ error: '全ての項目を入力してください。' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // 重複チェック
    const exists = await conn.query(
      'SELECT uuid FROM USERS WHERE id = ? OR mail_address = ? LIMIT 1',
      [id, email]
    );
    if (exists.length > 0) {
      return res.status(409).json({ error: '既に使用されているIDまたはメールアドレスです。' });
    }

    const uuid = crypto.randomUUID();
    const hash = await bcrypt.hash(password, 10);

    // 認証用トークンと有効期限（60分）
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await conn.query(
      `INSERT INTO USERS (
          uuid, id, mail_address, password_hash,
          email_verified, email_verify_token, email_verify_expires_at
        ) VALUES (?, ?, ?, ?, 0, ?, ?)`,
      [uuid, id, email, hash, verifyToken, expiresAt]
    );

    // 確認メール送信（失敗しても登録は残す or ロールバックするかはお好み）
    try {
      await sendSignupVerificationEmail(email, id, verifyToken);
    } catch (mailErr) {
      console.error('[MAIL] signup verify send error:', mailErr);
      // 必要ならここで return して「メール送信に失敗しました」と返す
    }

    res.json({
      message: '仮登録が完了しました。メールに記載されたリンクからメールアドレスを確認してください。'
    });

  } catch (err) {
    console.error('[❌ /api/register error]', err);
    res.status(500).json({ error: '登録中にエラーが発生しました。' });
  } finally {
    if (conn) conn?.release();
  }
});

// me.js や /api/me の中
app.post('/api/login', async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res
      .status(400)
      .json({ error: 'IDまたはメールアドレスとパスワードを入力してください。' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // ユーザー検索（ID or メールアドレス）
    const rows = await conn.query(
      'SELECT * FROM USERS WHERE id = ? OR mail_address = ? LIMIT 1',
      [identifier, identifier]
    );

    if (!rows || rows.length === 0) {
      console.warn('[WARN] ユーザーが見つかりません:', identifier);
      return res
        .status(401)
        .json({ error: 'ログイン情報が正しくありません。' });
    }

    const user = rows[0];

    // ✅ メール未認証ならログインさせない
    if (user.email_verified === 0) {
      return res.status(403).json({
        error:
          'メールアドレスの認証が完了していません。メールに記載されたリンクを開いて認証を完了してください。',
        needsVerification: true,
      });
    }

    // ✅ パスワードチェック
    const ok =
      user.password_hash && (await bcrypt.compare(password, user.password_hash));
    if (!ok) {
      return res
        .status(401)
        .json({ error: 'ログイン情報が正しくありません。' });
    }

    // 🔔 ログイン通知メール（失敗してもログインは成功扱い）
    try {
      await sendLoginNotificationEmail(user.mail_address, user.id);
    } catch (mailErr) {
      console.error('[MAIL] ログイン通知メール送信エラー:', mailErr);
    }

    // ✅ JWT発行
    const { JWT_SECRET } = require('./config/auth.js');
    const token = jwt.sign({ uuid: user.uuid }, JWT_SECRET, { expiresIn: '7d' });

    // ✅ Cookie 設定
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,        // 本番HTTPSなら true
      sameSite: 'Lax',      // 同一オリジン前提
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // ✅ レスポンス
    res.json({
      message: 'ログイン成功',
      user: {
        id: user.id,
        avatar_url: user.avatar_url || null,
      },
    });
  } catch (err) {
    console.error('[ログイン失敗]', err);
    res
      .status(500)
      .json({ error: 'ログイン処理中にエラーが発生しました。' });
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

// メールアドレス確認
app.get('/api/email/verify', async (req, res) => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).send('不正なリクエストです。');
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const now = new Date();

    const rows = await conn.query(
      `SELECT uuid, email_verify_expires_at
         FROM USERS
        WHERE email_verify_token = ?
          AND email_verified = 0
        LIMIT 1`,
      [token]
    );

    if (!rows || rows.length === 0) {
      return res.status(400).send('トークンが無効か、すでに認証済みです。');
    }

    const user = rows[0];

    if (user.email_verify_expires_at && user.email_verify_expires_at < now) {
      return res.status(400).send('トークンの有効期限が切れています。');
    }

    await conn.query(
      `UPDATE USERS
          SET email_verified = 1,
              email_verify_token = NULL,
              email_verify_expires_at = NULL
        WHERE uuid = ?`,
      [user.uuid]
    );

    // 成功したらログイン画面へ
    const baseUrl = process.env.APP_BASE_URL || 'http://ec2-54-150-237-229.ap-northeast-1.compute.amazonaws.com/';
    return res.redirect(`${baseUrl}/auth/login.html?verified=1`);

  } catch (err) {
    console.error('[verify email error]', err);
    return res.status(500).send('サーバーエラーが発生しました。');
  } finally {
    if (conn) conn?.release();
  }
});


const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/api/update_account', authenticate, async (req, res) => {
  const userUuid = req.user?.uuid;
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
    const rows = await conn.query('SELECT * FROM USERS WHERE uuid = ? LIMIT 1', [userUuid]);
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
      const dupeId = await conn.query('SELECT uuid FROM USERS WHERE id = ? AND uuid <> ? LIMIT 1', [newId, userUuid]);
      if (dupeId.length > 0) return res.status(409).send('そのIDは既に使用されています');
    }
    if (wantsChangeEmail) {
      const dupeMail = await conn.query('SELECT uuid FROM USERS WHERE mail_address = ? AND uuid <> ? LIMIT 1', [normalizedEmail, userUuid]);
      if (dupeMail.length > 0) return res.status(409).send('そのメールアドレスは既に使用されています');
    }

    // 更新フィールドを組み立て
    const updates = [];
    const values = [];

    if (wantsChangeUsername) {
      updates.push('id = ?');
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
    await conn.query(`UPDATE USERS SET ${updates.join(', ')} WHERE uuid = ?`, values);

    // 更新後のレコードを取得
    const after = await conn.query(
      'SELECT uuid, id, mail_address, avatar_url, location_lat, location_lng, created_at FROM USERS WHERE uuid = ? LIMIT 1',
      [userUuid]
    );
    const updated = after[0];

    // JWTを再発行（常に uuid をペイロードに保持）
    const cookieSecure = process.env.NODE_ENV === 'production';
      const { JWT_SECRET } = require('./config/auth.js');
      const token = jwt.sign({ uuid: userUuid }, JWT_SECRET, { expiresIn: '7d' });    res.cookie('token', token, {
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
        uuid: updated.uuid,
        id: updated.id,
        email: updated.mail_address,
        avatar_url: updated.avatar_url,
        location_lat: updated.location_lat,
        location_lng: updated.location_lng,
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

// ③ パスワードリセット用コード発行
app.post('/api/password/forgot', async (req, res) => {
  const { identifier } = req.body || {};

  if (!identifier) {
    return res.status(400).json({ error: 'ユーザーIDまたはメールアドレスを入力してください。' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // メールかIDか簡易判定
    const isEmail = identifier.includes('@');

    const users = await conn.query(
      isEmail
        ? 'SELECT uuid, id, mail_address FROM USERS WHERE mail_address = ? LIMIT 1'
        : 'SELECT uuid, id, mail_address FROM USERS WHERE id = ? LIMIT 1',
      [identifier]
    );

    // 存在しない場合も「送信しました」と返す（存在有無をバラさないため）
    if (!users || users.length === 0) {
      conn.release();
      return res.json({
        ok: true,
        message: 'パスワード再設定用のメールを送信しました。（存在しない場合もこのメッセージです）'
      });
    }

    const user = users[0];

    // 6桁コード + 内部トークン
    const code = generate6DigitCode();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分

    await conn.query(
      `INSERT INTO EMAIL_VERIFICATION_CODES
         (token, email, user_id, code, purpose, expires_at)
       VALUES (?, ?, ?, ?, 'reset_password', ?)`,
      [token, user.mail_address, user.id, code, expiresAt]
    );

    conn.release();

    // メール送信
    try {
      await sendVerificationCodeEmail(user.mail_address, code, 'reset_password');
    } catch (mailErr) {
      console.error('[MAIL] パスワードリセット確認コード送信エラー:', mailErr);
    }

    return res.json({
      ok: true,
      pending_token: token,
      message: 'パスワード再設定用の確認コードをメールで送信しました。'
    });

  } catch (err) {
    if (conn) conn.release();
    console.error('[password/forgot error]', err);
    return res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
});

// ④ パスワードリセット実行
app.post('/api/password/reset', async (req, res) => {
  const { pending_token, code, newPassword } = req.body || {};

  if (!pending_token || !code || !newPassword) {
    return res.status(400).json({ error: 'トークン・確認コード・新しいパスワードが必要です。' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'パスワードは8文字以上にしてください。' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    const rows = await conn.query(
      `SELECT * FROM EMAIL_VERIFICATION_CODES
       WHERE token = ? AND purpose = 'reset_password' AND used = 0
       LIMIT 1`,
      [pending_token]
    );

    if (!rows || rows.length === 0) {
      conn.release();
      return res.status(400).json({ error: '無効なトークンです。最初からやり直してください。' });
    }

    const ver = rows[0];
    const now = new Date();

    if (ver.expires_at && ver.expires_at < now) {
      conn.release();
      return res.status(400).json({ error: '確認コードの有効期限が切れています。' });
    }

    if (ver.code !== String(code).trim()) {
      conn.release();
      return res.status(400).json({ error: '確認コードが一致しません。' });
    }

    // ユーザー検索（メールで）
    const users = await conn.query(
      'SELECT uuid FROM USERS WHERE mail_address = ? LIMIT 1',
      [ver.email]
    );
    if (!users || users.length === 0) {
      conn.release();
      return res.status(400).json({ error: '対象ユーザーが見つかりません。' });
    }

    const user = users[0];
    const newHash = await bcrypt.hash(newPassword, 10);

    // パスワード更新
    await conn.query(
      'UPDATE USERS SET password_hash = ? WHERE uuid = ?',
      [newHash, user.uuid]
    );

    // このコードを使用済みに
    await conn.query(
      'UPDATE EMAIL_VERIFICATION_CODES SET used = 1 WHERE token = ?',
      [pending_token]
    );

    conn.release();

    return res.json({
      ok: true,
      message: 'パスワードを更新しました。新しいパスワードでログインしてください。'
    });

  } catch (err) {
    if (conn) conn.release();
    console.error('[password/reset error]', err);
    return res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
});



app.post('/api/force-logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: false,         // ← HTTPのみなので必ず false
    sameSite: 'Lax',       // ← 同一オリジン運用（クロスサイト不可）
  });
  res.json({ ok: true });
});

// ✅ 新しい観光地を保存するAPI
app.post('/api/save-spot', upload.single('image'), async (req, res) => {
  let conn;

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
      `INSERT INTO spots (title, genre, description, lat, lng, image_path, street_view_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, genre || null, description, latNum, lngNum, relativePath, streetViewUrl || null]
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

  const userUuid = req.user?.uuid;
  console.log("🔑 userUuid:", userUuid);

  if (!userUuid) {
    console.warn("⚠️ userUuid が undefined です。JWTの構造を確認してください。");
    return res.status(400).json({ error: 'User UUID missing from token' });
  }

  try {
    const rows = await pool.query(
      'SELECT location_lat, location_lng FROM USERS WHERE uuid = ?',
      [userUuid]
    );

    console.log("📦 DB Query Raw Result:", rows);

    const user = rows && rows.length ? rows[0] : null;
    console.log("🧍‍♂️ user:", user);

    if (!user || user.location_lat === undefined || user.location_lng === undefined) {
      console.warn("⚠️ 該当ユーザーが見つかりません、または住所未設定");
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
    const userUuid = req.user.uuid;

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

app.get('/api/history/:uuid', async (req, res) => {
  const userUuid = req.params.uuid;
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
          s.lat, 
          s.lng, 
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
app.get("/api/directions", async (req, res) => {
  try {
    const { fromLat, fromLng, toLat, toLng, mode = "driving" } = req.query;
    if ([fromLat, fromLng, toLat, toLng].some(v => v === undefined)) {
      return res.status(400).json({ success: false, message: "missing params" });
    }

    // OSRM (無料) — polyline(=5桁精度) を取得
    const url = `https://router.project-osrm.org/route/v1/${mode}/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=polyline&alternatives=false&steps=true`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`OSRM ${r.status}`);
    const json = await r.json();

    if (!json.routes?.length) {
      return res.json({ success: false, message: "no route" });
    }

    const route = json.routes[0];
    const leg = route.legs?.[0];

    return res.json({
      success: true,
      route: {
        overview_polyline: { points: route.geometry }, // ←フロントのdecodePolylineで展開可
        distance: route.distance,        // meters
        duration: route.duration,        // seconds
        steps: (leg?.steps || []).map(s => ({
          name: s.name,
          distance: s.distance,
          duration: s.duration,
          maneuver: s.maneuver?.instruction || s.maneuver?.type || ""
        }))
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "directions failed" });
  }
});

// ※ 404/500 ハンドラより前に配置

app.post('/api/ai/spot-suggestion', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ success: false, error: 'GEMINI_API_KEY が未設定です' });
    }

    const { title, lat, lng } = req.body || {};
    const t = typeof title === 'string' ? title.trim() : '';
    if (!t) {
      return res.status(400).json({ success: false, error: 'title を指定してください' });
    }

    // lat/lng は任意（あれば補助的にヒントに使う）
    let latN = Number.isFinite(parseFloat(lat)) ? parseFloat(lat) : null;
    let lngN = Number.isFinite(parseFloat(lng)) ? parseFloat(lng) : null;

    // 住所ヒント（任意）
    let addressHint = 'なし', componentsHint = '';
    if (latN != null && lngN != null) {
      try {
        const geo = await reverseGeocode(latN, lngN);
        if (geo?.formatted) addressHint = geo.formatted;
        if (geo?.components?.length) {
          componentsHint = geo.components.map(c => `${c.long_name}(${c.types.join('/')})`).join(', ');
        }
      } catch {}
    }

    const prompt = `
あなたは日本の旅行ガイド編集者です。与えられた「観光地タイトル」から、
1) ジャンル（厳密に: "historic" | "nature" | "city" | "culture" のどれか）
2) その場所の説明（日本語 80〜140文字）
をJSONだけで返してください。

# 入力
- title: ${t}
- lat: ${latN ?? '不明'}
- lng: ${lngN ?? '不明'}
- address_hint: ${addressHint}
- components_hint: ${componentsHint}
- request_nonce: ${Date.now()}-${Math.random().toString(36).slice(2,8)}

# ルール
- 出力は **JSONのみ**（前後の文章・マークダウン・コードブロックは禁止）
- title は入力をベースに適宜整形してOK（誤記訂正や一般的表記への統一）
- genre は ["historic","nature","city","culture"] のいずれかに必ず合わせる
- description は日本語で、具体的な魅力・歴史・立地などを簡潔に

# 出力フォーマット
{"title":"...","genre":"...","description":"..."}
    `.trim();

    const raw = await generateWithGeminiFallback(prompt);

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return res.status(502).json({ success: false, error: 'AI応答の解析に失敗しました', raw });
    }

    let data;
    try { data = JSON.parse(match[0]); }
    catch { return res.status(502).json({ success: false, error: 'JSONパース失敗', raw }); }

    // ジャンル正規化（万一ズレた場合の保険）
    const allowed = ['historic','nature','city','culture'];
    if (!allowed.includes(data.genre)) {
      const blob = `${t}${data.title || ''}${data.description || ''}`;
      if (/城|寺|神社|史|遺産|城郭|古都|寺院/.test(blob)) data.genre = 'historic';
      else if (/公園|山|川|湖|海|自然|滝|渓谷|高原|岬|砂丘|温泉/.test(blob)) data.genre = 'nature';
      else if (/都|市|駅|繁華|タワー|スカイ|街|展望|商店街|みなと|ウォーターフロント/.test(blob)) data.genre = 'city';
      else data.genre = 'culture';
    }

    // 説明の長さを軽く調整（80〜140目安）
    const desc = (data.description || '').trim();
    const trimmed = desc.length > 160 ? desc.slice(0, 160) + '…' : desc;

    return res.json({
      success: true,
      suggestion: {
        title: data.title || t,
        genre: data.genre,
        description: trimmed || '説明準備中'
      }
    });

  } catch (err) {
    console.error('[AI suggestion error REST]', err);

    // フォールバック（AI失敗時：ローカル推定）
    try {
      const { title } = req.body || {};
      const t = (title || '').trim();
      if (!t) throw 0;

      let g = 'culture';
      if (/城|寺|神社|史|遺産|城郭|古都|寺院/.test(t)) g = 'historic';
      else if (/公園|山|川|湖|海|自然|滝|渓谷|高原|岬|砂丘|温泉/.test(t)) g = 'nature';
      else if (/都|市|駅|繁華|タワー|スカイ|街|展望|商店街|みなと|ウォーターフロント/.test(t)) g = 'city';

      return res.status(200).json({
        success: true,
        suggestion: {
          title: t,
          genre: g,
          description: '見どころや周辺の雰囲気・歴史・文化が楽しめるスポットです。詳細は追って編集してください。'
        },
        fallback: true
      });
    } catch {
      return res.status(500).json({ success: false, error: 'AI生成に失敗しました' });
    }
  }
});

// ✅ /api/geocode?address=〇〇
app.get('/api/geocode', async (req, res) => {
  try {
    const q = (req.query.q || req.query.address || '').trim();
    if (!q) return res.json({ success: false, error: 'q/address is required' });

    // ✅ 日本住所・施設名どっちも狙えるように調整
    const nomiUrl = new URL('https://nominatim.openstreetmap.org/search');
    nomiUrl.searchParams.set('format', 'jsonv2');
    nomiUrl.searchParams.set('q', q);
    nomiUrl.searchParams.set('countrycodes', 'jp');  // ← これ重要
    nomiUrl.searchParams.set('limit', '1');
    nomiUrl.searchParams.set('addressdetails', '1');

    const nomiResp = await fetch(nomiUrl.toString(), {
      headers: {
        'User-Agent': 'GeoGuess-App/1.0 (contact@example.com)' // 任意
      }
    });
    const nomi = await nomiResp.json();

    if (Array.isArray(nomi) && nomi.length > 0) {
      const top = nomi[0];
      return res.json({
        success: true,
        lat: parseFloat(top.lat),
        lng: parseFloat(top.lon),
        display_name: top.display_name,
        provider: 'nominatim'
      });
    }

    // Googleフォールバック（省略）
    return res.json({ success: false, error: 'not found' });

  } catch (e) {
    console.error('[geocode] error', e);
    res.json({ success: false, error: 'geocode failed' });
  }
});


app.get('/api/user_answers', authenticate, async (req, res) => {
  const userUuid = req.user.uuid;

  try {
   const rows = await pool.query(
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
  try {
    const rows = await pool.query('SELECT location_lat, location_lng FROM USERS WHERE uuid = ?', [req.user.uuid]);
    const row = rows && rows.length ? rows[0] : null;
    res.json({ lat: row?.location_lat ?? null, lng: row?.location_lng ?? null });
  } catch (err) {
    console.error('住所取得エラー:', err);
    res.status(500).json({ error: '住所取得に失敗しました' });
  }
});

// ユーザーの住所を保存
app.post('/api/user_location', authenticate, async (req, res) => {
  const { lat, lng } = req.body;
  try {
    await pool.query(
      'UPDATE USERS SET location_lat = ?, location_lng = ? WHERE uuid = ?',
      [lat, lng, req.user.uuid]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('住所保存エラー:', err);
    res.status(500).json({ error: '住所保存に失敗しました' });
  }
});

app.delete('/api/user_location', authenticate, async (req, res) => {
  try {
    await pool.query(
      'UPDATE USERS SET location_lat = NULL, location_lng = NULL WHERE uuid = ?',
      [req.user.uuid]
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

  // --- 楽天トラベル 近隣ホテル検索（配列の配列フォーマット対応・整形つき） ---

// 目に見えないゼロ幅文字や前後空白を除去
function sanitizeAppId(raw) {
  return (raw || "").trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
}

function generate6DigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// 🔐 ユーザー登録（メール認証つき）
app.post('/api/register', async (req, res) => {
  const { id, email, password } = req.body;

  if (!id || !email || !password) {
    return res.status(400).json({ error: '全ての項目を入力してください。' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // 重複チェック
    const exists = await conn.query(
      'SELECT uuid FROM USERS WHERE id = ? OR mail_address = ? LIMIT 1',
      [id, email]
    );
    if (exists.length > 0) {
      return res.status(409).json({ error: '既に使用されているIDまたはメールアドレスです。' });
    }

    const uuid = crypto.randomUUID();
    const hash = await bcrypt.hash(password, 10);

    // 認証用トークンと有効期限（60分）
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await conn.query(
      `INSERT INTO USERS (
          uuid, id, mail_address, password_hash,
          email_verified, email_verify_token, email_verify_expires_at
        ) VALUES (?, ?, ?, ?, 0, ?, ?)`,
      [uuid, id, email, hash, verifyToken, expiresAt]
    );

    // 確認メール送信（失敗しても登録は残す or ロールバックするかはお好み）
    try {
      await sendSignupVerificationEmail(email, id, verifyToken);
    } catch (mailErr) {
      console.error('[MAIL] signup verify send error:', mailErr);
      // 必要ならここで return して「メール送信に失敗しました」と返す
    }

    res.json({
      message: '仮登録が完了しました。メールに記載されたリンクからメールアドレスを確認してください。'
    });

  } catch (err) {
    console.error('[❌ /api/register error]', err);
    res.status(500).json({ error: '登録中にエラーが発生しました。' });
  } finally {
    if (conn) conn?.release();
  }
});

// server.js など

async function sendSignupVerificationEmail(toEmail, userId, token) {
  if (!toEmail || !token) {
    console.warn('[MAIL] signup verify: toEmail/token が足りません');
    return;
  }

  const recipients = [new Recipient(toEmail, userId || toEmail)];

  // .env にフロントのURLを書いておくと楽 (例: http://localhost:3000)
  const baseUrl = process.env.APP_BASE_URL || 'http://ec2-54-150-237-229.ap-northeast-1.compute.amazonaws.com';
  const verifyUrl = `${baseUrl}/api/email/verify?token=${encodeURIComponent(token)}`;

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject('メールアドレス確認 - 旅行先提案Webシステム')
    .setHtml(`
      <p>旅行先提案Webシステムへのご登録ありがとうございます。</p>
      <p>以下のリンクをクリックして、メールアドレスの確認を完了してください。</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>このリンクの有効期限は 60 分です。</p>
    `)
    .setText([
      '旅行先提案Webシステムへのご登録ありがとうございます。',
      '次のURLにアクセスして、メールアドレスの確認を完了してください。',
      '',
      verifyUrl,
      '',
      'このリンクの有効期限は 60 分です。'
    ].join('\n'));

  console.log('[MAIL] 登録確認メール送信開始 →', toEmail);
  await mailerSend.email.send(emailParams);
  console.log('[MAIL] 登録確認メール送信完了 →', toEmail);
}


async function sendVerificationCodeEmail(toEmail, code, purpose) {
  const purposeLabel = purpose === 'reset_password'
    ? 'パスワード再設定'
    : '確認';

  const recipients = [new Recipient(toEmail, toEmail)];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject(`【${purposeLabel}】確認コードのお知らせ`)
    .setHtml(`
      <p>${purposeLabel} の確認コードは <b style="font-size: 20px;">${code}</b> です。</p>
      <p>このコードの有効期限は10分間です。</p>
      <p>ご自身で操作していない場合は、このメールは破棄してください。</p>
    `)
    .setText(
      [
        `${purposeLabel} の確認コードは ${code} です。`,
        'このコードの有効期限は10分間です。',
        'ご自身で操作していない場合は、このメールは破棄してください。'
      ].join('\n')
    );

  console.log('[MAIL] 確認コード送信開始 →', toEmail, 'purpose=', purpose);
  await mailerSend.email.send(emailParams);
  console.log('[MAIL] 確認コード送信完了 →', toEmail);
}



// 楽天レスポンス1件分から basic/rating を安全に取り出す
function pickBasicAndRating(node) {
  if (!node) return { basic: null, rating: null };

  // 期待ケース: [ {hotelBasicInfo:{...}}, {hotelRatingInfo:{...}} ]
  if (Array.isArray(node)) {
    const out = { basic: null, rating: null };
    for (const part of node) {
      if (part?.hotelBasicInfo) out.basic = part.hotelBasicInfo;
      if (part?.hotelRatingInfo) out.rating = part.hotelRatingInfo;
    }
    return out;
  }

  // フラット: { hotelBasicInfo:{...}, hotelRatingInfo:{...} }
  if (node.hotelBasicInfo || node.hotelRatingInfo) {
    return { basic: node.hotelBasicInfo || null, rating: node.hotelRatingInfo || null };
  }

  // v1互換: { hotel: [ {hotelBasicInfo:{...}}, ... ] } / { hotel:{hotelBasicInfo:{...}} }
  if (node.hotel) {
    if (Array.isArray(node.hotel)) {
      const out = { basic: null, rating: null };
      for (const part of node.hotel) {
        if (part?.hotelBasicInfo) out.basic = part.hotelBasicInfo;
        if (part?.hotelRatingInfo) out.rating = part.hotelRatingInfo;
      }
      return out;
    } else if (typeof node.hotel === "object") {
      const maybe = node.hotel;
      if (maybe.hotelBasicInfo || maybe.hotelRatingInfo) {
        return { basic: maybe.hotelBasicInfo || null, rating: maybe.hotelRatingInfo || null };
      }
      for (const k of Object.keys(maybe)) {
        const v = maybe[k];
        if (v?.hotelBasicInfo || v?.hotelRatingInfo) {
          return { basic: v.hotelBasicInfo || null, rating: v.hotelRatingInfo || null };
        }
      }
    }
  }
  return { basic: null, rating: null };
}

// Rakuten → 共通フォーマットへ整形
function normalizeHotel(basic, rating) {
  const lat = typeof basic.latitude === "number" ? basic.latitude : parseFloat(basic.latitude);
  const lng = typeof basic.longitude === "number" ? basic.longitude : parseFloat(basic.longitude);

  return {
    id: basic.hotelNo ?? null,
    name: basic.hotelName ?? null,
    address: [basic.address1, basic.address2].filter(Boolean).join(" ") || null,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    minCharge: basic.hotelMinCharge ?? null,
    reviewAverage: basic.reviewAverage ?? null,  // 総合
    reviewCount: basic.reviewCount ?? null,
    ratingDetail: {
      service: rating?.serviceAverage ?? null,
      location: rating?.locationAverage ?? null,
      room: rating?.roomAverage ?? null,
      equipment: rating?.equipmentAverage ?? null,
      bath: rating?.bathAverage ?? null,
      meal: rating?.mealAverage ?? null,
    },
    // 画像は候補を優先順で
    thumbnail: basic.hotelThumbnailUrl || basic.hotelImageUrl || basic.roomThumbnailUrl || null,
    infoUrl: basic.hotelInformationUrl || null,
    planUrl: basic.planListUrl || basic.dpPlanListUrl || basic.hotelInformationUrl || null,
  };
}

app.get("/api/hotels_nearby_rakuten", async (req, res) => {
  try {
    // .env からアプリID取得（サニタイズ）
    let applicationId = sanitizeAppId(process.env.RAKUTEN_APP_ID);
    if (!applicationId) {
      return res.status(500).json({ success: false, message: "RAKUTEN_APP_ID is not set on server" });
    }

    const { lat, lng, radiusKm, hits } = req.query;
    if (lat == null || lng == null) {
      return res.status(400).json({ success: false, message: "missing lat/lng" });
    }

    // 楽天の searchRadius は 0.1〜3.0 km（小数1桁）
    const fallbackRadii = radiusKm
      ? [Math.max(0.1, Math.min(3.0, Number(radiusKm)))]
      : [0.5, 1.0, 2.0, 3.0];

    const maxHits = Math.min(Math.max(parseInt(hits || "20", 10), 1), 30);

    for (const r of fallbackRadii) {
      const url = new URL("https://app.rakuten.co.jp/services/api/Travel/SimpleHotelSearch/20170426");
      url.searchParams.set("applicationId", applicationId);
      url.searchParams.set("format", "json");
      url.searchParams.set("formatVersion", "2");   // 配列の配列で返る
      url.searchParams.set("latitude", String(lat));    // WGS84 (度)
      url.searchParams.set("longitude", String(lng));   // WGS84 (度)
      url.searchParams.set("datumType", "1");           // 1=世界測地系 (度)
      url.searchParams.set("searchRadius", String(r));  // 0.1〜3.0
      url.searchParams.set("hits", String(maxHits));    // 1〜30
      url.searchParams.set("carrier", "0");             // PC/スマホ
      url.searchParams.set("responseType", "middle");   // 情報量をほどほどに

      // applicationId を含む完全URLはログに出さない（漏洩防止）
      console.log("[Rakuten] GET", url.origin + url.pathname + "?(masked)");

      // Node18未満対策（必要なときだけ node-fetch を動的 import）
      if (typeof fetch !== "function") {
        const nf = (await import("node-fetch")).default;
        global.fetch = nf;
      }

      const rResp = await fetch(url);
      console.log("[Rakuten] RESP", rResp.status, rResp.statusText);

      const j = await rResp.json().catch(() => ({}));

      // 楽天は 200 でも body に error を入れてくる場合あり
      if (j?.error) {
        console.warn("[Rakuten] BODY error:", j);
        // デバッグしやすいように 200 で理由を返す
        return res.json({
          success: false,
          apiError: j.error,
          apiErrorDescription: j.error_description || null,
        });
      }

      const rawList = Array.isArray(j?.hotels) ? j.hotels : [];
      if (rawList.length === 0) {
        // 次の半径へフォールバック
        continue;
      }

      const hotels = [];
      for (const node of rawList) {
        const { basic, rating } = pickBasicAndRating(node);
        if (!basic) continue;
        hotels.push(normalizeHotel(basic, rating));
      }

      return res.json({
        success: true,
        radiusKm: r,
        count: hotels.length,
        hotels,
        paging: j?.pagingInfo || null,
      });
    }

    // すべての半径でヒットなし
    return res.json({
      success: true,
      radiusKm: fallbackRadii.at(-1),
      count: 0,
      hotels: [],
      paging: null,
    });
  } catch (e) {
    console.error("[Rakuten] handler failed:", e);
    res.status(500).json({ success: false, message: "hotels_nearby_rakuten failed" });
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