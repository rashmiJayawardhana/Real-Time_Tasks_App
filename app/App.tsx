// app/App.tsx
import "./global.css";
import React from 'react';
import { useEffect, useState } from 'react';
import { loadUser, saveUser } from './src/services/storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { store } from './src/store';
import LoginScreen from './src/screens/LoginScreen';
import MainScreen from './src/screens/MainScreen';
import { User } from "./src/types";

const Stack = createStackNavigator();

export default function App() {
  const [initialUser, setInitialUser] = useState<User | null>(null);
  useEffect(() => {
    loadUser().then(setInitialUser);
  }, []);

  if (initialUser) {
    // Dispatch setUser and navigate to Main
    // Use a wrapper or initialRouteName
    // Use initialRouteName={initialUser ? 'Main' : 'Login'} in Stack.Navigator.
  }

  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Main" component={MainScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}