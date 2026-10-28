import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { getSession } from "@/lib/auth";
import { SignupForm } from "./SignupForm";

export const metadata = { title: "회원가입 | E슐랭" };

export default function SignupPage() {
  return (
    <AuthCard title="회원가입">
      <Suspense fallback={<p className="text-center text-sm text-neutral-500">불러오는 중...</p>}>
        <SignupGate />
      </Suspense>
    </AuthCard>
  );
}

async function SignupGate() {
  const session = await getSession();
  if (session) redirect("/");
  return <SignupForm />;
}
