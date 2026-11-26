"use server";

import { randomInt } from "node:crypto";
import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ApproveState = { error?: string };

export async function setApproved(
  _prev: ApproveState,
  formData: FormData,
): Promise<ApproveState> {
  await requireAdmin();

  const targetId = formData.get("id");
  const value = formData.get("value");
  if (
    typeof targetId !== "string" ||
    !UUID_RE.test(targetId) ||
    (value !== "true" && value !== "false")
  ) {
    return { error: "잘못된 요청입니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_profile_approved", {
    target_id: targetId,
    value: value === "true",
  });
  if (error) {
    return { error: `승인 상태 변경에 실패했습니다. (${error.message})` };
  }

  // DB 는 캐시 밖 데이터이므로 현재 경로의 RSC 를 다시 받아 화면을 갱신한다
  refresh();
  return {};
}

// 회원 삭제. auth.users 를 지우면 profiles, votes, vote_absences 가 cascade 로 사라지고
// posts / comments / restaurants 는 작성자만 null 이 되어 남는다 (0006 마이그레이션).
export async function deleteMember(formData: FormData): Promise<{ error?: string }> {
  const { user } = await requireAdmin();

  const targetId = formData.get("id");
  if (typeof targetId !== "string" || !UUID_RE.test(targetId)) {
    return { error: "잘못된 요청입니다." };
  }
  if (targetId === user.id) {
    return { error: "본인 계정은 지울 수 없습니다." };
  }

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", targetId)
    .maybeSingle();
  if (!target) return { error: "회원을 찾을 수 없습니다." };
  if (target.role === "admin") {
    return { error: "운영진 계정은 지울 수 없습니다. 먼저 역할을 바꿔 주세요." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(targetId);
  if (error) return { error: `삭제하지 못했습니다. (${error.message})` };

  refresh();
  return {};
}

export type ResetPasswordState = { error?: string; tempPassword?: string };

// 헷갈리는 글자(0/O, 1/l/I)를 뺀 알파벳
const TEMP_PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function generateTempPassword(length = 10): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += TEMP_PASSWORD_ALPHABET[randomInt(TEMP_PASSWORD_ALPHABET.length)];
  }
  return out;
}

// 이메일을 수집하지 않으므로 비밀번호 찾기가 없다. 관리자가 임시 비밀번호를 발급해 직접 전달한다.
export async function resetPassword(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const { user } = await requireAdmin();

  const targetId = formData.get("id");
  if (typeof targetId !== "string" || !UUID_RE.test(targetId)) {
    return { error: "잘못된 요청입니다." };
  }
  if (targetId === user.id) {
    return { error: "본인 비밀번호는 비밀번호 변경 메뉴에서 바꿔 주세요." };
  }

  const tempPassword = generateTempPassword();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(targetId, { password: tempPassword });
  if (error) {
    return { error: `초기화에 실패했습니다. (${error.message})` };
  }

  return { tempPassword };
}
