// app/src/services/api.ts
import { Message, User } from '../types';
import { API_URL } from '@env';

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

  // New: Get all users
  async getAllUsers(): Promise<any[]> {
    const response = await fetch(`${API_URL}/api/users`);
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return response.json();
  },

  // New: Get single user by ID
  async getUser(userId: number): Promise<any> {
    const response = await fetch(`${API_URL}/api/users/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return response.json();
  },

  // New: Get messages by user ID
  async getUserMessages(userId: number, limit: number = 50): Promise<Message[]> {
    const response = await fetch(`${API_URL}/api/users/${userId}/messages?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user messages');
    }
    return response.json();
  },

  // Future: Delete message
  async deleteMessage(messageId: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/messages/${messageId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete message');
    }
  },

  // Future: Update message
  async updateMessage(messageId: number, text: string): Promise<Message> {
    const response = await fetch(`${API_URL}/api/messages/${messageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      throw new Error('Failed to update message');
    }
    return response.json();
  },
};