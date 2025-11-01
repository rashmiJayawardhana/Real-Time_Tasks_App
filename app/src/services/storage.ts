// app/src/services/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

export const saveUser = async (user: User) => {
  await AsyncStorage.setItem('user', JSON.stringify(user));
};

export const loadUser = async (): Promise<User | null> => {
  const json = await AsyncStorage.getItem('user');
  return json ? JSON.parse(json) : null;
};

export const clearUser = async () => {
  await AsyncStorage.removeItem('user');
};