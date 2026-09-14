export interface Concept {
  title: string;
  blurb: string;
  icon: string; // sanitized inner SVG markup, no outer <svg> tag
}

export interface User {
  id: string; // auth.users.id (uuid)
  name: string;
  email: string;
  initials: string;
  color: string;
  avatarUrl: string | null; // from Google OAuth, if signed in that way
  joinedAt: string; // ISO string, from auth.users.created_at
}

export interface HistoryItem {
  id: string; // uuid, from the history table
  inputPreview: string;
  title: string;
  concepts: Concept[];
  createdAt: string; // ISO string
}

export interface UsageEntry {
  num: number;
  charCount: number;
  free: boolean;
  cost: number;
  at: string; // ISO string
}

export interface GenerateResponse {
  concepts: Concept[];
}

export interface GenerateErrorResponse {
  error: string;
}
