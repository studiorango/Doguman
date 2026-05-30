import { NextRequest, NextResponse } from "next/server";

const BLOG_ID = "lifeisntcool";
const CATEGORY_NO = "3"; // 셀룰로이드 드림

export type ScrapedMovie = {
  title: string;
  review: string;
  rating: number;
  postNo: string;
  postTitle: string;
  date: string;
  source: string;
};

// ★★★☆ → 3.5 변환
function parseStars(stars: string): number {
  const full = (stars.match(/★/g) || []).length;
  const half = (stars.match(/☆/g) || []).length;
  return full + half * 0.5;
}

// 포스팅 본문 HTML → 영화 목록 파싱
function parseMoviesFromHtml(html: string, postNo: string, postTitle: string, date: string): ScrapedMovie[] {
  const movies: ScrapedMovie[] = [];

  // HTML → 텍스트 변환
  let text = html.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n");
  text = text.replace(/<[^>]+>/g, "");
  text = text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"');

  // 줄 단위로 분리, 빈줄 제거
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l && l !== "​");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // <영화제목> 패턴
    const titleMatch = line.match(/^<(.{1,40})>$/);
    if (!titleMatch) continue;
    const title = titleMatch[1].trim();

    // 이후 줄에서 한줄평 + 별점 탐색 (최대 5줄 이내)
    let review = "";
    let rating: number | null = null;

    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
      const next = lines[j];
      const starMatch = next.match(/^([★☆]+)$/);
      if (starMatch) {
        rating = parseStars(starMatch[1]);
        break;
      }
      // 다음 영화 제목이 나오면 중단
      if (next.match(/^<.{1,40}>$/)) break;
      // 감독/출연 정보 줄은 스킵
      if (next.startsWith("감독:") || next.startsWith("출연:")) continue;
      if (!review) review = next;
    }

    if (rating !== null && rating > 0 && rating <= 5) {
      movies.push({
        title,
        review,
        rating,
        postNo,
        postTitle,
        date,
        source: `https://blog.naver.com/${BLOG_ID}/${postNo}`,
      });
    }
  }

  return movies;
}

// 포스팅 목록 가져오기
async function fetchPostList(page: number): Promise<{ logNo: string; title: string; date: string }[]> {
  const url = `https://blog.naver.com/PostTitleListAsync.naver?blogId=${BLOG_ID}&currentPage=${page}&categoryNo=${CATEGORY_NO}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": `https://blog.naver.com/${BLOG_ID}`,
    },
  });
  // 네이버 블로그 JSON에 잘못된 이스케이프(\') 포함 → 수동 정리
  const raw = await res.text();
  const cleaned = raw.replace(/\\'/g, "'");
  let json: { resultCode: string; postList?: { logNo: string; title: string; addDate: string }[] };
  try {
    json = JSON.parse(cleaned);
  } catch {
    return [];
  }
  if (json.resultCode !== "S") return [];
  return (json.postList || []).map((p: { logNo: string; title: string; addDate: string }) => ({
    logNo: p.logNo,
    title: decodeURIComponent(p.title.replace(/\+/g, " ")),
    date: p.addDate || "",
  }));
}

// 개별 포스팅 본문 가져오기
async function fetchPostHtml(logNo: string): Promise<string> {
  const url = `https://blog.naver.com/PostView.naver?blogId=${BLOG_ID}&logNo=${logNo}&redirect=Dlog&widgetTypeCall=true&directAccess=false`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": `https://blog.naver.com/${BLOG_ID}`,
      "Accept-Language": "ko-KR,ko;q=0.9",
    },
  });
  return res.text();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pages = Math.min(parseInt(searchParams.get("pages") || "5"), 50);

  try {
    const allMovies: ScrapedMovie[] = [];
    const seen = new Set<string>();

    for (let page = 1; page <= pages; page++) {
      const posts = await fetchPostList(page);
      if (posts.length === 0) break;

      await Promise.all(
        posts.map(async (post) => {
          try {
            const html = await fetchPostHtml(post.logNo);
            const movies = parseMoviesFromHtml(html, post.logNo, post.title, post.date);
            for (const m of movies) {
              const key = `${m.title}:${m.rating}`;
              if (!seen.has(key)) {
                seen.add(key);
                allMovies.push(m);
              }
            }
          } catch {
            // 개별 포스트 실패는 무시
          }
        })
      );
    }

    // 별점 높은순 정렬
    allMovies.sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title));

    return NextResponse.json({
      ok: true,
      total: allMovies.length,
      pages,
      movies: allMovies,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
