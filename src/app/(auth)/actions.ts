"use server";

import { redirect } from "next/navigation";
import { isValidLoginId, normalizeLoginId, toAuthEmail } from "@/lib/account";
import { requireLogin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = {
  error?: string;
  success?: string;
};

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const loginId = field(formData, "login_id");
  const password = field(formData, "password");
  if (!loginId || !password) {
    return { error: "아이디와 비밀번호를 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: toAuthEmail(loginId),
    password,
  });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "계정이 아직 활성화되지 않았습니다. 운영진에게 문의해 주세요." };
    }
    return { error: "아이디 또는 비밀번호가 올바르지 않습니다." };
  }

  redirect("/");
}

export async function signup(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const loginId = normalizeLoginId(field(formData, "login_id"));
  const password = field(formData, "password");
  const passwordConfirm = field(formData, "password_confirm");
  const nickname = field(formData, "nickname");

  if (!loginId || !password || !nickname) {
    return { error: "모든 항목을 입력해 주세요." };
  }
  if (!isValidLoginId(loginId)) {
    return { error: "아이디는 영문 소문자, 숫자, 밑줄(_)로 4~20자여야 합니다." };
  }
  if (nickname.length < 2 || nickname.length > 20) {
    return { error: "닉네임은 2자 이상 20자 이하로 입력해 주세요." };
  }
  if (password.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 합니다." };
  }
  if (password !== passwordConfirm) {
    return { error: "비밀번호 확인이 일치하지 않습니다." };
  }

  const email = toAuthEmail(loginId);

  // 가짜 이메일로는 확인 메일을 받을 수 없으므로, 대시보드의 Confirm email 설정과 무관하게
  // service_role 로 계정을 "확인 완료" 상태로 만든 뒤 바로 로그인시킨다.
  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nickname, login_id: loginId },
  });

  if (createError) {
    if (createError.code === "weak_password") {
      return { error: "비밀번호가 너무 약합니다. 더 긴 비밀번호를 사용해 주세요." };
    }
    if (createError.code === "email_exists" || createError.status === 422) {
      return { error: "이미 사용 중인 아이디입니다." };
    }
    return { error: `가입에 실패했습니다. (${createError.message})` };
  }

  const supabase = await createClient();
  const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
  if (loginError) {
    return { error: "가입은 되었지만 자동 로그인에 실패했습니다. 로그인 화면에서 다시 시도해 주세요." };
  }

  redirect("/pending");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function changePassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  await requireLogin();

  const password = field(formData, "password");
  const passwordConfirm = field(formData, "password_confirm");
  if (password.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 합니다." };
  }
  if (password !== passwordConfirm) {
    return { error: "비밀번호 확인이 일치하지 않습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") {
      return { error: "현재 비밀번호와 다른 비밀번호를 입력해 주세요." };
    }
    return { error: `비밀번호 변경에 실패했습니다. (${error.message})` };
  }

  return { success: "비밀번호를 변경했습니다." };
}
