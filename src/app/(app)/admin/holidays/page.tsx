import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { formatDateKo, todayKST } from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";
import { deleteHoliday } from "./actions";
import { HolidayForm } from "./HolidayForm";

export const metadata = { title: "공휴일 관리 | E슐랭" };

export default function HolidaysPage() {
  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">공휴일 관리</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          여기 등록된 날짜는 투표 후보일에 포함됩니다. 토요일과 일요일은 자동으로 포함되므로
          평일 공휴일과 대체공휴일만 관리하면 됩니다.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-neutral-500">불러오는 중...</p>}>
        <HolidayList />
      </Suspense>
    </section>
  );
}

async function HolidayList() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from("holidays").select("*").order("date");
  if (error) {
    return (
      <p className="text-sm text-red-700">
        공휴일 목록을 불러오지 못했습니다. ({error.message})
      </p>
    );
  }

  const today = todayKST();
  const upcoming = data.filter((h) => h.date >= today);
  const past = data.filter((h) => h.date < today);

  return (
    <div className="space-y-8">
      <HolidayForm />
      <HolidayTable title={`예정된 공휴일 (${upcoming.length})`} rows={upcoming} />
      {past.length > 0 && (
        <HolidayTable title={`지난 공휴일 (${past.length})`} rows={past} muted />
      )}
    </div>
  );
}

function HolidayTable({
  title,
  rows,
  muted,
}: {
  title: string;
  rows: { date: string; name: string }[];
  muted?: boolean;
}) {
  return (
    <div className={`space-y-3 ${muted ? "opacity-60" : ""}`}>
      <h2 className="text-lg font-medium">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">등록된 공휴일이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {rows.map((h) => (
            <li
              key={h.date}
              className="flex items-center justify-between gap-4 px-4 py-2 text-sm"
            >
              <div className="flex flex-col sm:flex-row sm:gap-4">
                <span className="w-36 font-medium">
                  {h.date.slice(0, 4)}년 {formatDateKo(h.date)}
                </span>
                <span className="text-neutral-600 dark:text-neutral-400">{h.name}</span>
              </div>
              <form action={deleteHoliday}>
                <input type="hidden" name="date" value={h.date} />
                <button
                  type="submit"
                  className="rounded-md border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  삭제
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
