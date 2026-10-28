"use server";

import { refresh } from "next/cache";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type RestaurantFormState = { error?: string; success?: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v.trim() : "";
}

function revalidate() {
  refresh();
}

export async function addRestaurant(
  _prev: RestaurantFormState,
  formData: FormData,
): Promise<RestaurantFormState> {
  const { user } = await requireApproved();

  const name = text(formData, "name");
  const address = text(formData, "address");
  const kakaoPlaceId = text(formData, "kakao_place_id");
  const memo = text(formData, "memo");
  const lat = Number(text(formData, "lat"));
  const lng = Number(text(formData, "lng"));

  if (name.length < 1 || name.length > 100) {
    return { error: "이름은 1~100자여야 합니다." };
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return { error: "좌표가 올바르지 않습니다." };
  }
  if (kakaoPlaceId.length > 50 || memo.length > 500 || address.length > 200) {
    return { error: "입력값이 너무 깁니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("restaurants").insert({
    name,
    address: address || null,
    lat,
    lng,
    kakao_place_id: kakaoPlaceId || null,
    memo: memo || null,
    created_by: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "이미 저장된 맛집입니다." };
    }
    return { error: `저장에 실패했습니다. (${error.message})` };
  }

  revalidate();
  return { success: `${name} 을(를) 저장했습니다.` };
}

export async function updateRestaurantMemo(
  _prev: RestaurantFormState,
  formData: FormData,
): Promise<RestaurantFormState> {
  await requireApproved();

  const id = text(formData, "id");
  const memo = text(formData, "memo");
  if (!UUID_RE.test(id)) return { error: "잘못된 요청입니다." };
  if (memo.length > 500) return { error: "메모는 500자 이하로 입력해 주세요." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .update({ memo: memo || null })
    .eq("id", id)
    .select("id");
  if (error) return { error: `수정에 실패했습니다. (${error.message})` };
  if (!data || data.length === 0) return { error: "수정 권한이 없습니다." };

  revalidate();
  return { success: "메모를 저장했습니다." };
}

export async function deleteRestaurant(formData: FormData): Promise<void> {
  await requireApproved();

  const id = text(formData, "id");
  if (!UUID_RE.test(id)) throw new Error("잘못된 요청입니다.");

  const supabase = await createClient();
  const { error } = await supabase.from("restaurants").delete().eq("id", id);
  if (error) throw new Error(`삭제에 실패했습니다. (${error.message})`);

  revalidate();
}
