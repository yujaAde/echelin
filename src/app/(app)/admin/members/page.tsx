import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { setApproved } from "./actions";

export const metadata = { title: "회원 관리 | 맛집탐방 소모임" };

export default function MembersPage() {
  return (
    <section className="space-y-8">
      <h1 className="text-2xl font-semibold">회원 관리</h1>
      <Suspense fallback={<p className="text-sm text-neutral-500">불러오는 중...</p>}>
        <MemberLists />
      </Suspense>
    </section>
  );
}

async function MemberLists() {
  const { user } = await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return <p className="text-sm text-red-700">회원 목록을 불러오지 못했습니다. ({error.message})</p>;
  }

  const profiles = data ?? [];
  const pending = profiles.filter((p) => !p.approved);
  const approved = profiles.filter((p) => p.approved);

  return (
    <>
      <MemberTable
        title={`승인 대기 (${pending.length})`}
        emptyText="승인 대기 중인 회원이 없습니다."
        profiles={pending}
        currentUserId={user.id}
      />
      <MemberTable
        title={`승인된 회원 (${approved.length})`}
        emptyText="승인된 회원이 없습니다."
        profiles={approved}
        currentUserId={user.id}
      />
    </>
  );
}

function MemberTable({
  title,
  emptyText,
  profiles,
  currentUserId,
}: {
  title: string;
  emptyText: string;
  profiles: Profile[];
  currentUserId: string;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">{title}</h2>
      {profiles.length === 0 ? (
        <p className="text-sm text-neutral-500">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-2 font-medium">닉네임</th>
                <th className="px-4 py-2 font-medium">역할</th>
                <th className="px-4 py-2 font-medium">가입일</th>
                <th className="px-4 py-2 text-right font-medium">작업</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="px-4 py-2">{p.nickname}</td>
                  <td className="px-4 py-2">{p.role === "admin" ? "관리자" : "회원"}</td>
                  <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">
                    {new Date(p.created_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {p.id === currentUserId ? (
                      <span className="text-xs text-neutral-500">본인</span>
                    ) : (
                      <ApproveButton id={p.id} approved={p.approved} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ApproveButton({ id, approved }: { id: string; approved: boolean }) {
  return (
    <form action={setApproved} className="inline">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="value" value={approved ? "false" : "true"} />
      <button
        type="submit"
        className={
          approved
            ? "rounded-md border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            : "rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
        }
      >
        {approved ? "승인 취소" : "승인"}
      </button>
    </form>
  );
}
