// src/navigation/types.ts
import { Message } from ".";

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Settings: undefined;
  UsersList: undefined;
  MessageDetails: { message: Message };
};
