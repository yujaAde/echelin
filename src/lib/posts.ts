import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const POST_IMAGES_BUCKET = "post-images";
export const SIGNED_URL_TTL_SECONDS = 60 * 60;

type Client = SupabaseClient<Database>;

// storage 경로 목록 -> { path: signedUrl }. 실패한 경로는 빠진다.
export async function signedUrlMap(
  supabase: Client,
  paths: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (paths.length === 0) return result;

  const { data, error } = await supabase.storage
    .from(POST_IMAGES_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return result;

  for (const item of data) {
    if (item.path && item.signedUrl && !item.error) {
      result.set(item.path, item.signedUrl);
    }
  }
  return result;
}

// 닉네임 조회용. 탈퇴/미승인 회원은 "(알 수 없음)".
export async function nicknameMap(
  supabase: Client,
  userIds: string[],
): Promise<Map<string, string>> {
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return new Map();
  const { data } = await supabase.from("profiles").select("id, nickname").in("id", ids);
  return new Map((data ?? []).map((p) => [p.id, p.nickname]));
}

export function displayName(map: Map<string, string>, id: string): string {
  return map.get(id) ?? "(알 수 없음)";
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
