// components/auth/AuthButton.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthButton() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setShowModal(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signInGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  const signInEmail = async () => {
    if (!email || !password) return;
    setEmailLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError('이메일 또는 비밀번호가 올바르지 않아요.');
    setEmailLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return null;

  if (user) {
    const isAdmin = user.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID;
    return (
      <div className="flex items-center gap-2">
        {user.user_metadata?.avatar_url && (
          <img src={user.user_metadata.avatar_url} alt="" className="w-7 h-7 rounded-full" />
        )}
        <span className="text-[12px] font-semibold text-[#1F2937]">
          {user.user_metadata?.name ?? user.email}
        </span>
        {isAdmin && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1B4F8A] text-white">관리자</span>
        )}
        <button onClick={signOut}
          className="text-[11px] text-[#9CA3AF] hover:text-[#F94239] transition-colors">
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[#E6E6E6] bg-white text-[12px] font-semibold text-[#1F2937] hover:border-[#CEDA80] transition-colors">
        로그인
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-[20px] p-6 w-[320px] shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[16px] font-bold text-[#1F2937]">로그인</p>
              <button onClick={() => setShowModal(false)}
                className="text-[#9CA3AF] hover:text-[#1F2937] text-[18px] leading-none">✕</button>
            </div>

            {/* 구글 로그인 */}
            <button onClick={signInGoogle}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] border border-[#E6E6E6] text-[13px] font-semibold text-[#1F2937] hover:bg-[#F8F8FA] transition-colors mb-4">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M15.68 8.18c0-.57-.05-1.12-.14-1.64H8v3.1h4.3a3.67 3.67 0 01-1.6 2.41v2h2.58c1.51-1.39 2.38-3.44 2.38-5.87z" fill="#4285F4"/>
                <path d="M8 16c2.16 0 3.97-.72 5.3-1.94l-2.59-2a4.77 4.77 0 01-7.1-2.5H1v2.07A8 8 0 008 16z" fill="#34A853"/>
                <path d="M3.61 9.56A4.8 4.8 0 013.36 8c0-.54.1-1.07.25-1.56V4.37H1A8 8 0 000 8c0 1.29.31 2.51.86 3.59l2.75-2.03z" fill="#FBBC05"/>
                <path d="M8 3.18c1.22 0 2.3.42 3.16 1.24l2.37-2.37A8 8 0 001 4.37l2.75 2.07A4.77 4.77 0 018 3.18z" fill="#EA4335"/>
              </svg>
              구글로 계속하기
            </button>

            {/* 구분선 */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[#E6E6E6]"/>
              <span className="text-[11px] text-[#9CA3AF]">또는</span>
              <div className="flex-1 h-px bg-[#E6E6E6]"/>
            </div>

            {/* 이메일 로그인 */}
            <div className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && signInEmail()}
                className="w-full border border-[#E6E6E6] rounded-[10px] px-3 py-2.5 text-[13px] focus:outline-none focus:border-[#7C8C03] transition-colors"
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && signInEmail()}
                className="w-full border border-[#E6E6E6] rounded-[10px] px-3 py-2.5 text-[13px] focus:outline-none focus:border-[#7C8C03] transition-colors"
              />
              {error && <p className="text-[11px] text-[#F94239]">{error}</p>}
              <button
                onClick={signInEmail}
                disabled={emailLoading || !email || !password}
                className="w-full py-2.5 rounded-[10px] text-[13px] font-bold text-white disabled:opacity-40 transition-colors"
                style={{ background: '#7C8C03' }}>
                {emailLoading ? '로그인 중...' : '이메일로 로그인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}