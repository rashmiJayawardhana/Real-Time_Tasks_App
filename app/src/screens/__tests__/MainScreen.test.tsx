// app/src/screens/__tests__/MainScreen.test.tsx

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import messagesReducer from '../../store/messagesSlice';
import MainScreen from '../MainScreen';
import { api } from '../../services/api';

// Mock environment variables
jest.mock('@env', () => ({
  API_URL: 'http://localhost:3000',
  SOCKET_URL: 'http://localhost:3000',
}));

// MOCK API SERVICE
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
    getAllUsers: jest.fn(() => Promise.resolve([])),
  },
  API_URL: 'http://localhost:3000',
}));

// MOCK SOCKET SERVICE
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

// 🔧 FIX: MOCK NAVIGATION
// This was missing! MainScreen now requires a navigation prop
const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true),
  reset: jest.fn(),
  setOptions: jest.fn(),
});

// HELPER FUNCTION
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

// TEST SUITE
describe('MainScreen', () => {
  let mockNavigation: ReturnType<typeof createMockNavigation>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigation = createMockNavigation();
  });

  it('renders correctly with user info', async () => {
    const store = createMockStore();
    
    const { getByText } = render(
      <Provider store={store}>
        <MainScreen navigation={mockNavigation} />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText('Messages')).toBeTruthy();
      expect(getByText(/Hello, Test User!/)).toBeTruthy();
    });
  });

  it('shows loading indicator initially', async () => {
    const store = createMockStore({ loading: true, messages: [] });
    
    const { getByText } = render(
      <Provider store={store}>
        <MainScreen navigation={mockNavigation} />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText('Loading messages...')).toBeTruthy();
    });
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
        <MainScreen navigation={mockNavigation} />
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
        <MainScreen navigation={mockNavigation} />
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
        <MainScreen navigation={mockNavigation} />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText('Messages')).toBeTruthy();
    });

    const input = getByPlaceholderText('Type a message...');
    const sendButton = getByText('➤');

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
        <MainScreen navigation={mockNavigation} />
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

  it('handles input state correctly', async () => {
    const store = createMockStore();
    
    const { getByPlaceholderText } = render(
      <Provider store={store}>
        <MainScreen navigation={mockNavigation} />
      </Provider>
    );

    const input = getByPlaceholderText('Type a message...');
    
    await waitFor(() => {
      expect(input.props.value).toBe('');
    });

    fireEvent.changeText(input, 'Test message');
    
    await waitFor(() => {
      expect(input.props.value).toBe('Test message');
    });
    
    fireEvent.changeText(input, '');
    
    await waitFor(() => {
      expect(input.props.value).toBe('');
    });
  });

  it('shows sending indicator while message is being sent', async () => {
    const store = createMockStore({ sending: true });
    
    const { getAllByTestId } = render(
      <Provider store={store}>
        <MainScreen navigation={mockNavigation} />
      </Provider>
    );

    await waitFor(() => {
      const indicators = getAllByTestId('activity-indicator');
      expect(indicators.length).toBeGreaterThan(0);
    });
  });

  it('navigates to UsersList when users button is pressed', async () => {
    const store = createMockStore();
    
    const { getByText } = render(
      <Provider store={store}>
        <MainScreen navigation={mockNavigation} />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText('Messages')).toBeTruthy();
    });

    const usersButton = getByText('👥');
    fireEvent.press(usersButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('UsersList');
  });

  it('navigates to Settings when settings button is pressed', async () => {
    const store = createMockStore();
    
    const { getByText } = render(
      <Provider store={store}>
        <MainScreen navigation={mockNavigation} />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText('Messages')).toBeTruthy();
    });

    const settingsButton = getByText('⚙️');
    fireEvent.press(settingsButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Settings');
  });
});