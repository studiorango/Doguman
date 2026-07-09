import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "nn-jango | 냉장고 레시피 관리",
  description: "냉장고 재고로 만들 수 있는 레시피를 확인하고 타임테이블을 짜보세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="min-h-full min-h-[100dvh] flex flex-col bg-zinc-50 text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  );
}
