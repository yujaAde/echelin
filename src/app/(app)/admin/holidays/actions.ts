"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { isDateString } from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";

export type HolidayFormState = { error?: string; success?: string };

function revalidate() {
  // 페이지 데이터는 캐시하지 않으므로 현재 경로만 다시 가져오면 된다
  refresh();
}

export async function addHoliday(
  _prev: HolidayFormState,
  formData: FormData,
): Promise<HolidayFormState> {
  await requireAdmin();

  const date = formData.get("date");
  const name = formData.get("name");
  if (!isDateString(date)) {
    return { error: "날짜 형식이 올바르지 않습니다." };
  }
  if (typeof name !== "string" || name.trim().length === 0 || name.trim().length > 30) {
    return { error: "이름은 1~30자로 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("holidays")
    .upsert({ date, name: name.trim() }, { onConflict: "date" });
  if (error) {
    return { error: `저장에 실패했습니다. (${error.message})` };
  }

  revalidate();
  return { success: `${date} ${name.trim()} 을(를) 저장했습니다.` };
}

export async function deleteHoliday(formData: FormData): Promise<void> {
  await requireAdmin();

  const date = formData.get("date");
  if (!isDateString(date)) {
    throw new Error("잘못된 요청입니다.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("holidays").delete().eq("date", date);
  if (error) {
    throw new Error(`삭제에 실패했습니다. (${error.message})`);
  }

  revalidate();
}
