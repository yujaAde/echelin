import { Suspense } from "react";
import { listBox, pageTitle, sectionTitle } from "@/components/ui";
import { displayLoginId } from "@/lib/account";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { ApproveButton } from "./ApproveButton";
import { ResetPasswordButton } from "./ResetPasswordButton";

export const metadata = { title: "회원 관리 | E슐랭" };

export default function MembersPage() {
  return (
    <section className="space-y-8">
      <h1 className={pageTitle}>회원 관리</h1>
      <Suspense fallback={<p className="text-sm text-ink-soft">불러오는 중...</p>}>
        <MemberLists />
      </Suspense>
    </section>
  );
}

async function MemberLists() {
  const { user } = await requireAdmin();
  const supabase = await createClient();
  const [{ data, error }, loginIds] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: true }),
    loadLoginIds(),
  ]);

  if (error) {
    return <p className="text-sm text-danger">회원 목록을 불러오지 못했습니다. ({error.message})</p>;
  }

  const profiles = data ?? [];
  const pending = profiles.filter((p) => !p.approved);
  const approved = profiles.filter((p) => p.approved);

  return (
    <>
      <MemberList
        title="승인 기다리는 중"
        count={pending.length}
        emptyText="기다리는 회원이 없습니다."
        profiles={pending}
        loginIds={loginIds}
        currentUserId={user.id}
        highlight
      />
      <MemberList
        title="승인된 회원"
        count={approved.length}
        emptyText="승인된 회원이 없습니다."
        profiles={approved}
        loginIds={loginIds}
        currentUserId={user.id}
      />
    </>
  );
}

// 아이디는 auth.users.email 에만 있으므로 관리자 페이지에서만 service_role 로 읽는다.
async function loadLoginIds(): Promise<Map<string, string>> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error || !data) return new Map();
  return new Map(data.users.map((u) => [u.id, displayLoginId(u.email)]));
}

function MemberList({
  title,
  count,
  emptyText,
  profiles,
  loginIds,
  currentUserId,
  highlight,
}: {
  title: string;
  count: number;
  emptyText: string;
  profiles: Profile[];
  loginIds: Map<string, string>;
  currentUserId: string;
  highlight?: boolean;
}) {
  return (
    <div className="space-y-3">
      <h2 className={sectionTitle}>
        {title}{" "}
        <span
          className={`ml-1 inline-block rounded-md px-1.5 py-0.5 text-xs font-bold ${
            highlight && count > 0 ? "bg-accent text-on-accent" : "bg-surface-muted text-ink-soft"
          }`}
        >
          {count}
        </span>
      </h2>
      {profiles.length === 0 ? (
        <p className="text-sm text-ink-soft">{emptyText}</p>
      ) : (
        <ul className={listBox}>
          {profiles.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-semibold text-ink">
                  <span className="truncate">{p.nickname}</span>
                  {p.role === "admin" && (
                    <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-xs font-medium text-brand">
                      운영진
                    </span>
                  )}
                </p>
                <p className="flex flex-wrap gap-x-3 text-xs text-ink-faint">
                  <span className="text-ink-soft">{loginIds.get(p.id) ?? "(알 수 없음)"}</span>
                  <span>가입 {new Date(p.created_at).toLocaleDateString("ko-KR")}</span>
                </p>
              </div>
              {p.id === currentUserId ? (
                <span className="text-xs text-ink-faint">나</span>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <ApproveButton id={p.id} approved={p.approved} />
                  <ResetPasswordButton id={p.id} nickname={p.nickname} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
