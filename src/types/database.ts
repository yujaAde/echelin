// supabase/migrations/ 의 스키마와 손으로 맞춰 관리한다.
// 테이블을 추가하면 여기에도 Row/Insert/Update 를 추가할 것.

export type ProfileRole = "admin" | "member";

export type Profile = {
  id: string;
  nickname: string;
  avatar_url: string | null;
  role: ProfileRole;
  approved: boolean;
  created_at: string;
};

export type Holiday = {
  date: string; // YYYY-MM-DD
  name: string;
  created_at: string;
};

export type Vote = {
  id: string;
  user_id: string;
  month: string; // YYYY-MM
  date: string; // YYYY-MM-DD
  created_at: string;
};

export type VoteAbsence = {
  user_id: string;
  month: string; // YYYY-MM
  created_at: string;
};

// 월별 모임 진행 설정. null 인 값은 앱 기본값을 쓴다.
export type VoteRound = {
  month: string; // YYYY-MM
  date_deadline: string | null;
  date_closed_at: string | null;
  place_vote_opens_at: string | null;
  nomination_days: number;
  updated_at: string;
};

export type PlaceNomination = {
  id: string;
  month: string;
  restaurant_id: string;
  nominated_by: string | null;
  created_at: string;
};

export type PlaceVote = {
  id: string;
  user_id: string;
  month: string;
  restaurant_id: string;
  created_at: string;
};

export type Restaurant = {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  kakao_place_id: string | null;
  memo: string | null;
  created_by: string | null; // 탈퇴한 회원이면 null
  created_at: string;
};

export type Post = {
  id: string;
  author_id: string | null; // 탈퇴한 회원이면 null
  title: string;
  body: string;
  restaurant_id: string | null;
  meeting_month: string | null; // YYYY-MM. 후기('review')는 필수, 자유글은 null
  board: "review" | "free";
  created_at: string;
};

export type PostImage = {
  id: string;
  post_id: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
};

export type Comment = {
  id: string;
  post_id: string;
  author_id: string | null; // 탈퇴한 회원이면 null
  body: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          nickname: string;
          avatar_url?: string | null;
          role?: ProfileRole;
          approved?: boolean;
          created_at?: string;
        };
        Update: {
          nickname?: string;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      holidays: {
        Row: Holiday;
        Insert: { date: string; name: string; created_at?: string };
        Update: { date?: string; name?: string };
        Relationships: [];
      };
      votes: {
        Row: Vote;
        Insert: {
          id?: string;
          user_id: string;
          month: string;
          date: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      vote_absences: {
        Row: VoteAbsence;
        Insert: {
          user_id: string;
          month: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      vote_rounds: {
        Row: VoteRound;
        Insert: {
          month: string;
          date_deadline?: string | null;
          date_closed_at?: string | null;
          place_vote_opens_at?: string | null;
          nomination_days?: number;
          updated_at?: string;
        };
        Update: {
          date_deadline?: string | null;
          date_closed_at?: string | null;
          place_vote_opens_at?: string | null;
          nomination_days?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      place_nominations: {
        Row: PlaceNomination;
        Insert: {
          id?: string;
          month: string;
          restaurant_id: string;
          nominated_by: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      place_votes: {
        Row: PlaceVote;
        Insert: {
          id?: string;
          user_id: string;
          month: string;
          restaurant_id: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      restaurants: {
        Row: Restaurant;
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          kakao_place_id?: string | null;
          memo?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          kakao_place_id?: string | null;
          memo?: string | null;
        };
        Relationships: [];
      };
      posts: {
        Row: Post;
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          body?: string;
          restaurant_id?: string | null;
          meeting_month?: string | null;
          board?: "review" | "free";
          created_at?: string;
        };
        Update: {
          title?: string;
          body?: string;
          restaurant_id?: string | null;
          meeting_month?: string | null;
        };
        Relationships: [];
      };
      post_images: {
        Row: PostImage;
        Insert: {
          id?: string;
          post_id: string;
          storage_path: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      comments: {
        Row: Comment;
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          body: string;
          created_at?: string;
        };
        Update: { body?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_approved: { Args: Record<string, never>; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      set_profile_approved: {
        Args: { target_id: string; value: boolean };
        Returns: undefined;
      };
      close_date_vote_if_complete: {
        Args: { target_month: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
