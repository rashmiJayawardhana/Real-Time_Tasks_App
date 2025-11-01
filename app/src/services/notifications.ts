// app/src/services/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_URL } from '@env';

// Configure how notifications are displayed
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, 
    shouldShowList: true,  
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});


/**
 * Request notification permissions from the user
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Check if running on a physical device
  if (Device.isDevice) {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // If permission denied, return null
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    // Get the Expo Push Token
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? 
                       Constants.easConfig?.projectId;
      
      token = (await Notifications.getExpoPushTokenAsync({ 
        projectId 
      })).data;
      
      console.log('Expo Push Token:', token);
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  // Android-specific channel configuration
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3b82f6',
      sound: 'default',
    });
  }

  return token;
}

/**
 * Register push token with backend
 */
export async function registerPushToken(userId: number, token: string): Promise<boolean> {
  try {
    const platform = Platform.OS as 'ios' | 'android' | 'web';
    
    const response = await fetch(`${API_URL}/api/push-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        token,
        platform,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to register push token');
    }

    console.log('Push token registered successfully');
    return true;
  } catch (error) {
    console.error('Error registering push token:', error);
    return false;
  }
}

/**
 * Unregister push token (on logout)
 */
export async function unregisterPushToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/push-tokens/${encodeURIComponent(token)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to unregister push token');
    }

    console.log('Push token unregistered successfully');
    return true;
  } catch (error) {
    console.error('Error unregistering push token:', error);
    return false;
  }
}

/**
 * Setup notification listeners
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
) {
  // Listen for notifications received while app is foregrounded
  const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
    onNotificationReceived?.(notification);
  });

  // Listen for user tapping on notifications
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification tapped:', response);
    onNotificationTapped?.(response);
  });

  // Return cleanup function
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: null, // Show immediately
  });
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications() {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Get notification badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set notification badge count
 */
export async function setBadgeCount(count: number) {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear notification badge
 */
export async function clearBadge() {
  await Notifications.setBadgeCountAsync(0);
}