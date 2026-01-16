# MariaDB テーブル作成手順（website）

このファイルは、あなたが提示した `SHOW TABLES` と `DESC` の結果に基づいて、同一構造になるように `CREATE TABLE` をまとめたものです。  
※ 外部キー（FOREIGN KEY）が設定されているかどうかは `DESC` だけでは確定できないため、この手順書では **外部キーは作成していません**（必要なら別途追加してください）。

---

## 0. データベース作成（未作成の場合）

```sql
CREATE DATABASE IF NOT EXISTS website
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE website;
```

---

## 1. users テーブル

```sql
CREATE TABLE IF NOT EXISTS users (
  id                      VARCHAR(36)   NOT NULL,
  mail_address            VARCHAR(255)  NOT NULL,
  password_hash           VARCHAR(255)  NOT NULL,
  created_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  continuous_login_days   INT(11)       NOT NULL DEFAULT 0,
  avatar_url              VARCHAR(2048) NULL,
  location_lat            DOUBLE        NULL,
  location_lng            DOUBLE        NULL,
  uuid                    VARCHAR(36)   NOT NULL,
  email_verified          TINYINT(1)    NOT NULL DEFAULT 0,
  email_verify_token      VARCHAR(64)   NULL,
  email_verify_expires_at DATETIME      NULL,

  PRIMARY KEY (uuid),
  UNIQUE KEY uq_users_id (id),
  UNIQUE KEY uq_users_mail_address (mail_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 2. spots テーブル

```sql
CREATE TABLE IF NOT EXISTS spots (
  spot_id         INT(11)       NOT NULL AUTO_INCREMENT,
  title           VARCHAR(100)  NOT NULL,
  genre           VARCHAR(50)   NULL,
  description     TEXT          NOT NULL,
  lat             DOUBLE        NOT NULL,
  lng             DOUBLE        NOT NULL,
  image_path      VARCHAR(255)  NOT NULL,
  street_view_url TEXT          NULL,
  created_at      DATETIME      NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (spot_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 3. user_answers テーブル

```sql
CREATE TABLE IF NOT EXISTS user_answers (
  id          INT(11)        NOT NULL AUTO_INCREMENT,
  spot_id     INT(11)        NOT NULL,
  answer_lat  DECIMAL(10,8)  NOT NULL,
  answer_lng  DECIMAL(11,8)  NOT NULL,
  distance_km DECIMAL(6,2)   NOT NULL,
  score       INT(11)        NOT NULL,
  answered_at DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_uuid   VARCHAR(36)    NULL,

  PRIMARY KEY (id),
  KEY idx_user_answers_spot_id (spot_id),
  KEY idx_user_answers_user_uuid (user_uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 4. email_verification_codes テーブル

```sql
CREATE TABLE IF NOT EXISTS email_verification_codes (
  token      CHAR(64)                               NOT NULL,
  email      VARCHAR(255)                           NOT NULL,
  user_id    VARCHAR(50)                            NULL,
  code       CHAR(6)                                NOT NULL,
  purpose    ENUM('register','reset_password')      NOT NULL,
  expires_at DATETIME                               NOT NULL,
  used       TINYINT(1)                             NOT NULL DEFAULT 0,
  created_at DATETIME                               NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 5. account_change_tokens テーブル

```sql
CREATE TABLE IF NOT EXISTS account_change_tokens (
  id         INT(10) UNSIGNED                      NOT NULL AUTO_INCREMENT,
  user_uuid  CHAR(36)                               NOT NULL,
  token      CHAR(64)                               NOT NULL,
  kind       ENUM('username','email','password','delete') NOT NULL,
  expires_at DATETIME                               NOT NULL,
  consumed   TINYINT(1)                             NOT NULL DEFAULT 0,
  created_at TIMESTAMP                              NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_account_change_tokens_token (token),
  KEY idx_account_change_tokens_user_uuid (user_uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 6. 作成確認

```sql
SHOW TABLES;

DESC users;
DESC spots;
DESC user_answers;
DESC email_verification_codes;
DESC account_change_tokens;
```
