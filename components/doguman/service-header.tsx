"use client";

import Link from "next/link";
import AuthButton from "@/components/auth/AuthButton";

export function ServiceHeader() {
  return (
    <header
      className="h-[60px] sticky top-0 z-50 flex items-center"
      style={{
        background: "rgba(250,249,247,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid #E8E5E0",
      }}
    >
      <div
        className="w-full mx-auto px-6"
        style={{
          maxWidth: "1040px",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
        }}
      >
        <div className="flex items-center">
          <Link
            href="/"
            className="text-[17px] font-bold tracking-tight"
            style={{ color: "#1A1A1A" }}
          >
            도구맨
          </Link>
        </div>
        <div className="flex items-center justify-center">
          <Link
            href="/blog"
            className="text-[15px] font-medium transition-colors duration-150 hover:opacity-60"
            style={{ color: "#888888" }}
          >
            블로그
          </Link>
        </div>
        <div className="flex items-center justify-end">
          <AuthButton />
        </div>
      </div>
    </header>
  );
}