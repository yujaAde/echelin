import { Suspense } from "react";
import { pageTitle } from "@/components/ui";
import { requireApproved } from "@/lib/auth";
import { nicknameMap } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";
import { RestaurantsClient, type RestaurantView } from "./RestaurantsClient";

export const metadata = { title: "맛집 지도 | E슐랭" };

export default function RestaurantsPage() {
  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h1 className={pageTitle}>맛집 지도</h1>
        <p className="text-sm text-ink-soft">
          다녀왔거나 가 보고 싶은 곳을 찾아 저장하세요. 저장한 곳은 지도에 핀으로 보입니다.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-ink-soft">불러오는 중...</p>}>
        <RestaurantsBody />
      </Suspense>
    </section>
  );
}

async function RestaurantsBody() {
  const { user, profile } = await requireApproved();
  const supabase = await createClient();

  const [{ data: restaurants, error }, { data: posts }] = await Promise.all([
    supabase.from("restaurants").select("*").order("created_at", { ascending: false }),
    supabase.from("posts").select("restaurant_id").not("restaurant_id", "is", null),
  ]);
  if (error) {
    return <p className="text-sm text-danger">맛집 목록을 불러오지 못했습니다. ({error.message})</p>;
  }

  const rows = restaurants ?? [];
  const names = await nicknameMap(supabase, rows.map((r) => r.created_by));
  const postCount = new Map<string, number>();
  for (const p of posts ?? []) {
    if (p.restaurant_id) postCount.set(p.restaurant_id, (postCount.get(p.restaurant_id) ?? 0) + 1);
  }

  const views: RestaurantView[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    kakaoPlaceId: r.kakao_place_id,
    memo: r.memo,
    createdBy: r.created_by,
    creatorName: r.created_by ? (names.get(r.created_by) ?? "(알 수 없음)") : "(탈퇴한 회원)",
    postCount: postCount.get(r.id) ?? 0,
  }));

  return (
    <RestaurantsClient
      restaurants={views}
      currentUserId={user.id}
      isAdmin={profile.role === "admin"}
    />
  );
}
