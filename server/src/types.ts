// server/src/types.ts
export interface User {
  id: number;
  name: string;
  created_at: Date;
}

export interface Message {
  id: number;
  user_id: number;
  text: string;
  created_at: Date;
  user_name?: string;
}

export interface CreateMessageRequest {
  user_id: number;
  text: string;
}

export interface CreateUserRequest {
  name: string;
}