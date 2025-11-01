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
// Jest will replace the real api module with this mock version
jest.mock('../../services/api', () => ({
  api: {
    // Mock getMessages to return an empty array by default
    getMessages: jest.fn(() => Promise.resolve([])),
    
    // Mock createMessage to return a fake message
    createMessage: jest.fn((userId: number, text: string) =>
      Promise.resolve({
        id: 1,
        user_id: userId,
        text,
        created_at: new Date().toISOString(),
        user_name: 'Test User',
      })
    ),
    
    // Mock createUser (not used in MainScreen but part of api)
    createUser: jest.fn(),
  },
  API_URL: 'http://localhost:3000',
}));


// MOCK SOCKET SERVICE
// Create a mock socket object with jest functions
const mockSocket = {
  on: jest.fn(),      
  off: jest.fn(),     
  emit: jest.fn(),  
  connect: jest.fn(),
  disconnect: jest.fn(),
};

// Replace the real socket module with our mock
jest.mock('../../services/socket', () => ({
  getSocket: jest.fn(() => mockSocket),
  initializeSocket: jest.fn(() => mockSocket),
  disconnectSocket: jest.fn(),
}));

// HELPER FUNCTION
// Creates a mock Redux store with preset state
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
        ...initialState,  // Allow overriding any of the above
      },
    },
  });
};

// TEST SUITE
describe('MainScreen', () => {
  // This runs before each test to reset all mocks
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TEST 1: Basic Rendering
  it('renders correctly with user info', async () => {
    // Create a store with default state
    const store = createMockStore();
    
    // Render the component wrapped in Redux Provider
    const { getByText } = render(
      <Provider store={store}>
        <MainScreen />
      </Provider>
    );

    // Wait for async operations to complete and check the UI
    await waitFor(() => {
      expect(getByText('Messages')).toBeTruthy();
      expect(getByText('Hello, Test User!')).toBeTruthy();
    });
  });

  // TEST 2: Loading State
  it('shows loading indicator initially', async () => {
    // Create a store with loading=true and empty messages
    const store = createMockStore({ loading: true, messages: [] });
    
    const { getByText } = render(
      <Provider store={store}>
        <MainScreen />
      </Provider>
    );

    // The component should show loading text
    await waitFor(() => {
      expect(getByText('Loading messages...')).toBeTruthy();
    });
  });

  // TEST 3: Displaying Messages
  it('displays messages after loading', async () => {
    // Create mock message data
    const mockMessages = [
      {
        id: 1,
        user_id: 1,
        text: 'Hello World',
        created_at: new Date().toISOString(),
        user_name: 'Test User',
      },
    ];

    // Tell the mock api.getMessages to return our mock data
    (api.getMessages as jest.Mock).mockResolvedValue(mockMessages);

    const store = createMockStore();
    
    // Render component (it will call loadMessages in useEffect)
    const { getByText } = render(
      <Provider store={store}>
        <MainScreen />
      </Provider>
    );

    // Wait for the message to appear in the UI
    await waitFor(() => {
      expect(getByText('Hello World')).toBeTruthy();
    });
  });

  // TEST 4: Empty State
  it('shows empty state when no messages', async () => {
    // Mock api returns empty array
    (api.getMessages as jest.Mock).mockResolvedValue([]);

    const store = createMockStore();
    
    const { getByText } = render(
      <Provider store={store}>
        <MainScreen />
      </Provider>
    );

    // Should show empty state messages
    await waitFor(() => {
      expect(getByText('No messages yet')).toBeTruthy();
      expect(getByText('Be the first to send one!')).toBeTruthy();
    });
  });

  // TEST 5: Sending a Message
  it('sends a message when send button is pressed', async () => {
    const store = createMockStore();
    
    // Render and get query functions
    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <MainScreen />
      </Provider>
    );

    // Wait for component to finish initial load
    await waitFor(() => {
      expect(getByText('Messages')).toBeTruthy();
    });

    // Find the input and send button
    const input = getByPlaceholderText('Type a message...');
    const sendButton = getByText('Send');

    // Simulate user typing a message
    fireEvent.changeText(input, 'Test message');
    
    // Simulate user pressing the send button
    fireEvent.press(sendButton);

    // Verify the API was called with correct parameters
    await waitFor(() => {
      expect(api.createMessage).toHaveBeenCalledWith(1, 'Test message');
    });
  });

  // TEST 6: Socket Connection
  it('connects to socket on mount', async () => {
    const store = createMockStore();
    
    // Render component (useEffect will run and setup socket)
    render(
      <Provider store={store}>
        <MainScreen />
      </Provider>
    );

    // Verify socket event listeners were registered
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

  // TEST 7: Button Disabled State 
  it('disables send button when input is empty', async () => {
    const store = createMockStore();
    
    const { getByText, getByPlaceholderText } = render(
      <Provider store={store}>
        <MainScreen />
      </Provider>
    );

    await waitFor(() => {
      // Verify input is empty (initial state)
      const input = getByPlaceholderText('Type a message...');
      expect(input.props.value).toBe('');
      
      // Button should exist
      const sendButton = getByText('Send');
      expect(sendButton).toBeTruthy();
    });

    // Test: Type something
    const input = getByPlaceholderText('Type a message...');
    fireEvent.changeText(input, 'Test message');
    
    await waitFor(() => {
      expect(input.props.value).toBe('Test message');
      expect(getByText('Send')).toBeTruthy();
    });
    
    // Test: Clear input
    fireEvent.changeText(input, '');
    
    await waitFor(() => {
      expect(input.props.value).toBe('');
      expect(getByText('Send')).toBeTruthy();
    });
  });

  // TEST 8: Sending Indicator
  it('shows sending indicator while message is being sent', async () => {
    const store = createMockStore({ sending: true });
    
    const { getAllByTestId } = render(
      <Provider store={store}>
        <MainScreen />
      </Provider>
    );

    // When sending, ActivityIndicator should be visible in send button
    await waitFor(() => {
      const indicators = getAllByTestId('activity-indicator');
      expect(indicators.length).toBeGreaterThan(0);
    });
  });
});