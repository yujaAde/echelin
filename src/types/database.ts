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
    };
    Views: Record<string, never>;
    Functions: {
      is_approved: { Args: Record<string, never>; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      set_profile_approved: {
        Args: { target_id: string; value: boolean };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
