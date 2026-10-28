import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "로그인 | E슐랭" };

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <AuthCard title="로그인">
      <Suspense fallback={<p className="text-center text-sm text-neutral-500">불러오는 중...</p>}>
        <LoginGate searchParams={props.searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function LoginGate({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const session = await getSession();
  if (session) redirect("/");

  const { error } = await searchParams;
  const initialError =
    error === "link"
      ? "확인 링크가 만료되었거나 올바르지 않습니다. 다시 로그인하거나 가입을 시도해 주세요."
      : undefined;

  return <LoginForm initialError={initialError} />;
}
