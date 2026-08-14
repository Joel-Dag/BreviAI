export type PlanTier = "free" | "pro" | "team";

export type MeetingStatus =
  | "uploading"
  | "transcribing"
  | "summarizing"
  | "done"
  | "failed";

export type Profile = {
  id: string;
  stripe_customer_id: string | null;
  plan_tier: PlanTier;
  usage_minutes_this_period: number;
  period_reset_at: string;
  created_at: string;
  updated_at: string;
};

export type Meeting = {
  id: string;
  user_id: string;
  title: string;
  audio_file_path: string | null;
  duration_seconds: number | null;
  status: MeetingStatus;
  created_at: string;
  updated_at: string;
};

export type Transcript = {
  id: string;
  meeting_id: string;
  full_text: string;
  raw_groq_response: Record<string, unknown> | null;
  created_at: string;
};

export type Summary = {
  id: string;
  meeting_id: string;
  executive_summary: string;
  key_topics: string[];
  decisions: string[];
  created_at: string;
};

export type ActionItem = {
  id: string;
  meeting_id: string;
  description: string;
  owner_name: string | null;
  due_date: string | null;
  is_confident: boolean;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type MeetingWithRelations = Meeting & {
  transcript: Transcript | null;
  summary: Summary | null;
  action_items: ActionItem[];
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          stripe_customer_id?: string | null;
          plan_tier?: PlanTier;
          usage_minutes_this_period?: number;
          period_reset_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          stripe_customer_id?: string | null;
          plan_tier?: PlanTier;
          usage_minutes_this_period?: number;
          period_reset_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      meetings: {
        Row: Meeting;
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          audio_file_path?: string | null;
          duration_seconds?: number | null;
          status?: MeetingStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          audio_file_path?: string | null;
          duration_seconds?: number | null;
          status?: MeetingStatus;
          updated_at?: string;
        };
        Relationships: [];
      };
      transcripts: {
        Row: Transcript;
        Insert: {
          id?: string;
          meeting_id: string;
          full_text: string;
          raw_groq_response?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          full_text?: string;
          raw_groq_response?: Record<string, unknown> | null;
        };
        Relationships: [];
      };
      summaries: {
        Row: Summary;
        Insert: {
          id?: string;
          meeting_id: string;
          executive_summary: string;
          key_topics?: string[];
          decisions?: string[];
          created_at?: string;
        };
        Update: {
          executive_summary?: string;
          key_topics?: string[];
          decisions?: string[];
        };
        Relationships: [];
      };
      action_items: {
        Row: ActionItem;
        Insert: {
          id?: string;
          meeting_id: string;
          description: string;
          owner_name?: string | null;
          due_date?: string | null;
          is_confident?: boolean;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          description?: string;
          owner_name?: string | null;
          due_date?: string | null;
          is_confident?: boolean;
          is_completed?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Enums: {
      plan_tier: PlanTier;
      meeting_status: MeetingStatus;
    };
  };
};

