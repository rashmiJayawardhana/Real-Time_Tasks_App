// app/src/types.ts
export interface User {
  id: number;
  name: string;
}

export interface Message {
  id: number;
  user_id: number;
  text: string;
  created_at: string;
  user_name: string;
}

export interface AppState {
  user: User | null;
  messages: Message[];
  loading: boolean;
  sending: boolean;
  error: string | null;
}