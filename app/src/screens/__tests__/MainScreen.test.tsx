// app/src/screens/__tests__/MainScreen.test.tsx
import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import messagesReducer from '../../store/messagesSlice';
import MainScreen from '../MainScreen';
import { api } from '../../services/api';

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

// MOCK NAVIGATION
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

// HELPER FUNCTION TO CREATE MOCK REDUX STORE
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

  // This runs before each test to reset all mocks
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigation = createMockNavigation();
  });

  // TEST 1: Basic Rendering
  // Verify that the screen renders with correct user information
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

  // TEST 2: Loading State
  // Verify that loading indicator appears when data is being fetched
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

  // TEST 3: Displaying Messages
  // Verify that messages are displayed after successful fetch
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

  // TEST 4: Empty State
  // Verify that empty state message shows when there are no messages
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

  // TEST 5: Sending a Message
  // Verify that user can type and send a message
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

  // TEST 6: Socket Connection
  // Verify that WebSocket listeners are set up correctly on mount
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

  // TEST 7: Input State Management
  // Verify that input field value changes correctly
  it('handles input state correctly', async () => {
    (api.getMessages as jest.Mock).mockResolvedValue([]);

    const store = createMockStore();

    const { getByPlaceholderText, queryByText } = render(
      <Provider store={store}>
        <MainScreen navigation={mockNavigation} />
      </Provider>
    );

    // Wait for loading indicator to disappear
    await waitFor(() => expect(queryByText('Loading messages...')).toBeNull());

    const input = getByPlaceholderText('Type a message...');

    expect(input.props.value).toBe('');

    fireEvent.changeText(input, 'Test message');
    expect(input.props.value).toBe('Test message');

    fireEvent.changeText(input, '');
    expect(input.props.value).toBe('');
  });


  // TEST 8: Sending Indicator
  // Verify that loading indicator shows while message is being sent
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

  // TEST 9: Navigate to Users List
  // Verify that users button navigates to UsersList screen
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

  // TEST 10: Navigate to Settings
  // Verify that settings button navigates to Settings screen
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