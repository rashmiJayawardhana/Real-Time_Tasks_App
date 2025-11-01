// app/App.tsx
import React, { useEffect, useState, useRef } from 'react';
import { loadUser } from './src/services/storage';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { store } from './src/store';
import LoginScreen from './src/screens/LoginScreen';
import MainScreen from './src/screens/MainScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import UsersListScreen from './src/screens/UsersListScreen';
import MessageDetailsScreen from './src/screens/MessageDetailsScreen';
import { RootStackParamList } from './src/types/navigation';
import { Message, User } from './src/types';
import * as Notifications from 'expo-notifications';
import { 
  registerForPushNotificationsAsync, 
  registerPushToken,
  setupNotificationListeners,
  clearBadge 
} from './src/services/notifications';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const [initialUser, setInitialUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    // Load user
    loadUser()
      .then(setInitialUser)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Setup push notifications after user is loaded
    if (initialUser) {
      setupPushNotifications(initialUser);
    }
  }, [initialUser]);

  const setupPushNotifications = async (user: User) => {
    // Request permissions and get token
    const token = await registerForPushNotificationsAsync();
    
    if (token) {
      setExpoPushToken(token);
      
      // Register token with backend
      await registerPushToken(user.id, token);
    }

    // Setup notification listeners
    const cleanup = setupNotificationListeners(
      // When notification is received while app is open
      (notification) => {
        console.log('Received notification:', notification.request.content);
        // You can show an in-app notification here if desired
      },
      // When user taps on notification
      (response) => {
        const data = response.notification.request.content.data as { message?: Message; messageId?: number };
        
        // Navigate to message details if message data is present
        if (data?.messageId && navigationRef.current && data.message) {
          navigationRef.current.navigate('MessageDetails', {
            message: data.message,
          });
        }
        
        // Clear badge when user opens app via notification
        clearBadge();
      }
    );

    return cleanup;
  };

  // Clear badge when app comes to foreground
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      clearBadge();
    });

    return () => subscription.remove();
  }, []);

  if (loading) {
    return null; // Or a splash screen
  }

  return (
    <Provider store={store}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={initialUser ? 'Main' : 'Login'}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Main" component={MainScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="UsersList" component={UsersListScreen} />
          <Stack.Screen name="MessageDetails" component={MessageDetailsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}