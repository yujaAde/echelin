import { Suspense } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { btnSmallDanger, listBox, pageTitle, sectionTitle } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatDateKo, todayKST } from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";
import { deleteHoliday } from "./actions";
import { HolidayForm } from "./HolidayForm";

export const metadata = { title: "공휴일 관리 | E슐랭" };

export default function HolidaysPage() {
  return (
    <section className="space-y-8">
      <div className="space-y-1">
        <h1 className={pageTitle}>공휴일 관리</h1>
        <p className="text-sm text-ink-soft">
          여기 넣은 날짜는 투표 후보에 오릅니다. 토요일과 일요일은 자동으로 들어가니 평일
          공휴일과 대체공휴일만 관리하면 됩니다.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-ink-soft">불러오는 중...</p>}>
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
    return <p className="text-sm text-danger">공휴일 목록을 불러오지 못했습니다. ({error.message})</p>;
  }

  const today = todayKST();
  const upcoming = data.filter((h) => h.date >= today);
  const past = data.filter((h) => h.date < today);

  return (
    <div className="space-y-8">
      <HolidayForm />
      <HolidayTable title="다가오는 공휴일" rows={upcoming} />
      {past.length > 0 && <HolidayTable title="지난 공휴일" rows={past} muted />}
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
      <div className="flex items-baseline justify-between gap-3">
        <h2 className={sectionTitle}>{title}</h2>
        <span className="text-sm text-ink-soft">{rows.length}일</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-soft">등록된 공휴일이 없습니다.</p>
      ) : (
        <ul className={listBox}>
          {rows.map((h) => (
            <li key={h.date} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
              <div className="flex flex-col sm:flex-row sm:gap-4">
                <span className="w-40 font-semibold text-ink">
                  {h.date.slice(0, 4)}년 {formatDateKo(h.date)}
                </span>
                <span className="text-ink-soft">{h.name}</span>
              </div>
              <ConfirmButton
                action={deleteHoliday}
                hidden={{ date: h.date }}
                message={`${h.name}(${h.date})을 공휴일에서 뺄까요?`}
                className={btnSmallDanger}
              >
                삭제
              </ConfirmButton>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
