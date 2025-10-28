// app/src/store/messagesSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message, User } from '../types';

interface MessagesState {
  user: User | null;
  messages: Message[];
  loading: boolean;
  sending: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  user: null,
  messages: [],
  loading: false,
  sending: false,
  error: null,
};

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setSending(state, action: PayloadAction<boolean>) {
      state.sending = action.payload;
    },
    setMessages(state, action: PayloadAction<Message[]>) {
      state.messages = action.payload;
    },
    addMessage(state, action: PayloadAction<Message>) {
      // Add to beginning (newest first)
      state.messages.unshift(action.payload);
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  setUser,
  setLoading,
  setSending,
  setMessages,
  addMessage,
  setError,
  clearError,
} = messagesSlice.actions;

export default messagesSlice.reducer;