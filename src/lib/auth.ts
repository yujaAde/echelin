import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export type Session = { user: User; profile: Profile | null };

// 현재 로그인 사용자와 프로필. 비로그인이면 null.
// cookies() 를 읽으므로 Suspense 경계 안의 컴포넌트에서만 호출할 것.
export async function getSession(): Promise<Session | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: profile ?? null };
}

export async function requireLogin(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireApproved(): Promise<Session & { profile: Profile }> {
  const session = await requireLogin();
  if (!session.profile?.approved) redirect("/pending");
  return { ...session, profile: session.profile };
}

export async function requireAdmin(): Promise<Session & { profile: Profile }> {
  const session = await requireApproved();
  if (session.profile.role !== "admin") redirect("/");
  return session;
}
