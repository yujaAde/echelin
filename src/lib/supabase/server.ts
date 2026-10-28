import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

// 서버 컴포넌트, 서버 액션, 라우트 핸들러에서 사용.
// cookies() 를 읽으므로 호출하는 컴포넌트는 Suspense 경계 안에 있어야 한다 (cacheComponents).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // 서버 컴포넌트에서 호출되면 쿠키를 쓸 수 없다.
          // 세션 갱신은 proxy.ts 가 담당하므로 무시해도 된다.
        }
      },
    },
  });
}
