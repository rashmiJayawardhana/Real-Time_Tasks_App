// app/src/screens/__tests__/MainScreen.test.tsx
import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import messagesReducer from '../../store/messagesSlice';
import MainScreen from '../MainScreen';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';

// Mock API
jest.mock('../../services/api', () => ({
  api: {
    getMessages: jest.fn(() => Promise.resolve([])),
    createMessage: jest.fn((userId: number, text: string) =>
      Promise.resolve({
        id: 1,
        user_id: userId,
        text,
        created_at: new Date().toISOString(),
        user_name: 'Test User',
      })
    ),
    createUser: jest.fn(),
  },
  API_URL: 'http://localhost:3000',
}));

// Mock socket
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
};

jest.mock('../../services/socket', () => ({
  getSocket: jest.fn(() => mockSocket),
  initializeSocket: jest.fn(() => mockSocket),
  disconnectSocket: jest.fn(),
}));

// Helper to create mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: { messages: messagesReducer },
    preloadedState: {
      messages: {
        user: { id: 1, name: 'Test User' },
        messages: [],
        loading: false,
        sending: false,
        error: null,
        ...initialState,
      },
    },
  });
};

describe('MainScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with user info', async () => {
    const store = createMockStore();
    const { getByText } = render(
      <Provider store={store}>
        <MainScreen />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText('Messages')).toBeTruthy();
      expect(getByText('Hello, Test User!')).toBeTruthy();
    });
  });

  it('shows loading indicator initially', () => {
    const store = createMockStore({ loading: true });
    const { getByText } = render(
      <Provider store={store}>
        <MainScreen />
      </Provider>
    );

    expect(getByText('Loading messages...')).toBeTruthy();
  });

  it('displays messages after loading', async () => {
    const mockMessages = [
      {
        id: 1,
        user_id: 1,
        text: 'Hello World',
        created_at: new Date().toISOString(),
        user_name: 'Test User',
      },
    ];

    (api.getMessages as jest.Mock).mockResolvedValue(mockMessages);

    const store = createMockStore();
    const { getByText } = render(
      <Provider store={store}>
        <MainScreen />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText('Hello World')).toBeTruthy();
    });
  });

  it('shows empty state when no messages', async () => {
    (api.getMessages as jest.Mock).mockResolvedValue([]);

    const store = createMockStore();
    const { getByText } = render(
      <Provider store={store}>
        <MainScreen />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText('No messages yet')).toBeTruthy();
      expect(getByText('Be the first to send one!')).toBeTruthy();
    });
  });

  it('sends a message when send button is pressed', async () => {
    const store = createMockStore();
    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <MainScreen />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText('Messages')).toBeTruthy();
    });

    const input = getByPlaceholderText('Type a message...');
    const sendButton = getByText('Send');

    fireEvent.changeText(input, 'Test message');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(api.createMessage).toHaveBeenCalledWith(1, 'Test message');
    });
  });

  it('connects to socket on mount', async () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <MainScreen />
      </Provider>
    );

    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalledWith(
        'connect',
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        'message:new',
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        'disconnect',
        expect.any(Function)
      );
    });
  });

  it('disables send button when input is empty', async () => {
    const store = createMockStore();
    const { getByText } = render(
      <Provider store={store}>
        <MainScreen />
      </Provider>
    );

    await waitFor(() => {
      const sendButton = getByText('Send');
      expect(sendButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  it('shows sending indicator while message is being sent', async () => {
    const store = createMockStore({ sending: true });
    const { getByTestId } = render(
      <Provider store={store}>
        <MainScreen />
      </Provider>
    );

    // ActivityIndicator should be rendered when sending
    const indicators = getByTestId('activity-indicator');
    expect(indicators).toBeTruthy();
  });
});