import '../globals.css'; // 共通CSS
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href="/css/style.css" />
      {children}
    </>
  );
}
