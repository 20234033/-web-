module.exports = {
  apps: [
    {
      name: 'sightseeing-app',
      script: 'api/server.js',
      instances: 1,               // または 'max'（CPUコア数）
      autorestart: true,         // クラッシュ時に自動再起動
      watch: false,              // ファイル変更を監視しない
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
