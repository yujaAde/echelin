"use client";

import { useState } from "react";
import { inputClass, labelClass } from "@/components/ui";

// 후기 작성·수정 폼의 "모임 후기" 표시와 모임 월·맛집 입력
export function MeetingFields({
  defaultMonth,
  defaultIsMeeting,
  restaurants,
  defaultRestaurantId,
}: {
  defaultMonth: string;
  defaultIsMeeting: boolean;
  restaurants: { id: string; name: string }[];
  defaultRestaurantId?: string | null;
}) {
  const [isMeeting, setIsMeeting] = useState(defaultIsMeeting);

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
        <input
          type="checkbox"
          name="is_meeting"
          value="1"
          checked={isMeeting}
          onChange={(e) => setIsMeeting(e.target.checked)}
          className="size-4 accent-brand"
        />
        <span className="font-medium">모임에서 다녀온 후기예요</span>
        <span className="text-xs text-ink-faint">끄면 개인 맛집 후기로 올라가요</span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        {isMeeting && (
          <div className="space-y-1.5">
            <label htmlFor="meeting_month" className={labelClass}>모임 월</label>
            <input
              id="meeting_month"
              name="meeting_month"
              type="month"
              defaultValue={defaultMonth}
              required
              className={inputClass}
            />
          </div>
        )}
        {restaurants.length > 0 && (
          <div className="space-y-1.5">
            <label htmlFor="restaurant_id" className={labelClass}>다녀온 맛집</label>
            <select
              id="restaurant_id"
              name="restaurant_id"
              defaultValue={defaultRestaurantId ?? ""}
              className={inputClass}
            >
              <option value="">고르지 않음</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
