import DateTimePicker from "@react-native-community/datetimepicker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useState } from "react";

import { AppText, colors } from "@/components/lab-ui";

function parseDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date();
}

function formatDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DateField({ label, value, onChange, disabled = false }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(parseDate(value));
  const open = () => { if (!disabled) { setDraft(parseDate(value)); setVisible(true); } };
  return <View style={styles.wrap}><AppText style={styles.label}>{label}</AppText><Pressable onPress={open} style={({ pressed }) => [styles.field, disabled && styles.disabled, pressed && styles.pressed]}><MaterialIcons name="calendar-month" size={20} color={colors.primary} /><AppText style={styles.value}>{value || "اختر التاريخ"}</AppText></Pressable>{visible ? <View style={Platform.OS === "ios" ? styles.iosPicker : undefined}><DateTimePicker value={draft} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={(_, selected) => { if (Platform.OS !== "ios") setVisible(false); if (selected) { setDraft(selected); if (Platform.OS !== "ios") onChange(formatDate(selected)); } }} />{Platform.OS === "ios" ? <Pressable onPress={() => { onChange(formatDate(draft)); setVisible(false); }} style={({ pressed }) => [styles.done, pressed && styles.pressed]}><AppText style={styles.doneText}>تم اختيار التاريخ</AppText></Pressable> : null}</View> : null}</View>;
}

export { formatDate };
const styles = StyleSheet.create({ wrap: { gap: 6 }, label: { fontFamily: "Cairo-SemiBold", fontSize: 12, textAlign: "right" }, field: { minHeight: 47, paddingHorizontal: 13, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" }, value: { color: colors.ink, fontSize: 13, fontFamily: "Cairo-SemiBold" }, disabled: { opacity: 0.5 }, pressed: { opacity: 0.72 }, iosPicker: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, overflow: "hidden" }, done: { backgroundColor: colors.primary, alignItems: "center", paddingVertical: 10 }, doneText: { color: "#FFF", fontFamily: "Cairo-Bold", fontSize: 12 } });
