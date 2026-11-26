import type { SupabaseClient } from "@supabase/supabase-js";
import { addMonths, candidateDates, type CandidateDate } from "@/lib/calendar";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export type TallyRow = CandidateDate & { voters: string[] };

export type VoteSummary = {
  month: string;
  candidates: CandidateDate[];
  tally: TallyRow[]; // 많이 고른 날짜 순
  topCount: number;
  members: { id: string; nickname: string }[];
  participantCount: number; // 날짜를 고르거나 불참을 고른 회원 수
  absentees: { id: string; nickname: string }[];
  notVoted: { id: string; nickname: string }[];
  mySelected: string[];
  myAbsent: boolean;
};

// 한 달치 투표 현황. 투표 페이지와 홈 화면이 함께 쓴다.
export async function loadVoteSummary(
  supabase: Client,
  month: string,
  userId: string,
): Promise<{ data: VoteSummary } | { error: string }> {
  const [holidayRes, voteRes, absenceRes, memberRes] = await Promise.all([
    supabase
      .from("holidays")
      .select("date, name")
      .gte("date", `${month}-01`)
      .lt("date", `${addMonths(month, 1)}-01`),
    supabase.from("votes").select("user_id, date").eq("month", month),
    supabase.from("vote_absences").select("user_id").eq("month", month),
    supabase.from("profiles").select("id, nickname").eq("approved", true).order("nickname"),
  ]);

  const error = holidayRes.error ?? voteRes.error ?? absenceRes.error ?? memberRes.error;
  if (error) return { error: error.message };

  const holidays = new Map((holidayRes.data ?? []).map((h) => [h.date, h.name]));
  const candidates = candidateDates(month, holidays);
  const votes = voteRes.data ?? [];
  const members = memberRes.data ?? [];
  const nicknameOf = new Map(members.map((m) => [m.id, m.nickname]));

  const absentIds = new Set((absenceRes.data ?? []).map((a) => a.user_id));

  const votersByDate = new Map<string, string[]>();
  for (const v of votes) {
    const list = votersByDate.get(v.date) ?? [];
    list.push(nicknameOf.get(v.user_id) ?? "(탈퇴)");
    votersByDate.set(v.date, list);
  }
  const tally = candidates
    .map((c) => ({ ...c, voters: (votersByDate.get(c.date) ?? []).sort() }))
    .sort((a, b) => b.voters.length - a.voters.length || a.date.localeCompare(b.date));

  const votedIds = new Set([...votes.map((v) => v.user_id), ...absentIds]);

  return {
    data: {
      month,
      candidates,
      tally,
      topCount: tally[0]?.voters.length ?? 0,
      members,
      participantCount: votedIds.size,
      absentees: members.filter((m) => absentIds.has(m.id)),
      notVoted: members.filter((m) => !votedIds.has(m.id)),
      mySelected: votes.filter((v) => v.user_id === userId).map((v) => v.date),
      myAbsent: absentIds.has(userId),
    },
  };
}
