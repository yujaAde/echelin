// 카카오맵 JavaScript SDK 중 이 프로젝트에서 쓰는 부분만 선언한다.
// https://apis.map.kakao.com/web/documentation/

declare namespace kakao.maps {
  function load(callback: () => void): void;

  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class LatLngBounds {
    constructor();
    extend(latlng: LatLng): void;
  }

  interface MapOptions {
    center: LatLng;
    level?: number;
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    panTo(latlng: LatLng): void;
    setBounds(bounds: LatLngBounds): void;
    setLevel(level: number): void;
    getLevel(): number;
    relayout(): void;
  }

  interface MarkerOptions {
    position: LatLng;
    map?: Map;
    title?: string;
    clickable?: boolean;
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
    getPosition(): LatLng;
  }

  interface InfoWindowOptions {
    content: string;
    removable?: boolean;
  }

  class InfoWindow {
    constructor(options: InfoWindowOptions);
    open(map: Map, marker: Marker): void;
    close(): void;
  }

  namespace event {
    function addListener(
      target: Marker | Map,
      type: string,
      handler: (...args: unknown[]) => void,
    ): void;
  }

  namespace services {
    const Status: {
      OK: string;
      ZERO_RESULT: string;
      ERROR: string;
    };

    interface PlacesSearchResultItem {
      id: string;
      place_name: string;
      address_name: string;
      road_address_name: string;
      category_name: string;
      phone: string;
      place_url: string;
      x: string; // 경도(lng)
      y: string; // 위도(lat)
    }

    interface Pagination {
      hasNextPage: boolean;
      nextPage(): void;
    }

    interface PlacesSearchOptions {
      page?: number;
      size?: number;
      location?: LatLng;
      radius?: number;
    }

    class Places {
      constructor(map?: Map);
      keywordSearch(
        keyword: string,
        callback: (
          result: PlacesSearchResultItem[],
          status: string,
          pagination: Pagination,
        ) => void,
        options?: PlacesSearchOptions,
      ): void;
    }
  }
}

interface Window {
  kakao: typeof kakao;
}
