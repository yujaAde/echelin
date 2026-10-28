"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

// 클라이언트 컴포넌트에서 사용. 내부적으로 싱글턴으로 관리된다.
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
