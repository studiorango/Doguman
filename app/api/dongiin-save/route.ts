import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60; // Vercel 최대 60초

const BLOG_ID = "lifeisntcool";
const CATEGORY_NO = "3";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function parseStars(stars: string): number {
  const full = (stars.match(/★/g) || []).length;
  const half = (stars.match(/☆/g) || []).length;
  return full + half * 0.5;
}

function parseMoviesFromHtml(html: string, postNo: string, postTitle: string, date: string) {
  let text = html.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n");
  text = text.replace(/<[^>]+>/g, "");
  text = text
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"');

  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l && l !== "​" && l !== "​");

  const movies = [];
  for (let i = 0; i < lines.length; i++) {
    const titleMatch = lines[i].match(/^<(.{1,40})>$/);
    if (!titleMatch) continue;
    const title = titleMatch[1].trim();

    let review = "";
    let rating: number | null = null;
    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
      const next = lines[j];
      if (next.match(/^[★☆]+$/)) { rating = parseStars(next); break; }
      if (next.match(/^<.{1,40}>$/)) break;
      if (next.startsWith("감독:") || next.startsWith("출연:")) continue;
      if (!review) review = next;
    }

    if (rating !== null && rating > 0 && rating <= 5) {
      movies.push({ title, review, rating, post_no: postNo, post_title: postTitle, date, source: `https://blog.naver.com/${BLOG_ID}/${postNo}` });
    }
  }
  return movies;
}

async function fetchPostList(page: number) {
  const url = `https://blog.naver.com/PostTitleListAsync.naver?blogId=${BLOG_ID}&currentPage=${page}&categoryNo=${CATEGORY_NO}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Referer": `https://blog.naver.com/${BLOG_ID}`,
    },
  });
  const raw = await res.text();
  const cleaned = raw.replace(/\\'/g, "'");
  try {
    const json = JSON.parse(cleaned);
    if (json.resultCode !== "S") return [];
    return (json.postList || []).map((p: { logNo: string; title: string; addDate: string }) => ({
      logNo: p.logNo,
      title: decodeURIComponent(p.title.replace(/\+/g, " ")),
      date: p.addDate || "",
    }));
  } catch { return []; }
}

async function fetchPostHtml(logNo: string): Promise<string> {
  const url = `https://blog.naver.com/PostView.naver?blogId=${BLOG_ID}&logNo=${logNo}&redirect=Dlog&widgetTypeCall=true&directAccess=false`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Referer": `https://blog.naver.com/${BLOG_ID}`,
      "Accept-Language": "ko-KR,ko;q=0.9",
    },
  });
  return res.text();
}

export async function POST(req: NextRequest) {
  const { startPage, endPage } = await req.json();

  const start = Math.max(1, startPage || 1);
  const end = Math.min(start + 19, endPage || start + 19); // 최대 20페이지씩

  let saved = 0;
  let skipped = 0;
  let totalMovies = 0;

  for (let page = start; page <= end; page++) {
    const posts = await fetchPostList(page);
    if (posts.length === 0) {
      // 마지막 페이지 도달
      await supabase.from("dongiin_meta").upsert({ key: "last_scraped_page", value: "done" });
      break;
    }

    for (const post of posts) {
      try {
        const html = await fetchPostHtml(post.logNo);
        const movies = parseMoviesFromHtml(html, post.logNo, post.title, post.date);
        totalMovies += movies.length;

        if (movies.length > 0) {
          const { error } = await supabase
            .from("dongiin_movies")
            .upsert(movies, { onConflict: "title", ignoreDuplicates: true });
          if (!error) saved += movies.length;
          else skipped += movies.length;
        }
      } catch { skipped++; }
    }
  }

  // 진행 상태 저장
  await supabase.from("dongiin_meta").upsert({ key: "last_scraped_page", value: String(end) });

  // 전체 저장된 수
  const { count } = await supabase.from("dongiin_movies").select("*", { count: "exact", head: true });

  return NextResponse.json({ ok: true, saved, skipped, totalMovies, pages: `${start}~${end}`, totalStored: count });
}
