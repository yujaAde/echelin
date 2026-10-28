import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

// 요청마다 세션 토큰을 갱신하고, 갱신된 쿠키를 요청/응답 양쪽에 반영한다.
// 인가(승인 여부 등)는 여기서 판단하지 않고 각 페이지/서버 액션에서 처리한다.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser() 는 Supabase Auth 서버에 토큰을 검증하므로 만료된 세션을 갱신해 준다.
  // createServerClient 와 getUser 사이에 다른 코드를 넣지 말 것 (세션 유실 위험).
  await supabase.auth.getUser();

  return supabaseResponse;
}
