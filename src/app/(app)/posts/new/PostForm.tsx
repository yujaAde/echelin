"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { buttonClass, inputClass } from "@/components/AuthCard";
import { FormMessage } from "@/components/FormMessage";
import { isSupportedImage, MAX_IMAGES_PER_POST, resizeImage } from "@/lib/image";
import { POST_IMAGES_BUCKET } from "@/lib/posts";
import { createClient } from "@/lib/supabase/client";
import { createPost, type PostFormState } from "../actions";

type Picked = { id: string; file: File; preview: string };

export function PostForm({
  userId,
  defaultMonth,
  restaurants,
}: {
  userId: string;
  defaultMonth: string;
  restaurants: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<PostFormState, FormData>(createPost, {});
  const [picked, setPicked] = useState<Picked[]>([]);
  const [uploadError, setUploadError] = useState<string>();
  const [progress, setProgress] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const pickedRef = useRef<Picked[]>([]);

  useEffect(() => {
    pickedRef.current = picked;
  }, [picked]);

  // 언마운트 시에만 남은 미리보기 URL 을 해제한다
  useEffect(() => {
    const ref = pickedRef;
    return () => ref.current.forEach((p) => URL.revokeObjectURL(p.preview));
  }, []);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setUploadError(undefined);
    const next = [...picked];
    for (const file of Array.from(list)) {
      if (!isSupportedImage(file)) {
        setUploadError(`${file.name} 은(는) 지원하지 않는 형식입니다. (jpg, png, webp)`);
        continue;
      }
      if (next.length >= MAX_IMAGES_PER_POST) {
        setUploadError(`사진은 최대 ${MAX_IMAGES_PER_POST}장까지 올릴 수 있습니다.`);
        break;
      }
      next.push({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) });
    }
    setPicked(next);
  }

  function removeFile(id: string) {
    setPicked((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((p) => p.id !== id);
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setUploadError(undefined);
    setUploading(true);

    const paths: string[] = [];
    try {
      const supabase = createClient();
      for (let i = 0; i < picked.length; i++) {
        setProgress(`사진 업로드 중 (${i + 1}/${picked.length})`);
        const blob = await resizeImage(picked[i].file);
        const path = `${userId}/${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage
          .from(POST_IMAGES_BUCKET)
          .upload(path, blob, { contentType: "image/jpeg", upsert: false });
        if (error) throw new Error(`사진 업로드에 실패했습니다. (${error.message})`);
        paths.push(path);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "사진 업로드에 실패했습니다.");
      setUploading(false);
      setProgress(undefined);
      return;
    }

    setProgress("글 저장 중...");
    const fd = new FormData(form);
    fd.delete("images");
    paths.forEach((p) => fd.append("images", p));
    startTransition(() => formAction(fd));
    setUploading(false);
    setProgress(undefined);
  }

  const busy = uploading || pending;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      <FormMessage error={uploadError ?? state.error} />

      <div className="space-y-1">
        <label htmlFor="title" className="text-sm font-medium">제목</label>
        <input id="title" name="title" type="text" maxLength={100} required className={inputClass} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="meeting_month" className="text-sm font-medium">모임 월</label>
          <input id="meeting_month" name="meeting_month" type="month" defaultValue={defaultMonth} required className={inputClass} />
        </div>
        {restaurants.length > 0 && (
          <div className="space-y-1">
            <label htmlFor="restaurant_id" className="text-sm font-medium">방문한 맛집 (선택)</label>
            <select id="restaurant_id" name="restaurant_id" defaultValue="" className={inputClass}>
              <option value="">선택 안 함</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="body" className="text-sm font-medium">내용</label>
        <textarea id="body" name="body" rows={8} maxLength={5000} className={inputClass} />
      </div>

      <div className="space-y-2">
        <label htmlFor="images" className="text-sm font-medium">
          사진 <span className="font-normal text-neutral-500">(최대 {MAX_IMAGES_PER_POST}장, 업로드 전 자동으로 줄입니다)</span>
        </label>
        <input
          id="images"
          type="file"
          accept="image/*"
          multiple
          disabled={busy}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
          className="block text-sm"
        />
        {picked.length > 0 && (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {picked.map((p, i) => (
              <li key={p.id} className="relative aspect-square overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.preview} alt="" className="h-full w-full object-cover" />
                <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 text-xs text-white">{i + 1}</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => removeFile(p.id)}
                  className="absolute right-1 top-1 rounded bg-black/60 px-1.5 text-xs text-white hover:bg-black/80"
                  aria-label="사진 제거"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button type="submit" disabled={busy} className={buttonClass}>
        {progress ?? (busy ? "저장 중..." : "후기 올리기")}
      </button>
    </form>
  );
}
