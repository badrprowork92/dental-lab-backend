import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { PropsWithChildren, ReactNode } from "react";
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";

import { ScreenContainer } from "@/components/screen-container";

export const colors = {
  primary: "#006A60",
  accent: "#008375",
  background: "#F8FAF9",
  surface: "#FFFFFF",
  ink: "#16302D",
  muted: "#61716E",
  border: "#DCE6E3",
  success: "#16803C",
  warning: "#B45309",
  danger: "#B42318",
  dangerSoft: "#FDECEC",
  tealSoft: "#E5F3F0",
  goldSoft: "#FFF6DF",
};

export function AppText({ style, children, ...props }: PropsWithChildren<{ style?: StyleProp<TextStyle>; numberOfLines?: number }>) {
  return (
    <Text {...props} style={[styles.text, style]}>
      {children}
    </Text>
  );
}

export function LabScreen({ children, scroll = true, style, onRefresh, refreshing = false }: PropsWithChildren<{ scroll?: boolean; style?: StyleProp<ViewStyle>; onRefresh?: () => Promise<void> | void; refreshing?: boolean }>) {
  const body = scroll ? <ScrollView contentContainerStyle={[styles.scroll, style]} showsVerticalScrollIndicator={false} refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.primary} colors={[colors.primary]} /> : undefined}>{children}</ScrollView> : <View style={[styles.fill, style]}>{children}</View>;
  return <ScreenContainer containerClassName="bg-background" className="flex-1">{body}</ScreenContainer>;
}

export function ScreenTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <View style={styles.titleRow}>
      <View style={styles.titleCopy}>
        <AppText style={styles.title}>{title}</AppText>
        {subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}
      </View>
      {action}
    </View>
  );
}

export function PrimaryButton({ label, onPress, icon = "add", variant = "primary", disabled = false, compact = false }: { label: string; onPress: () => void; icon?: React.ComponentProps<typeof MaterialIcons>["name"]; variant?: "primary" | "secondary" | "danger" | "ghost"; disabled?: boolean; compact?: boolean }) {
  const kind = buttonStyles[variant];
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.button, kind.container, compact && styles.buttonCompact, disabled && styles.disabled, pressed && styles.pressed]}>
      <MaterialIcons name={icon} size={compact ? 18 : 20} color={kind.icon} />
      <AppText style={[styles.buttonText, { color: kind.text }, compact && styles.buttonTextCompact]}>{label}</AppText>
    </Pressable>
  );
}

export function IconButton({ icon, onPress, tone = "default", label }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; onPress: () => void; tone?: "default" | "primary" | "danger"; label?: string }) {
  const toneStyle = tone === "primary" ? styles.iconPrimary : tone === "danger" ? styles.iconDanger : styles.iconDefault;
  return <Pressable accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.iconButton, toneStyle, pressed && styles.pressed]}><MaterialIcons name={icon} size={21} color={tone === "danger" ? colors.danger : tone === "primary" ? colors.primary : colors.ink} /></Pressable>;
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return <View style={styles.sectionHeader}><AppText style={styles.sectionTitle}>{title}</AppText>{action}</View>;
}

export function MetricCard({ label, value, icon, tone = "teal", caption }: { label: string; value: string; icon: React.ComponentProps<typeof MaterialIcons>["name"]; tone?: "teal" | "red" | "gold" | "green"; caption?: string }) {
  const palette = metricTones[tone];
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricTop}><View style={[styles.metricIcon, { backgroundColor: palette.soft }]}><MaterialIcons name={icon} size={20} color={palette.color} /></View><AppText style={styles.metricLabel}>{label}</AppText></View>
      <AppText style={[styles.metricValue, { color: palette.color }]}>{value}</AppText>
      {caption ? <AppText style={styles.metricCaption}>{caption}</AppText> : null}
    </View>
  );
}

export function EmptyState({ title, description, icon = "inbox" }: { title: string; description: string; icon?: React.ComponentProps<typeof MaterialIcons>["name"] }) {
  return <View style={styles.empty}><View style={styles.emptyIcon}><MaterialIcons name={icon} color={colors.muted} size={28} /></View><AppText style={styles.emptyTitle}>{title}</AppText><AppText style={styles.emptyDescription}>{description}</AppText></View>;
}

export function StatusPill({ label, tone = "teal" }: { label: string; tone?: "teal" | "gold" | "green" | "red" | "grey" }) {
  const palette = statusTones[tone];
  return <View style={[styles.pill, { backgroundColor: palette.soft }]}><AppText style={[styles.pillText, { color: palette.color }]}>{label}</AppText></View>;
}

export function FormInput({ label, value, onChangeText, placeholder, keyboardType, multiline = false, editable = true, secureTextEntry = false, autoCapitalize = "sentences" }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: "default" | "numeric" | "phone-pad" | "email-address"; multiline?: boolean; editable?: boolean; secureTextEntry?: boolean; autoCapitalize?: "none" | "sentences" | "words" | "characters" }) {
  return <View style={styles.inputBlock}><AppText style={styles.inputLabel}>{label}</AppText><TextInput value={value} editable={editable} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#94A3A0" keyboardType={keyboardType} multiline={multiline} secureTextEntry={secureTextEntry} autoCapitalize={autoCapitalize} autoCorrect={false} textAlign="right" style={[styles.input, multiline && styles.textarea, !editable && styles.inputDisabled]} /></View>;
}

export function SelectField({ label, value, placeholder, onPress }: { label: string; value?: string; placeholder: string; onPress: () => void }) {
  return <View style={styles.inputBlock}><AppText style={styles.inputLabel}>{label}</AppText><Pressable onPress={onPress} style={({ pressed }) => [styles.select, pressed && styles.pressed]}><MaterialIcons name="expand-more" size={22} color={colors.muted} /><AppText style={[styles.selectText, !value && styles.selectPlaceholder]}>{value || placeholder}</AppText></Pressable></View>;
}

export function SelectionSheet({ visible, title, items, onClose, onSelect }: { visible: boolean; title: string; items: Array<{ id: number; label: string; subtitle?: string }>; onClose: () => void; onSelect: (item: { id: number; label: string; subtitle?: string }) => void }) {
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><Pressable style={styles.sheetBackdrop} onPress={onClose}><Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}><View style={styles.sheetHandle} /><View style={styles.sheetTitleRow}><AppText style={styles.sheetTitle}>{title}</AppText><IconButton icon="close" onPress={onClose} /></View><ScrollView showsVerticalScrollIndicator={false}>{items.length ? items.map((item) => <Pressable key={item.id} onPress={() => onSelect(item)} style={({ pressed }) => [styles.sheetItem, pressed && styles.pressed]}><View><AppText style={styles.sheetItemTitle}>{item.label}</AppText>{item.subtitle ? <AppText style={styles.sheetItemSubtitle}>{item.subtitle}</AppText> : null}</View><MaterialIcons name="chevron-left" size={22} color={colors.muted} /></Pressable>) : <EmptyState title="لا توجد عناصر" description="أضف بيانات أولاً ثم عُد للاختيار." />}</ScrollView></Pressable></Pressable></Modal>;
}

const metricTones = {
  teal: { color: colors.primary, soft: colors.tealSoft }, red: { color: colors.danger, soft: colors.dangerSoft }, gold: { color: colors.warning, soft: colors.goldSoft }, green: { color: colors.success, soft: "#E8F7EE" },
};
const statusTones = { teal: metricTones.teal, red: metricTones.red, gold: metricTones.gold, green: metricTones.green, grey: { color: colors.muted, soft: "#EDF1F0" } };
const styles = StyleSheet.create({
  text: { fontFamily: "Cairo-Regular", color: colors.ink, textAlign: "right", writingDirection: "rtl" }, fill: { flex: 1 }, scroll: { padding: 20, paddingBottom: 34, gap: 18 }, titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, titleCopy: { flex: 1, alignItems: "flex-end" }, title: { fontFamily: "Cairo-Bold", fontSize: 24, lineHeight: 34 }, subtitle: { color: colors.muted, fontSize: 12, marginTop: 2 }, button: { minHeight: 46, borderRadius: 14, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16 }, buttonCompact: { minHeight: 38, paddingHorizontal: 12, borderRadius: 12 }, buttonPrimary: { backgroundColor: colors.primary }, buttonSecondary: { backgroundColor: colors.tealSoft, borderWidth: 1, borderColor: "#B9DED8" }, buttonDanger: { backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: "#F2B8B5" }, buttonGhost: { backgroundColor: "transparent" }, buttonText: { fontFamily: "Cairo-SemiBold", fontSize: 14, lineHeight: 20 }, buttonTextCompact: { fontSize: 12 }, disabled: { opacity: 0.5 }, pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] }, iconButton: { height: 40, width: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" }, iconDefault: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, iconPrimary: { backgroundColor: colors.tealSoft }, iconDanger: { backgroundColor: colors.dangerSoft }, sectionHeader: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginTop: 2 }, sectionTitle: { fontFamily: "Cairo-Bold", fontSize: 16 }, metricCard: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 14, minHeight: 132 }, metricTop: { flexDirection: "row-reverse", alignItems: "center", gap: 8 }, metricIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" }, metricLabel: { color: colors.muted, fontSize: 11, flex: 1 }, metricValue: { fontFamily: "Cairo-Bold", fontSize: 20, marginTop: 12, textAlign: "right" }, metricCaption: { color: colors.muted, fontSize: 10, marginTop: 3 }, empty: { alignItems: "center", paddingVertical: 30, paddingHorizontal: 20 }, emptyIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: "#EDF1F0", alignItems: "center", justifyContent: "center", marginBottom: 10 }, emptyTitle: { fontFamily: "Cairo-Bold", fontSize: 15, textAlign: "center" }, emptyDescription: { color: colors.muted, fontSize: 12, textAlign: "center", lineHeight: 20, marginTop: 4 }, pill: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }, pillText: { fontFamily: "Cairo-SemiBold", fontSize: 10 }, inputBlock: { gap: 6 }, inputLabel: { fontFamily: "Cairo-SemiBold", fontSize: 12, color: colors.ink }, input: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 13, paddingVertical: 10, color: colors.ink, fontFamily: "Cairo-Regular", fontSize: 14, writingDirection: "rtl" }, textarea: { minHeight: 92, textAlignVertical: "top" }, inputDisabled: { backgroundColor: "#EDF1F0", color: colors.muted }, select: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, selectText: { fontSize: 13, flex: 1, marginRight: 8 }, selectPlaceholder: { color: "#94A3A0" }, sheetBackdrop: { flex: 1, backgroundColor: "rgba(18, 38, 34, 0.42)", justifyContent: "flex-end" }, sheet: { maxHeight: "76%", backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 18, paddingBottom: 26 }, sheetHandle: { width: 42, height: 5, borderRadius: 4, backgroundColor: "#C3D0CD", alignSelf: "center", marginBottom: 14 }, sheetTitleRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }, sheetTitle: { fontFamily: "Cairo-Bold", fontSize: 18 }, sheetItem: { minHeight: 66, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 10 }, sheetItemTitle: { fontFamily: "Cairo-SemiBold", fontSize: 14 }, sheetItemSubtitle: { color: colors.muted, fontSize: 11, marginTop: 2 },
});

const buttonStyles = { primary: { container: styles.buttonPrimary, text: "#FFFFFF", icon: "#FFFFFF" }, secondary: { container: styles.buttonSecondary, text: colors.primary, icon: colors.primary }, danger: { container: styles.buttonDanger, text: colors.danger, icon: colors.danger }, ghost: { container: styles.buttonGhost, text: colors.primary, icon: colors.primary } };
