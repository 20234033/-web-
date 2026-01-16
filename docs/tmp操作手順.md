# アプリの設置・インストール方法

本章では、本システム（GeoGuessr風観光Webアプリ）をサーバー上に設置し、利用可能な状態にするまでの手順を説明します。

---

## 1. 動作環境

### 1.1 サーバー要件

| 項目 | 内容 |
|------|------|
| OS | Ubuntu 22.04 LTS / 24.04 LTS |
| Node.js | v18 以上 |
| データベース | MariaDB 10.6 以上 |
| Webサーバー | 任意（Nginx, Caddy 等） |
| ストレージ | 10GB 以上の空き容量 |

---

## 2. 事前準備

### 2.1 Node.js のインストール

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

---

### 2.2 MariaDB のインストール

```bash
sudo apt update
sudo apt install -y mariadb-server
sudo mysql_secure_installation
```
---

### 2.3 データベース作成
| ※ パスワードやDB名は環境に合わせて変更してください。

```sql
CREATE DATABASE geoguessr_app DEFAULT CHARACTER SET utf8mb4;
CREATE USER 'geoguessr'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON geoguessr_app.* TO 'geoguessr'@'localhost';
FLUSH PRIVILEGES;
```
---

## 3. アプリケーションの設置

### 3.1 ソースコードの配置
```bash
cd /var/www
git clone https://github.com/20234033/-web-.git
cd geoguessr-app
```
---

## 3.2 依存関係のインストール

```bash
npm ci
```
---

## 3.3 環境変数の設定
`.env `ファイルを作成します。

```bash
cp .env.example .env
nano .env
```

設定例：
```env
GOOGLE_API_KEY=
RAKUTEN_APP_ID=
DB_HOST=localhost
DB_USER=geoapp
DB_PASSWORD=Password
DB_NAME=website
SECRET_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
S3_BUCKET_NAME=
JWT_SECRET=
GEMINI_API_KEY=
MAILERSEND_API_KEY=
VERIFY_FROM_EMAIL=
VERIFY_FROM_NAME=旅行先提案Webシステム
```
---

### 3.4 データベース初期化

```bash
npm run migrate
# または
node scripts/init-db.js
```
---

## 4 MariaDB の構築方法

### 4.1. インストール
```bash
sudo apt update
sudo apt install -y mariadb-server mariadb-client
sudo systemctl enable --now mariadb
```

### 4.2. 初期設定
```bash
sudo mysql_secure_installation
```

### 4.3. ログイン
```bash
sudo mariadb
```

### 4.4. データベース作成
```sql
CREATE DATABASE website DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

### 4.5. ユーザー作成
```sql
CREATE USER 'website_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON website.* TO 'website_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4.6. 接続確認
```bash
mariadb -u website_user -p website
```

### 4.7. テーブル確認
```sql
SHOW TABLES;
DESC users;
DESC spots;
DESC user_answers;
DESC email_verification_codes;
DESC account_change_tokens;
```

### 4.8. バックアップ
```bash
mysqldump -u website_user -p website > website_backup.sql
```

---

## 4. 起動方法
### 4.1 開発モード

```bash
npm run dev
```
---
### 4.2 本番モード

```bash
npm run build
npm start
```
---
### PM2 を使用する場合

```bash
npm install -g pm2
pm2 start npm --name geo-app -- start
pm2 save
pm2 status
```
---

## 5. 動作確認
ブラウザで以下にアクセスします。

```url
http://<サーバーIP>:3000
```
トップ画面が表示されれば正常にインストールされています。

---

## 6. トラブルシューティング

| 症状 | 原因 | 対処方法 |
|------|--------|-----------|
| 画面が表示されない | アプリが起動していない | `npm start` または `pm2 status` で起動状態を確認 |
| 画面が表示されない | ポートが閉じている | `ufw status` で 3000 番ポートが許可されているか確認 |
| DB 接続エラー | `.env` の DB 設定が間違っている | `DB_HOST` / `DB_USER` / `DB_PASS` / `DB_NAME` を確認 |
| DB 接続エラー | MariaDB が起動していない | `systemctl status mariadb` で状態確認 |
| ログインできない | JWT_SECRET が変更された | `.env` の `JWT_SECRET` を固定し再起動 |
| 500 エラーが出る | サーバー側で例外が発生している | `pm2 logs` または コンソールログを確認 |
| 画像が表示されない | public パスが間違っている | 画像の配置場所と参照パスを確認 |
| 保存できない | DB の権限不足 | `GRANT` が正しく設定されているか確認 |
| 反映されない | ビルドしていない | `npm run build` を再実行 |
| 変更が反映されない | pm2 を再起動していない | `pm2 restart geoguessr-app` を実行 |







