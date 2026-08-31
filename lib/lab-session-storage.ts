import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const LAB_SESSION_TOKEN_KEY = "dental_lab_session_token";

export async function getLabSessionToken() {
  if (Platform.OS === "web") return typeof window === "undefined" ? null : window.localStorage.getItem(LAB_SESSION_TOKEN_KEY);
  return SecureStore.getItemAsync(LAB_SESSION_TOKEN_KEY);
}

export async function setLabSessionToken(token: string) {
  if (Platform.OS === "web") {
    window.localStorage.setItem(LAB_SESSION_TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(LAB_SESSION_TOKEN_KEY, token);
}

export async function clearLabSessionToken() {
  if (Platform.OS === "web") {
    window.localStorage.removeItem(LAB_SESSION_TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(LAB_SESSION_TOKEN_KEY);
}
