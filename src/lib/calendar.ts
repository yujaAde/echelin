// 날짜는 항상 "YYYY-MM-DD", 월은 "YYYY-MM" 문자열로 다룬다.
// Date 객체는 UTC 기준으로만 만들어 서버 타임존에 영향받지 않게 한다.

export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
export const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function isMonthString(value: unknown): value is string {
  return typeof value === "string" && MONTH_RE.test(value);
}

export function isDateString(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function toDateString(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

// 한국 시간 기준 오늘 (서버가 어느 타임존이든 동일)
export function todayKST(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return toDateString(kst);
}

export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

export function formatMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${y}년 ${m}월`;
}

export function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function formatDateKo(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${m}월 ${d}일 (${WEEKDAY_LABELS[weekdayOf(date)]})`;
}

export type CandidateDate = {
  date: string;
  weekday: number;
  holidayName: string | null;
};

// 해당 월의 투표 후보일: 토요일, 일요일, 공휴일
export function candidateDates(
  month: string,
  holidays: ReadonlyMap<string, string>,
): CandidateDate[] {
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const result: CandidateDate[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${y}-${pad(m)}-${pad(day)}`;
    const weekday = weekdayOf(date);
    const holidayName = holidays.get(date) ?? null;
    if (weekday === 0 || weekday === 6 || holidayName) {
      result.push({ date, weekday, holidayName });
    }
  }
  return result;
}
