import { router, type Href } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { AppText, FormInput, IconButton, LabScreen, PrimaryButton, ScreenTitle, colors } from "@/components/lab-ui";
import { trpc } from "@/lib/trpc";
import { useLabSession } from "@/providers/lab-session-provider";

export default function ChangePasswordScreen() {
  const { session, signIn, signOut } = useLabSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const change = trpc.lab.account.changePassword.useMutation();
  const submit = async () => {
    if (!currentPassword || newPassword.length < 10) return Alert.alert("بيانات مطلوبة", "أدخل كلمة المرور الحالية وكلمة مرور جديدة لا تقل عن 10 أحرف.");
    if (newPassword !== confirmation) return Alert.alert("عدم تطابق", "تأكيد كلمة المرور الجديدة غير مطابق.");
    try { const result = await change.mutateAsync({ currentPassword, newPassword }); await signIn(result.token); Alert.alert("تم تغيير كلمة المرور", "تم إلغاء جلساتك السابقة وتحديث كلمة المرور بنجاح."); router.replace((session?.role === "admin" ? "/admin" : "/(tabs)") as Href); } catch (error) { Alert.alert("تعذر التغيير", error instanceof Error ? error.message : "تعذر تحديث كلمة المرور."); }
  };
  return <LabScreen style={styles.page}><View style={styles.header}><IconButton icon="logout" tone="danger" label="تسجيل الخروج" onPress={() => void signOut().then(() => router.replace("/login" as Href))} /><ScreenTitle title="تغيير كلمة المرور" subtitle="لأمان الحساب، عيّن كلمة مرورك الخاصة قبل متابعة استخدام التطبيق." /></View><View style={styles.notice}><AppText style={styles.noticeText}>هذه الخطوة مطلوبة بعد إعادة تعيين كلمة المرور من حساب المسؤول.</AppText></View><View style={styles.form}><FormInput label="كلمة المرور الحالية / المؤقتة" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoCapitalize="none" /><FormInput label="كلمة المرور الجديدة" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" placeholder="10 أحرف على الأقل" /><FormInput label="تأكيد كلمة المرور الجديدة" value={confirmation} onChangeText={setConfirmation} secureTextEntry autoCapitalize="none" /></View><PrimaryButton label={change.isPending ? "جارٍ الحفظ…" : "تغيير كلمة المرور"} icon="lock-reset" onPress={() => void submit()} disabled={change.isPending} /></LabScreen>;
}
const styles = StyleSheet.create({ page: { gap: 16, paddingTop: 34 }, header: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 12 }, notice: { backgroundColor: colors.goldSoft, padding: 14, borderRadius: 16 }, noticeText: { color: colors.warning, fontFamily: "Cairo-SemiBold", fontSize: 11, lineHeight: 19, textAlign: "right" }, form: { gap: 13 } });
