"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function setApproved(formData: FormData): Promise<void> {
  await requireAdmin();

  const targetId = formData.get("id");
  const value = formData.get("value");
  if (typeof targetId !== "string" || (value !== "true" && value !== "false")) {
    throw new Error("잘못된 요청입니다.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_profile_approved", {
    target_id: targetId,
    value: value === "true",
  });
  if (error) {
    throw new Error(`승인 상태 변경에 실패했습니다. (${error.message})`);
  }

  revalidatePath("/admin/members");
}
