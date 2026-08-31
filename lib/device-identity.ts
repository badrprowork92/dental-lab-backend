import * as Application from "expo-application";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const FALLBACK_DEVICE_ID_KEY = "dental_lab_fallback_device_id";

function createFallbackId() {
  return `install-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}

export async function getDeviceIdentity() {
  if (Platform.OS === "android") {
    try {
      const androidId = Application.getAndroidId();
      if (androidId) return { id: `android:${androidId}`, label: `Android · ${Application.applicationName ?? "جهاز المختبر"}` };
    } catch {
      // عند عدم توفر معرّف النظام في بيئة المعاينة، نستخدم معرف تثبيت مخزنًا محليًا.
    }
  }
  let fallback = Platform.OS === "web" && typeof window !== "undefined" ? window.localStorage.getItem(FALLBACK_DEVICE_ID_KEY) : await SecureStore.getItemAsync(FALLBACK_DEVICE_ID_KEY);
  if (!fallback) {
    fallback = createFallbackId();
    if (Platform.OS === "web" && typeof window !== "undefined") window.localStorage.setItem(FALLBACK_DEVICE_ID_KEY, fallback);
    else await SecureStore.setItemAsync(FALLBACK_DEVICE_ID_KEY, fallback);
  }
  return { id: `${Platform.OS}:${fallback}`, label: Platform.OS === "web" ? "معاينة الويب" : "جهاز التطبيق" };
}
