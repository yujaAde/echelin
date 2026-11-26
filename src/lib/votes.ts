import type { SupabaseClient } from "@supabase/supabase-js";
import { addMonths, candidateDates, type CandidateDate } from "@/lib/calendar";
import type { Database, VoteRound } from "@/types/database";

type Client = SupabaseClient<Database>;

export const MAX_PLACE_VOTES = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 한 달의 진행 단계
//  date     : 날짜 투표 중
//  nominate : 날짜 확정, 맛집 추천 받는 중 (투표는 아직)
//  place    : 맛집 투표 중 (추천도 계속 가능)
//  ended    : 지난 달. 결과만 보여 준다
export type Phase = "date" | "nominate" | "place" | "ended";

export const PHASE_LABEL: Record<Phase, string> = {
  date: "날짜 투표 중",
  nominate: "맛집 추천 중",
  place: "맛집 투표 중",
  ended: "지난 모임",
};

export type RoundState = {
  phase: Phase;
  dateDeadline: string; // ISO. 날짜 투표 마감 예정 시각
  dateClosedAt: string | null; // ISO. 실제 마감된 시각 (전원 응답 또는 관리자)
  placeOpensAt: string; // ISO. 맛집 투표 시작 시각 (추천 마감)
  nominationDays: number;
  hasCustomDeadline: boolean;
  hasCustomOpensAt: boolean;
};

// 기본 마감: 모임 전달 말일 23:59:59 (한국 시간) = 모임 달 1일 0시 직전
export function defaultDateDeadline(month: string): Date {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1, 0, 0, 0) - KST_OFFSET_MS - 1000);
}

export function computeRound(
  round: VoteRound | null,
  month: string,
  currentMonth: string,
  nowMs = Date.now(),
): RoundState {
  const dateDeadline = round?.date_deadline ? new Date(round.date_deadline) : defaultDateDeadline(month);
  const closedAt = round?.date_closed_at ? new Date(round.date_closed_at) : null;
  const nominationDays = round?.nomination_days ?? 3;
  const closeTime = closedAt ?? dateDeadline;
  const placeOpens = round?.place_vote_opens_at
    ? new Date(round.place_vote_opens_at)
    : new Date(closeTime.getTime() + nominationDays * DAY_MS);

  let phase: Phase;
  if (month < currentMonth) phase = "ended";
  else if (closedAt === null && nowMs < dateDeadline.getTime()) phase = "date";
  else if (nowMs < placeOpens.getTime()) phase = "nominate";
  else phase = "place";

  return {
    phase,
    dateDeadline: dateDeadline.toISOString(),
    dateClosedAt: closedAt?.toISOString() ?? null,
    placeOpensAt: placeOpens.toISOString(),
    nominationDays,
    hasCustomDeadline: !!round?.date_deadline,
    hasCustomOpensAt: !!round?.place_vote_opens_at,
  };
}

export async function loadRound(supabase: Client, month: string): Promise<VoteRound | null> {
  const { data } = await supabase.from("vote_rounds").select("*").eq("month", month).maybeSingle();
  return data ?? null;
}

export type TallyRow = CandidateDate & { voters: string[] };

export type PlaceCandidate = {
  nominationId: string;
  restaurantId: string;
  name: string;
  address: string | null;
  nominatedBy: string | null;
  nominatorName: string;
  voters: string[];
};

export type VoteSummary = {
  month: string;
  round: RoundState;
  candidates: CandidateDate[];
  tally: TallyRow[]; // 많이 고른 날짜 순
  topCount: number;
  leaders: TallyRow[]; // 최다 득표 날짜들
  members: { id: string; nickname: string }[];
  participantCount: number; // 날짜를 고르거나 불참을 고른 회원 수
  absentees: { id: string; nickname: string }[];
  notVoted: { id: string; nickname: string }[];
  mySelected: string[];
  myAbsent: boolean;
  places: PlaceCandidate[]; // 표 많은 순
  placeTopCount: number;
  placeParticipantCount: number;
  myPlaceVotes: string[]; // restaurant id
  nominatable: { id: string; name: string }[]; // 아직 후보에 없는 저장된 맛집
};

// 한 달치 진행 현황. 투표 페이지와 홈 화면이 함께 쓴다.
export async function loadVoteSummary(
  supabase: Client,
  month: string,
  userId: string,
  currentMonth: string,
): Promise<{ data: VoteSummary } | { error: string }> {
  const [holidayRes, voteRes, absenceRes, memberRes, roundRes, nomRes, placeVoteRes, restaurantRes] =
    await Promise.all([
      supabase
        .from("holidays")
        .select("date, name")
        .gte("date", `${month}-01`)
        .lt("date", `${addMonths(month, 1)}-01`),
      supabase.from("votes").select("user_id, date").eq("month", month),
      supabase.from("vote_absences").select("user_id").eq("month", month),
      supabase.from("profiles").select("id, nickname").eq("approved", true).order("nickname"),
      supabase.from("vote_rounds").select("*").eq("month", month).maybeSingle(),
      supabase
        .from("place_nominations")
        .select("id, restaurant_id, nominated_by, created_at")
        .eq("month", month)
        .order("created_at"),
      supabase.from("place_votes").select("user_id, restaurant_id").eq("month", month),
      supabase.from("restaurants").select("id, name, address").order("name"),
    ]);

  const error =
    holidayRes.error ??
    voteRes.error ??
    absenceRes.error ??
    memberRes.error ??
    roundRes.error ??
    nomRes.error ??
    placeVoteRes.error ??
    restaurantRes.error;
  if (error) return { error: error.message };

  const holidays = new Map((holidayRes.data ?? []).map((h) => [h.date, h.name]));
  const candidates = candidateDates(month, holidays);
  const votes = voteRes.data ?? [];
  const members = memberRes.data ?? [];
  const nicknameOf = new Map(members.map((m) => [m.id, m.nickname]));
  const nameOf = (id: string | null) =>
    id === null ? "(탈퇴한 회원)" : (nicknameOf.get(id) ?? "(알 수 없음)");

  const absentIds = new Set((absenceRes.data ?? []).map((a) => a.user_id));

  const votersByDate = new Map<string, string[]>();
  for (const v of votes) {
    const list = votersByDate.get(v.date) ?? [];
    list.push(nameOf(v.user_id));
    votersByDate.set(v.date, list);
  }
  const tally = candidates
    .map((c) => ({ ...c, voters: (votersByDate.get(c.date) ?? []).sort() }))
    .sort((a, b) => b.voters.length - a.voters.length || a.date.localeCompare(b.date));
  const topCount = tally[0]?.voters.length ?? 0;
  const leaders = topCount > 0 ? tally.filter((t) => t.voters.length === topCount) : [];

  const votedIds = new Set([...votes.map((v) => v.user_id), ...absentIds]);

  // 맛집 추천·투표
  const restaurants = restaurantRes.data ?? [];
  const restaurantOf = new Map(restaurants.map((r) => [r.id, r]));
  const placeVotes = placeVoteRes.data ?? [];
  const votersByPlace = new Map<string, string[]>();
  for (const v of placeVotes) {
    const list = votersByPlace.get(v.restaurant_id) ?? [];
    list.push(nameOf(v.user_id));
    votersByPlace.set(v.restaurant_id, list);
  }
  const nominations = nomRes.data ?? [];
  const places: PlaceCandidate[] = nominations
    .map((n) => {
      const r = restaurantOf.get(n.restaurant_id);
      return {
        nominationId: n.id,
        restaurantId: n.restaurant_id,
        name: r?.name ?? "(삭제된 맛집)",
        address: r?.address ?? null,
        nominatedBy: n.nominated_by,
        nominatorName: nameOf(n.nominated_by),
        voters: (votersByPlace.get(n.restaurant_id) ?? []).sort(),
      };
    })
    .sort((a, b) => b.voters.length - a.voters.length);
  const nominatedIds = new Set(nominations.map((n) => n.restaurant_id));

  return {
    data: {
      month,
      round: computeRound(roundRes.data ?? null, month, currentMonth),
      candidates,
      tally,
      topCount,
      leaders,
      members,
      participantCount: votedIds.size,
      absentees: members.filter((m) => absentIds.has(m.id)),
      notVoted: members.filter((m) => !votedIds.has(m.id)),
      mySelected: votes.filter((v) => v.user_id === userId).map((v) => v.date),
      myAbsent: absentIds.has(userId),
      places,
      placeTopCount: places[0]?.voters.length ?? 0,
      placeParticipantCount: new Set(placeVotes.map((v) => v.user_id)).size,
      myPlaceVotes: placeVotes.filter((v) => v.user_id === userId).map((v) => v.restaurant_id),
      nominatable: restaurants
        .filter((r) => !nominatedIds.has(r.id))
        .map((r) => ({ id: r.id, name: r.name })),
    },
  };
}

// datetime-local 입력값("YYYY-MM-DDTHH:mm")을 한국 시간으로 해석해 ISO 로
export function kstInputToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const d = new Date(`${value}:00+09:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// ISO → datetime-local 입력값(한국 시간)
export function isoToKstInput(iso: string): string {
  return new Date(new Date(iso).getTime() + KST_OFFSET_MS).toISOString().slice(0, 16);
}
