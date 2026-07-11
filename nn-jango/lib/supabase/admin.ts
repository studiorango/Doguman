import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * service_role 클라이언트 — RLS를 우회한다. 서버(API route)에서만 사용할 것.
 * 절대 클라이언트 컴포넌트에서 import 하지 말 것. 키는 NEXT_PUBLIC_ 접두사 금지.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
