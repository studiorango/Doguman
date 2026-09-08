import type { Metadata } from "next";
import { Geist, Geist_Mono, Gothic_A1 } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 오염파이터 로고 워드마크 전용. 본문은 Pretendard 유지.
const gothicA1 = Gothic_A1({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "콩나무 | 버킷리스트",
  description: "인생 버킷리스트를 작성하고 달성률을 추적합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${gothicA1.variable} h-full antialiased`}
    >
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
