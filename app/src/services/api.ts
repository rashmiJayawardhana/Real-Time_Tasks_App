// app/src/services/api.ts
import { Message, User } from '../types';

const API_URL = 'http://192.168.8.102:3000'; // Replace with your computer's IP

export const api = {
  async getMessages(limit: number = 50): Promise<Message[]> {
    const response = await fetch(`${API_URL}/api/messages?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    return response.json();
  },

  async createMessage(userId: number, text: string): Promise<Message> {
    const response = await fetch(`${API_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId, text }),
    });
    if (!response.ok) {
      throw new Error('Failed to create message');
    }
    return response.json();
  },

  async createUser(name: string): Promise<User> {
    const response = await fetch(`${API_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      throw new Error('Failed to create user');
    }
    return response.json();
  },
};

export { API_URL };