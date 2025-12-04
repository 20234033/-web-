// frontend/app/layout.tsx
import './globals.css';
import type { ReactNode } from 'react';
import Navbar from './_components/Navbar';

export const metadata = {
  title: '旅行先提案Webシステム',
  description: '観光スポット提案Webサービス',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        {/* ここで public/css/style.css を読み込む */}
        <link rel="stylesheet" href="/css/style.css" />
      </head>
      <body>
        <Navbar />
        <div>{children}</div>
      </body>
    </html>
  );
}
