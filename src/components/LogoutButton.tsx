import { logout } from "@/app/(auth)/actions";
import { btnSmall } from "@/components/ui";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logout}>
      <button type="submit" className={className ?? btnSmall}>
        로그아웃
      </button>
    </form>
  );
}
