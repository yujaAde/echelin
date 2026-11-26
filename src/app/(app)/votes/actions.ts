"use server";

import { refresh } from "next/cache";
import { requireAdmin, requireApproved } from "@/lib/auth";
import {
  addMonths,
  candidateDates,
  isDateString,
  isMonthString,
  monthOf,
  todayKST,
} from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";
import { computeRound, kstInputToIso, loadRound, MAX_PLACE_VOTES, type Phase } from "@/lib/votes";

export type VoteFormState = {
  error?: string;
  success?: string;
};

type Result = { error?: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v.trim() : "";
}

async function currentPhase(
  supabase: Awaited<ReturnType<typeof createClient>>,
  month: string,
): Promise<Phase> {
  const round = await loadRound(supabase, month);
  return computeRound(round, month, monthOf(todayKST())).phase;
}

// ---------------------------------------------------------------------------
// 날짜 투표
// ---------------------------------------------------------------------------
export async function saveVotes(
  _prev: VoteFormState,
  formData: FormData,
): Promise<VoteFormState> {
  const { user } = await requireApproved();

  const month = formData.get("month");
  if (!isMonthString(month)) {
    return { error: "잘못된 월입니다." };
  }

  const supabase = await createClient();
  if ((await currentPhase(supabase, month)) !== "date") {
    return { error: "날짜 투표가 마감되었습니다. 화면을 새로고침해 주세요." };
  }

  // 불참을 고르면 날짜 선택은 무시하고 그 달의 날짜 투표를 모두 지운다
  const absent = formData.get("absent") === "1";
  const selected = absent
    ? []
    : formData
        .getAll("dates")
        .filter((d): d is string => isDateString(d) && monthOf(d) === month);

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
  } else if (dates.length > 0) {
    const { error: insertError } = await supabase
      .from("votes")
      .insert(dates.map((date) => ({ user_id: user.id, month, date })));
    if (insertError) {
      return { error: `저장에 실패했습니다. (${insertError.message})` };
    }
  }

  // 전원이 답했으면 날짜 투표를 바로 마감한다
  const { data: closed } = await supabase.rpc("close_date_vote_if_complete", {
    target_month: month,
  });

  refresh();
  const saved = absent
    ? "이번 달은 불참으로 저장했습니다."
    : dates.length === 0
      ? "투표를 비웠습니다. 아직 투표하지 않은 것으로 표시됩니다. 참석이 어려우면 불참을 선택해 주세요."
      : `${dates.length}일을 참석 가능일로 저장했습니다.`;
  return {
    success: closed ? `${saved} 모두 답해서 날짜 투표가 마감됐어요. 이제 맛집을 추천해 주세요.` : saved,
  };
}

// ---------------------------------------------------------------------------
// 맛집 추천
// ---------------------------------------------------------------------------
export async function nominatePlace(
  _prev: VoteFormState,
  formData: FormData,
): Promise<VoteFormState> {
  const { user } = await requireApproved();

  const month = text(formData, "month");
  const restaurantId = text(formData, "restaurant_id");
  if (!isMonthString(month) || !UUID_RE.test(restaurantId)) {
    return { error: "맛집을 골라 주세요." };
  }

  const supabase = await createClient();
  const phase = await currentPhase(supabase, month);
  if (phase === "date") return { error: "날짜 투표가 끝난 뒤에 추천할 수 있어요." };
  if (phase === "ended") return { error: "지난 달에는 추천할 수 없어요." };

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name")
    .eq("id", restaurantId)
    .maybeSingle();
  if (!restaurant) return { error: "저장된 맛집에서만 고를 수 있어요. 맛집 지도에서 먼저 저장해 주세요." };

  const { error } = await supabase
    .from("place_nominations")
    .insert({ month, restaurant_id: restaurantId, nominated_by: user.id });
  if (error) {
    if (error.code === "23505") return { error: `${restaurant.name}은(는) 이미 후보에 있어요.` };
    return { error: `추천하지 못했습니다. (${error.message})` };
  }

  refresh();
  return { success: `${restaurant.name}을(를) 후보에 올렸어요.` };
}

export async function removeNomination(formData: FormData): Promise<Result> {
  const { user, profile } = await requireApproved();

  const id = text(formData, "id");
  if (!UUID_RE.test(id)) return { error: "잘못된 요청입니다." };

  const supabase = await createClient();
  const { data: nomination } = await supabase
    .from("place_nominations")
    .select("id, month, restaurant_id, nominated_by")
    .eq("id", id)
    .maybeSingle();
  if (!nomination) return { error: "후보를 찾을 수 없습니다." };

  const isAdmin = profile.role === "admin";
  if (nomination.nominated_by !== user.id && !isAdmin) return { error: "내가 올린 후보만 뺄 수 있어요." };
  if ((await currentPhase(supabase, nomination.month)) === "ended") {
    return { error: "지난 달 후보는 바꿀 수 없어요." };
  }

  const { count } = await supabase
    .from("place_votes")
    .select("id", { count: "exact", head: true })
    .eq("month", nomination.month)
    .eq("restaurant_id", nomination.restaurant_id);
  if ((count ?? 0) > 0) {
    if (!isAdmin) return { error: "이미 표를 받은 후보는 뺄 수 없어요. 운영진에게 요청해 주세요." };
    const { error: voteError } = await supabase
      .from("place_votes")
      .delete()
      .eq("month", nomination.month)
      .eq("restaurant_id", nomination.restaurant_id);
    if (voteError) return { error: `표를 정리하지 못했습니다. (${voteError.message})` };
  }

  const { error } = await supabase.from("place_nominations").delete().eq("id", id);
  if (error) return { error: `빼지 못했습니다. (${error.message})` };

  refresh();
  return {};
}

// ---------------------------------------------------------------------------
// 맛집 투표
// ---------------------------------------------------------------------------
export async function savePlaceVotes(
  _prev: VoteFormState,
  formData: FormData,
): Promise<VoteFormState> {
  const { user } = await requireApproved();

  const month = text(formData, "month");
  if (!isMonthString(month)) return { error: "잘못된 월입니다." };

  const supabase = await createClient();
  const phase = await currentPhase(supabase, month);
  if (phase !== "place") return { error: "지금은 맛집 투표 기간이 아니에요." };

  const picked = [
    ...new Set(
      formData.getAll("restaurant_ids").filter((v): v is string => typeof v === "string" && UUID_RE.test(v)),
    ),
  ];
  if (picked.length > MAX_PLACE_VOTES) {
    return { error: `최대 ${MAX_PLACE_VOTES}곳까지 고를 수 있어요.` };
  }

  const { data: nominations } = await supabase
    .from("place_nominations")
    .select("restaurant_id")
    .eq("month", month);
  const nominated = new Set((nominations ?? []).map((n) => n.restaurant_id));
  const ids = picked.filter((id) => nominated.has(id));

  const { error: deleteError } = await supabase
    .from("place_votes")
    .delete()
    .eq("user_id", user.id)
    .eq("month", month);
  if (deleteError) return { error: `저장에 실패했습니다. (${deleteError.message})` };

  if (ids.length > 0) {
    const { error: insertError } = await supabase
      .from("place_votes")
      .insert(ids.map((restaurant_id) => ({ user_id: user.id, month, restaurant_id })));
    if (insertError) return { error: `저장에 실패했습니다. (${insertError.message})` };
  }

  refresh();
  return {
    success: ids.length === 0 ? "맛집 투표를 비웠습니다." : `${ids.length}곳에 투표했습니다.`,
  };
}

// ---------------------------------------------------------------------------
// 운영진: 진행 단계 조정
// ---------------------------------------------------------------------------
export async function closeDateVoteNow(formData: FormData): Promise<Result> {
  await requireAdmin();
  const month = text(formData, "month");
  if (!isMonthString(month)) return { error: "잘못된 월입니다." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("vote_rounds")
    .upsert({ month, date_closed_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  if (error) return { error: `마감하지 못했습니다. (${error.message})` };
  refresh();
  return {};
}

export async function reopenDateVote(formData: FormData): Promise<Result> {
  await requireAdmin();
  const month = text(formData, "month");
  if (!isMonthString(month)) return { error: "잘못된 월입니다." };

  const supabase = await createClient();
  const round = await loadRound(supabase, month);
  const state = computeRound(round, month, monthOf(todayKST()));
  // 기한이 이미 지났으면 일주일 뒤로 늘려 다시 받는다
  const deadline =
    new Date(state.dateDeadline).getTime() > Date.now()
      ? (round?.date_deadline ?? null)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("vote_rounds").upsert({
    month,
    date_closed_at: null,
    date_deadline: deadline,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: `다시 열지 못했습니다. (${error.message})` };
  refresh();
  return {};
}

export async function openPlaceVoteNow(formData: FormData): Promise<Result> {
  await requireAdmin();
  const month = text(formData, "month");
  if (!isMonthString(month)) return { error: "잘못된 월입니다." };

  const supabase = await createClient();
  const { error } = await supabase.from("vote_rounds").upsert({
    month,
    place_vote_opens_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: `투표를 열지 못했습니다. (${error.message})` };
  refresh();
  return {};
}

export async function updateRoundSchedule(
  _prev: VoteFormState,
  formData: FormData,
): Promise<VoteFormState> {
  await requireAdmin();
  const month = text(formData, "month");
  if (!isMonthString(month)) return { error: "잘못된 월입니다." };

  const deadlineRaw = text(formData, "date_deadline");
  const opensRaw = text(formData, "place_vote_opens_at");
  const dateDeadline = deadlineRaw ? kstInputToIso(deadlineRaw) : null;
  const placeOpens = opensRaw ? kstInputToIso(opensRaw) : null;
  if (deadlineRaw && !dateDeadline) return { error: "날짜 투표 마감 시각이 올바르지 않습니다." };
  if (opensRaw && !placeOpens) return { error: "맛집 투표 시작 시각이 올바르지 않습니다." };
  if (dateDeadline && placeOpens && placeOpens < dateDeadline) {
    return { error: "맛집 투표 시작은 날짜 투표 마감 뒤여야 합니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("vote_rounds").upsert({
    month,
    date_deadline: dateDeadline,
    place_vote_opens_at: placeOpens,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: `저장하지 못했습니다. (${error.message})` };
  refresh();
  return { success: "일정을 저장했습니다." };
}
