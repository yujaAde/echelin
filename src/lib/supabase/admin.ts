import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { supabaseUrl } from "@/lib/env";

// service_role 키를 사용하는 관리용 클라이언트. RLS 를 우회하므로
// 서버 액션/라우트 핸들러 안에서 관리자 검증을 마친 뒤에만 사용할 것.
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("환경변수 SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다.");
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
