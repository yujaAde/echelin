function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`환경변수 ${name} 가 설정되지 않았습니다. .env.local 을 확인하세요.`);
  }
  return value;
}

export const supabaseUrl = required(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

export const supabaseAnonKey = required(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
