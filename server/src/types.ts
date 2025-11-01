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

export interface PushToken {
  id: number;
  user_id: number;
  token: string;
  platform: 'ios' | 'android' | 'web';
  created_at: Date;
  last_used: Date;
}

export interface RegisterPushTokenRequest {
  user_id: number;
  token: string;
  platform: 'ios' | 'android' | 'web';
}

export interface ExpoPushResult {
  data?: {
    status?: string;
    details?: { error?: string };
  };
  errors?: any[];
}
