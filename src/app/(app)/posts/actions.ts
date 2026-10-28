"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { isMonthString } from "@/lib/calendar";
import { MAX_IMAGES_PER_POST } from "@/lib/image";
import { POST_IMAGES_BUCKET } from "@/lib/posts";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type PostFormState = { error?: string };
export type CommentFormState = { error?: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v.trim() : "";
}

function validatePostFields(formData: FormData) {
  const title = text(formData, "title");
  const body = typeof formData.get("body") === "string" ? (formData.get("body") as string) : "";
  const meetingMonth = text(formData, "meeting_month");
  const restaurantRaw = text(formData, "restaurant_id");
  const restaurantId = restaurantRaw === "" ? null : restaurantRaw;

  if (title.length < 1 || title.length > 100) {
    return { error: "제목은 1~100자로 입력해 주세요." } as const;
  }
  if (body.length > 5000) {
    return { error: "본문은 5000자 이하로 입력해 주세요." } as const;
  }
  if (!isMonthString(meetingMonth)) {
    return { error: "모임 월을 선택해 주세요." } as const;
  }
  if (restaurantId !== null && !UUID_RE.test(restaurantId)) {
    return { error: "맛집 선택이 올바르지 않습니다." } as const;
  }
  return { title, body: body.trim(), meetingMonth, restaurantId } as const;
}

export async function createPost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const { user } = await requireApproved();

  const fields = validatePostFields(formData);
  if ("error" in fields) return { error: fields.error };

  // 브라우저가 Storage 에 먼저 올린 경로들. 반드시 내 폴더여야 한다.
  const pathRe = new RegExp(`^${user.id}/[0-9a-f-]{36}\\.jpg$`, "i");
  const paths = formData
    .getAll("images")
    .filter((p): p is string => typeof p === "string" && pathRe.test(p));
  if (paths.length > MAX_IMAGES_PER_POST) {
    return { error: `사진은 최대 ${MAX_IMAGES_PER_POST}장까지 올릴 수 있습니다.` };
  }

  const supabase = await createClient();
  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      title: fields.title,
      body: fields.body,
      meeting_month: fields.meetingMonth,
      restaurant_id: fields.restaurantId,
    })
    .select("id")
    .single();
  if (postError || !post) {
    return { error: `글 저장에 실패했습니다. (${postError?.message ?? "알 수 없는 오류"})` };
  }

  if (paths.length > 0) {
    const { error: imageError } = await supabase.from("post_images").insert(
      paths.map((storage_path, i) => ({ post_id: post.id, storage_path, sort_order: i })),
    );
    if (imageError) {
      await supabase.from("posts").delete().eq("id", post.id);
      return { error: `사진 정보 저장에 실패했습니다. (${imageError.message})` };
    }
  }

  revalidatePath("/posts");
  redirect(`/posts/${post.id}`);
}

export async function updatePost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  await requireApproved();

  const id = text(formData, "id");
  if (!UUID_RE.test(id)) return { error: "잘못된 요청입니다." };

  const fields = validatePostFields(formData);
  if ("error" in fields) return { error: fields.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .update({
      title: fields.title,
      body: fields.body,
      meeting_month: fields.meetingMonth,
      restaurant_id: fields.restaurantId,
    })
    .eq("id", id)
    .select("id");
  if (error) return { error: `수정에 실패했습니다. (${error.message})` };
  if (!data || data.length === 0) return { error: "수정 권한이 없거나 글이 없습니다." };

  revalidatePath("/posts");
  revalidatePath(`/posts/${id}`);
  redirect(`/posts/${id}`);
}

export async function deletePost(formData: FormData): Promise<void> {
  const { user, profile } = await requireApproved();

  const id = text(formData, "id");
  if (!UUID_RE.test(id)) throw new Error("잘못된 요청입니다.");

  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("id, author_id")
    .eq("id", id)
    .maybeSingle();
  if (!post) throw new Error("글을 찾을 수 없습니다.");

  const isOwner = post.author_id === user.id;
  if (!isOwner && profile.role !== "admin") throw new Error("삭제 권한이 없습니다.");

  const { data: images } = await supabase
    .from("post_images")
    .select("storage_path")
    .eq("post_id", id);
  const paths = (images ?? []).map((i) => i.storage_path);

  // Storage 객체는 cascade 되지 않으므로 직접 지운다.
  // 관리자가 남의 글을 지울 때는 Storage 정책상 본인 폴더가 아니라 service_role 이 필요하다.
  if (paths.length > 0) {
    const storage = isOwner ? supabase.storage : createAdminClient().storage;
    await storage.from(POST_IMAGES_BUCKET).remove(paths);
  }

  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw new Error(`삭제에 실패했습니다. (${error.message})`);

  revalidatePath("/posts");
  redirect("/posts");
}

export async function addComment(
  _prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const { user } = await requireApproved();

  const postId = text(formData, "post_id");
  const body = text(formData, "body");
  if (!UUID_RE.test(postId)) return { error: "잘못된 요청입니다." };
  if (body.length < 1 || body.length > 1000) {
    return { error: "댓글은 1~1000자로 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: user.id, body });
  if (error) return { error: `댓글 저장에 실패했습니다. (${error.message})` };

  revalidatePath(`/posts/${postId}`);
  revalidatePath("/posts");
  return {};
}

export async function deleteComment(formData: FormData): Promise<void> {
  await requireApproved();

  const id = text(formData, "id");
  const postId = text(formData, "post_id");
  if (!UUID_RE.test(id) || !UUID_RE.test(postId)) throw new Error("잘못된 요청입니다.");

  const supabase = await createClient();
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw new Error(`댓글 삭제에 실패했습니다. (${error.message})`);

  revalidatePath(`/posts/${postId}`);
  revalidatePath("/posts");
}
