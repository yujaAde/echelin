// 이메일을 수집하지 않기 위해 아이디를 내부용 가짜 이메일로 바꿔 Supabase Auth 에 넘긴다.
// ".invalid" 는 메일이 절대 도달하지 않는 예약 도메인이라 계정 탈취에 쓰일 수 없다.

export const SYNTHETIC_EMAIL_DOMAIN = "members.echelin.invalid";

export const LOGIN_ID_RE = /^[a-z0-9_]{4,20}$/;

export function normalizeLoginId(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidLoginId(id: string): boolean {
  return LOGIN_ID_RE.test(id);
}

// 아이디 -> 인증용 이메일. 이미 이메일 형식(@ 포함)이면 그대로 쓴다 (초기 계정 호환).
export function toAuthEmail(idOrEmail: string): string {
  const value = idOrEmail.trim().toLowerCase();
  if (value.includes("@")) return value;
  return `${value}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

export function isSyntheticEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(`@${SYNTHETIC_EMAIL_DOMAIN}`);
}

// 화면 표시용: 가짜 이메일이면 아이디만, 진짜 이메일이면 그대로
export function displayLoginId(email: string | null | undefined): string {
  if (!email) return "(알 수 없음)";
  return isSyntheticEmail(email) ? email.split("@")[0] : email;
}
