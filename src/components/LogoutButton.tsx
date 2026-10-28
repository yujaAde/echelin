import { logout } from "@/app/(auth)/actions";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logout}>
      <button
        type="submit"
        className={
          className ??
          "rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        }
      >
        로그아웃
      </button>
    </form>
  );
}
