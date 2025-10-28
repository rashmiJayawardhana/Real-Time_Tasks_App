// app/src/screens/__tests__/MainScreen.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import messagesReducer from '../../store/messagesSlice';
import MainScreen from '../MainScreen';

const mockStore = configureStore({
  reducer: {
    messages: messagesReducer,
  },
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

jest.mock('../../services/api');
jest.mock('../../services/socket');

describe('MainScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <Provider store={mockStore}>
        <MainScreen />
      </Provider>
    );

    expect(getByText('Messages')).toBeTruthy();
  });
});