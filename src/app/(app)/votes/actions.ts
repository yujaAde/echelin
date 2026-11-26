"use server";

import { refresh } from "next/cache";
import { requireApproved } from "@/lib/auth";
import {
  addMonths,
  candidateDates,
  isDateString,
  isMonthString,
  monthOf,
} from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";

export type VoteFormState = {
  error?: string;
  success?: string;
};

export async function saveVotes(
  _prev: VoteFormState,
  formData: FormData,
): Promise<VoteFormState> {
  const { user } = await requireApproved();

  const month = formData.get("month");
  if (!isMonthString(month)) {
    return { error: "잘못된 월입니다." };
  }

  // 불참을 고르면 날짜 선택은 무시하고 그 달의 날짜 투표를 모두 지운다
  const absent = formData.get("absent") === "1";
  const selected = absent
    ? []
    : formData
        .getAll("dates")
        .filter((d): d is string => isDateString(d) && monthOf(d) === month);

  const supabase = await createClient();

  // 후보일(토/일/공휴일)이 아닌 날짜는 버린다
  const { data: holidayRows, error: holidayError } = await supabase
    .from("holidays")
    .select("date, name")
    .gte("date", `${month}-01`)
    .lt("date", `${addMonths(month, 1)}-01`);
  if (holidayError) {
    return { error: `공휴일 정보를 불러오지 못했습니다. (${holidayError.message})` };
  }
  const holidays = new Map(holidayRows.map((h) => [h.date, h.name]));
  const allowed = new Set(candidateDates(month, holidays).map((c) => c.date));
  const dates = [...new Set(selected)].filter((d) => allowed.has(d));

  // 해당 월의 내 투표(날짜, 불참 표시)를 전부 지우고 다시 넣는다
  const [{ error: deleteVotesError }, { error: deleteAbsenceError }] = await Promise.all([
    supabase.from("votes").delete().eq("user_id", user.id).eq("month", month),
    supabase.from("vote_absences").delete().eq("user_id", user.id).eq("month", month),
  ]);
  const deleteError = deleteVotesError ?? deleteAbsenceError;
  if (deleteError) {
    return { error: `저장에 실패했습니다. (${deleteError.message})` };
  }

  if (absent) {
    const { error: insertError } = await supabase
      .from("vote_absences")
      .insert({ user_id: user.id, month });
    if (insertError) {
      return { error: `저장에 실패했습니다. (${insertError.message})` };
    }
    refresh();
    return { success: "이번 달은 불참으로 저장했습니다." };
  }

  if (dates.length > 0) {
    const { error: insertError } = await supabase
      .from("votes")
      .insert(dates.map((date) => ({ user_id: user.id, month, date })));
    if (insertError) {
      return { error: `저장에 실패했습니다. (${insertError.message})` };
    }
  }

  refresh();
  return {
    success:
      dates.length === 0
        ? "투표를 비웠습니다. 아직 투표하지 않은 것으로 표시됩니다. 참석이 어려우면 불참을 선택해 주세요."
        : `${dates.length}일을 참석 가능일로 저장했습니다.`,
  };
}
