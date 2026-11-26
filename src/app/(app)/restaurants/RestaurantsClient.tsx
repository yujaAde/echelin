"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { FormMessage } from "@/components/FormMessage";
import { btnPrimary, btnSmall, btnSmallDanger, btnSmallPrimary, inputClass, listBox, sectionTitle } from "@/components/ui";
import { escapeHtml, loadKakaoMaps } from "@/lib/kakao";
import { addRestaurant, deleteRestaurant, updateRestaurantMemo, type RestaurantFormState } from "./actions";

export type RestaurantView = {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  kakaoPlaceId: string | null;
  memo: string | null;
  createdBy: string;
  creatorName: string;
  postCount: number;
};

type SearchItem = kakao.maps.services.PlacesSearchResultItem;

// 저장된 맛집이 없을 때의 기본 중심 (서울시청)
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

export function RestaurantsClient({
  restaurants,
  currentUserId,
  isAdmin,
}: {
  restaurants: RestaurantView[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: kakao.maps.Marker; info: kakao.maps.InfoWindow }>>(new Map());
  const openInfoRef = useRef<kakao.maps.InfoWindow | null>(null);
  const tempMarkerRef = useRef<kakao.maps.Marker | null>(null);

  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState<string>();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string>();
  const [selected, setSelected] = useState<SearchItem | null>(null);

  const [saveState, saveAction, saving] = useActionState<RestaurantFormState, FormData>(
    async (prev, formData) => {
      const result = await addRestaurant(prev, formData);
      if (result.success) {
        // 저장 성공 시 임시 마커 제거 (실제 마커는 서버 갱신 후 props 로 들어온다)
        tempMarkerRef.current?.setMap(null);
        tempMarkerRef.current = null;
        setSelected(null);
      }
      return result;
    },
    {},
  );

  const savedPlaceIds = new Set(restaurants.map((r) => r.kakaoPlaceId).filter(Boolean));

  // 1) SDK 로드 + 지도 생성
  useEffect(() => {
    let cancelled = false;
    loadKakaoMaps()
      .then(() => {
        if (cancelled || !mapEl.current || mapRef.current) return;
        mapRef.current = new window.kakao.maps.Map(mapEl.current, {
          center: new window.kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
          level: 6,
        });
        setReady(true);
      })
      .catch((err: unknown) => {
        if (!cancelled) setMapError(err instanceof Error ? err.message : "지도를 불러오지 못했습니다.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const closeOpenInfo = useCallback(() => {
    openInfoRef.current?.close();
    openInfoRef.current = null;
  }, []);

  // 2) 저장된 맛집 마커 동기화
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const k = window.kakao.maps;

    for (const { marker } of markersRef.current.values()) marker.setMap(null);
    markersRef.current.clear();
    closeOpenInfo();

    const bounds = new k.LatLngBounds();
    let count = 0;
    for (const r of restaurants) {
      if (r.lat === null || r.lng === null) continue;
      const position = new k.LatLng(r.lat, r.lng);
      const marker = new k.Marker({ position, map, title: r.name });
      const info = new k.InfoWindow({
        content: `<div style="padding:6px 10px;font-size:13px;white-space:nowrap;color:#111">${escapeHtml(r.name)}</div>`,
      });
      k.event.addListener(marker, "click", () => {
        closeOpenInfo();
        info.open(map, marker);
        openInfoRef.current = info;
      });
      markersRef.current.set(r.id, { marker, info });
      bounds.extend(position);
      count++;
    }
    if (count > 0) {
      map.setBounds(bounds);
      if (count === 1) map.setLevel(4);
    }
  }, [ready, restaurants, closeOpenInfo]);

  function focusRestaurant(id: string) {
    const map = mapRef.current;
    const entry = markersRef.current.get(id);
    if (!map || !entry) return;
    closeOpenInfo();
    map.panTo(entry.marker.getPosition());
    entry.info.open(map, entry.marker);
    openInfoRef.current = entry.info;
    mapEl.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function showTempMarker(item: SearchItem) {
    const map = mapRef.current;
    if (!map) return;
    const k = window.kakao.maps;
    const position = new k.LatLng(Number(item.y), Number(item.x));
    tempMarkerRef.current?.setMap(null);
    tempMarkerRef.current = new k.Marker({ position, map, title: item.place_name });
    closeOpenInfo();
    map.panTo(position);
    if (map.getLevel() > 4) map.setLevel(4);
  }

  function search(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const keyword = query.trim();
    if (!keyword || !ready) return;
    setSearching(true);
    setSearchMessage(undefined);
    setSelected(null);
    const places = new window.kakao.maps.services.Places();
    places.keywordSearch(
      keyword,
      (data, status) => {
        setSearching(false);
        if (status === window.kakao.maps.services.Status.OK) {
          setResults(data);
        } else {
          setResults([]);
          setSearchMessage(
            status === window.kakao.maps.services.Status.ZERO_RESULT
              ? "찾은 곳이 없습니다. 가게 이름이나 동네를 바꿔 보세요."
              : "검색하다 문제가 생겼습니다. 잠시 뒤 다시 시도해 주세요.",
          );
        }
      },
      { size: 10 },
    );
  }

  return (
    <div className="space-y-8">
      <div
        ref={mapEl}
        className="h-80 w-full overflow-hidden rounded-card border border-line bg-surface-muted sm:h-96"
      />
      {mapError && <FormMessage error={mapError} />}

      {/* 검색 */}
      <section className="space-y-3">
        <h2 className={sectionTitle}>맛집 찾기</h2>
        <form onSubmit={search} className="flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="가게 이름, 또는 동네와 메뉴 (예: 성수동 파스타)"
            aria-label="검색어"
            disabled={!ready}
            className={inputClass}
          />
          <button type="submit" disabled={!ready || searching} className={`${btnPrimary} shrink-0`}>
            {searching ? "찾는 중..." : "검색"}
          </button>
        </form>
        {searchMessage && <p className="text-sm text-ink-soft">{searchMessage}</p>}
        <FormMessage error={saveState.error} success={saveState.success} />

        {results.length > 0 && (
          <ul className={listBox}>
            {results.map((item) => {
              const isSaved = savedPlaceIds.has(item.id);
              const isSelected = selected?.id === item.id;
              return (
                <li key={item.id} className={`space-y-2 px-4 py-3 text-sm ${isSelected ? "bg-accent-soft" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(item);
                        showTempMarker(item);
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="font-semibold text-ink">{item.place_name}</p>
                      <p className="flex flex-wrap gap-x-2 text-xs text-ink-faint">
                        <span>{item.road_address_name || item.address_name}</span>
                        {item.category_name && <span>{item.category_name.split(" > ").pop()}</span>}
                      </p>
                    </button>
                    {isSaved ? (
                      <span className="shrink-0 text-xs text-ink-faint">이미 저장됨</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(isSelected ? null : item);
                          if (!isSelected) showTempMarker(item);
                        }}
                        className={`${btnSmall} shrink-0`}
                      >
                        {isSelected ? "접기" : "저장"}
                      </button>
                    )}
                  </div>
                  {isSelected && !isSaved && (
                    <form action={saveAction} className="flex flex-col gap-2 sm:flex-row">
                      <input type="hidden" name="name" value={item.place_name} />
                      <input type="hidden" name="address" value={item.road_address_name || item.address_name} />
                      <input type="hidden" name="lat" value={item.y} />
                      <input type="hidden" name="lng" value={item.x} />
                      <input type="hidden" name="kakao_place_id" value={item.id} />
                      <input
                        type="text"
                        name="memo"
                        maxLength={500}
                        placeholder="메모 (예: 웨이팅 김, 주차 가능)"
                        aria-label="메모"
                        className={inputClass}
                      />
                      <button type="submit" disabled={saving} className={`${btnPrimary} shrink-0`}>
                        {saving ? "저장 중..." : "이 맛집 저장"}
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 저장된 목록 */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className={sectionTitle}>저장한 맛집</h2>
          <span className="text-sm text-ink-soft">{restaurants.length}곳</span>
        </div>
        {restaurants.length === 0 ? (
          <div className="rounded-card border border-dashed border-line px-4 py-10 text-center">
            <p className="text-sm text-ink-soft">아직 저장한 곳이 없어요. 위에서 찾아 첫 맛집을 저장해 보세요.</p>
          </div>
        ) : (
          <ul className={listBox}>
            {restaurants.map((r) => (
              <RestaurantRow
                key={r.id}
                restaurant={r}
                canEdit={r.createdBy === currentUserId || isAdmin}
                onFocus={() => focusRestaurant(r.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function RestaurantRow({
  restaurant: r,
  canEdit,
  onFocus,
}: {
  restaurant: RestaurantView;
  canEdit: boolean;
  onFocus: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState<RestaurantFormState, FormData>(
    async (prev, formData) => {
      const result = await updateRestaurantMemo(prev, formData);
      if (result.success) setEditing(false);
      return result;
    },
    {},
  );

  return (
    <li className="space-y-2 px-4 py-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={onFocus} className="min-w-0 flex-1 text-left" title="지도에서 보기">
          <p className="font-semibold text-ink">{r.name}</p>
          {r.address && <p className="text-xs text-ink-faint">{r.address}</p>}
          {r.memo && !editing && (
            <p className="mt-1 whitespace-pre-wrap text-ink-soft">{r.memo}</p>
          )}
          <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-ink-faint">
            <span>{r.creatorName} 저장</span>
            {r.postCount > 0 && <span>후기 {r.postCount}</span>}
          </p>
        </button>
        {canEdit && (
          <div className="flex shrink-0 gap-1">
            <button type="button" onClick={() => setEditing((v) => !v)} className={btnSmall}>
              {editing ? "취소" : "메모"}
            </button>
            <ConfirmButton
              action={deleteRestaurant}
              hidden={{ id: r.id }}
              message={`${r.name} 을(를) 지울까요? 연결된 후기는 남지만 맛집 정보는 사라집니다.`}
              className={btnSmallDanger}
            >
              삭제
            </ConfirmButton>
          </div>
        )}
      </div>
      {editing && (
        <form action={action} className="flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="id" value={r.id} />
          <input
            type="text"
            name="memo"
            maxLength={500}
            defaultValue={r.memo ?? ""}
            placeholder="메모"
            aria-label="메모"
            className={inputClass}
          />
          <button type="submit" disabled={pending} className={`${btnSmallPrimary} shrink-0 py-2`}>
            {pending ? "저장 중..." : "메모 저장"}
          </button>
        </form>
      )}
      <FormMessage error={state.error} />
    </li>
  );
}
