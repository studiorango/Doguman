import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * 공개 열람 API용 rate limiter.
 * Upstash 환경변수가 없으면 null → 호출부에서 fail-open (로컬 개발용).
 * Vercel(프로덕션)에는 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN 필수.
 */
const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

export const publicReadLimiter = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(30, "60 s"),
      prefix: "nn-jango:public-read",
      analytics: false,
    })
  : null;

/** identifier(보통 user.id)에 대해 허용 여부 반환. 미설정 시 항상 허용. */
export async function checkPublicReadLimit(identifier: string): Promise<boolean> {
  if (!publicReadLimiter) return true; // fail-open (Upstash 미설정)
  const { success } = await publicReadLimiter.limit(identifier);
  return success;
}
