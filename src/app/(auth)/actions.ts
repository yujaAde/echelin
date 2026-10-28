"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = {
  error?: string;
  success?: string;
};

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = field(formData, "email");
  const password = field(formData, "password");
  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "이메일 확인이 끝나지 않았습니다. 받은 메일의 링크를 먼저 눌러 주세요." };
    }
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  redirect("/");
}

export async function signup(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = field(formData, "email");
  const password = field(formData, "password");
  const nickname = field(formData, "nickname");

  if (!email || !password || !nickname) {
    return { error: "모든 항목을 입력해 주세요." };
  }
  if (nickname.length < 2 || nickname.length > 20) {
    return { error: "닉네임은 2자 이상 20자 이하로 입력해 주세요." };
  }
  if (password.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 합니다." };
  }

  const supabase = await createClient();
  const origin = await siteOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nickname },
      emailRedirectTo: `${origin}/auth/callback?next=/pending`,
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { error: "이미 가입된 이메일입니다." };
    }
    if (error.code === "weak_password") {
      return { error: "비밀번호가 너무 약합니다. 더 긴 비밀번호를 사용해 주세요." };
    }
    return { error: `가입에 실패했습니다. (${error.message})` };
  }

  // 이메일 확인이 켜진 프로젝트에서 이미 가입된 이메일로 signUp 하면
  // 오류 대신 identities 가 빈 가짜 사용자를 돌려준다.
  if (data.user && data.user.identities?.length === 0) {
    return { error: "이미 가입된 이메일입니다." };
  }

  // 이메일 확인이 꺼져 있으면 세션이 바로 생긴다.
  if (data.session) {
    redirect("/pending");
  }

  return {
    success: `${email} 로 확인 메일을 보냈습니다. 메일의 링크를 누르면 가입이 완료되고 승인 대기 상태가 됩니다.`,
  };
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
