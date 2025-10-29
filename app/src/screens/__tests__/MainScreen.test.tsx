// app/src/screens/__tests__/MainScreen.test.tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import messagesReducer from '../../store/messagesSlice';
import MainScreen from '../MainScreen';

// ✅ Mock Redux store
const mockStore = configureStore({
  reducer: { messages: messagesReducer },
  preloadedState: {
    messages: {
      user: { id: 1, name: 'Test User' },
      messages: [],
      loading: false,
      sending: false,
      error: null,
    },
  },
});

// ✅ Correct mock for API (with api object)
jest.mock('../../services/api', () => ({
  api: {
    getMessages: jest.fn(() => Promise.resolve([])),
    createMessage: jest.fn(),
    createUser: jest.fn(),
  },
}));

// ✅ Mock socket
jest.mock('../../services/socket', () => ({
  getSocket: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  })),
}));

describe('MainScreen', () => {
  it('renders correctly after loading', async () => {
    const { getByText, queryByText } = render(
      <Provider store={mockStore}>
        <MainScreen />
      </Provider>
    );

    // Make sure the loading state appears
    expect(queryByText(/loading/i)).toBeTruthy();

    // Wait for messages list to appear
    await waitFor(() => {
      expect(getByText('Messages')).toBeTruthy();
    });
  });
});
