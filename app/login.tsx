import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, type Href } from "expo-router";

import { AppText, colors, FormInput, LabScreen, PrimaryButton, ScreenTitle } from "@/components/lab-ui";
import { getDeviceIdentity } from "@/lib/device-identity";
import { useLabSession } from "@/providers/lab-session-provider";
import { trpc } from "@/lib/trpc";

const supportPhone = "00967774824922";
const supportEmail = "badralmolaiky02@gmail.com";

export default function LoginScreen() {
  const { signIn } = useLabSession();
  const status = trpc.license.status.useQuery(undefined, { retry: false });
  const login = trpc.license.login.useMutation();
  const bootstrap = trpc.license.bootstrapAdmin.useMutation();
  const resetAdmin = trpc.license.resetAdminEmergency.useMutation();
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [deviceLabel, setDeviceLabel] = useState("");
  const [showSubscription, setShowSubscription] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [showAdminRecovery, setShowAdminRecovery] = useState(false);
  const [adminRecovery, setAdminRecovery] = useState({ emergencyCode: "", password: "", confirmation: "" });
  const [showSetup, setShowSetup] = useState(false);
  const [setup, setSetup] = useState({ username: "", email: "", password: "", setupCode: "" });

  useEffect(() => {
    void getDeviceIdentity().then((device) => {
      setDeviceId(device.id);
      setDeviceLabel(device.label);
    });
  }, []);

  const handleLogin = async () => {
    if (!credential.trim() || !password || !deviceId) return;
    try {
      const result = await login.mutateAsync({ credential, password, deviceId, deviceLabel });
      await signIn(result.token);
      router.replace((result.session.mustChangePassword ? "/change-password" : result.session.role === "admin" ? "/admin" : "/(tabs)") as Href);
    } catch (error) {
      Alert.alert("تعذر تسجيل الدخول", error instanceof Error ? error.message : "تحقق من البيانات ثم أعد المحاولة.");
    }
  };

  const handleBootstrap = async () => {
    try {
      await bootstrap.mutateAsync(setup);
      setShowSetup(false);
      await status.refetch();
      Alert.alert("تم إعداد المسؤول", "يمكنك الآن تسجيل الدخول باسم المستخدم وكلمة المرور التي أنشأتها.");
    } catch (error) {
      Alert.alert("تعذر الإعداد", error instanceof Error ? error.message : "تحقق من بيانات الإعداد.");
    }
  };

  const handleAdminRecovery = async () => {
    if (adminRecovery.emergencyCode.length < 10 || adminRecovery.password.length < 10) return Alert.alert("بيانات مطلوبة", "أدخل رمز طوارئ وكلمة مرور جديدة من 10 أحرف على الأقل.");
    if (adminRecovery.password !== adminRecovery.confirmation) return Alert.alert("عدم تطابق", "تأكيد كلمة المرور الجديدة غير مطابق.");
    try {
      await resetAdmin.mutateAsync({ emergencyCode: adminRecovery.emergencyCode, password: adminRecovery.password });
      setAdminRecovery({ emergencyCode: "", password: "", confirmation: "" });
      setShowAdminRecovery(false);
      Alert.alert("تمت الاستعادة", "تم تعيين كلمة مرور مسؤول جديدة وإلغاء جلسات المسؤول السابقة. يمكنك تسجيل الدخول الآن.");
    } catch (error) {
      Alert.alert("تعذرت الاستعادة", error instanceof Error ? error.message : "تحقق من رمز الطوارئ ثم أعد المحاولة.");
    }
  };

  return (
    <LabScreen style={styles.page}>
      <View style={styles.brand}><View style={styles.brandIcon}><MaterialIcons name="health-and-safety" color="#FFFFFF" size={34} /></View><AppText style={styles.brandTitle}>نظام محاسبة مختبر الأسنان</AppText><AppText style={styles.brandSubtitle}>دخول آمن وإدارة رخصة المختبر</AppText></View>

      <View style={styles.card}>
        <ScreenTitle title="تسجيل الدخول" subtitle="استخدم اسم المستخدم أو البريد الإلكتروني وكلمة المرور." />
        <FormInput label="اسم المستخدم أو البريد الإلكتروني" value={credential} onChangeText={setCredential} placeholder="مثال: lab_user" autoCapitalize="none" keyboardType="email-address" />
        <FormInput label="كلمة المرور" value={password} onChangeText={setPassword} placeholder="أدخل كلمة المرور" secureTextEntry autoCapitalize="none" />
        <PrimaryButton label={login.isPending ? "جارٍ التحقق…" : "دخول آمن"} icon="login" onPress={handleLogin} disabled={login.isPending || !credential.trim() || !password || !deviceId} />
        <Pressable onPress={() => setShowRecovery((value) => !value)} style={({ pressed }) => [styles.recoveryLink, pressed && styles.pressed]}><AppText style={styles.recoveryText}>نسيت كلمة المرور؟</AppText></Pressable>
      </View>
      {showRecovery ? <View style={styles.recovery}><AppText style={styles.recoveryTitle}>طلب استعادة كلمة المرور</AppText><AppText style={styles.recoveryDescription}>أرسل اسم الحساب ومعرّف الجهاز إلى المسؤول. بعد التحقق يصدر لك كلمة مرور مؤقتة، ثم يطلب منك تغييرها عند الدخول.</AppText><PrimaryButton label="طلب الاستعادة عبر واتساب" icon="chat" compact variant="secondary" onPress={() => void Linking.openURL(`https://wa.me/967774824922?text=${encodeURIComponent(`طلب استعادة كلمة مرور\nاسم الحساب: ${credential || "غير مذكور"}\nمعرف الجهاز: ${deviceId}`)}`)} /><PrimaryButton label="طلب الاستعادة عبر البريد" icon="email" compact variant="ghost" onPress={() => void Linking.openURL(`mailto:${supportEmail}?subject=${encodeURIComponent("طلب استعادة كلمة مرور")}&body=${encodeURIComponent(`اسم الحساب: ${credential || "غير مذكور"}\nمعرف الجهاز: ${deviceId}`)}`)} /></View> : null}
      <Pressable onPress={() => setShowAdminRecovery((value) => !value)} style={({ pressed }) => [styles.adminRecoveryLink, pressed && styles.pressed]}><AppText style={styles.adminRecoveryText}>استعادة حساب المسؤول برمز الطوارئ</AppText></Pressable>
      {showAdminRecovery ? <View style={styles.adminRecovery}><AppText style={styles.recoveryTitle}>استعادة حساب المسؤول</AppText><AppText style={styles.recoveryDescription}>استخدم الرمز الذي حفظته خارج التطبيق. لا تشاركه مع أي شخص.</AppText><FormInput label="رمز الطوارئ" value={adminRecovery.emergencyCode} onChangeText={(value) => setAdminRecovery((current) => ({ ...current, emergencyCode: value }))} secureTextEntry autoCapitalize="none" /><FormInput label="كلمة المرور الجديدة" value={adminRecovery.password} onChangeText={(value) => setAdminRecovery((current) => ({ ...current, password: value }))} secureTextEntry autoCapitalize="none" /><FormInput label="تأكيد كلمة المرور الجديدة" value={adminRecovery.confirmation} onChangeText={(value) => setAdminRecovery((current) => ({ ...current, confirmation: value }))} secureTextEntry autoCapitalize="none" /><PrimaryButton label={resetAdmin.isPending ? "جارٍ الاستعادة…" : "تعيين كلمة مرور المسؤول"} icon="lock-reset" onPress={() => void handleAdminRecovery()} disabled={resetAdmin.isPending} /></View> : null}

      <Pressable onPress={() => setShowSubscription((value) => !value)} style={({ pressed }) => [styles.linkCard, pressed && styles.pressed]}>
        <View style={styles.linkIcon}><MaterialIcons name="support-agent" size={22} color={colors.primary} /></View><View style={styles.linkText}><AppText style={styles.linkTitle}>طلب اشتراك جديد</AppText><AppText style={styles.linkDescription}>التواصل مع الدعم وإرسال معرف الجهاز عند الحاجة.</AppText></View><MaterialIcons name={showSubscription ? "expand-less" : "expand-more"} color={colors.muted} size={24} />
      </Pressable>
      {showSubscription ? <View style={styles.subscription}><AppText style={styles.subscriptionTitle}>بيانات التواصل والدعم</AppText><AppText style={styles.deviceLabel}>معرف هذا الجهاز</AppText><AppText style={styles.deviceId}>{deviceId || "جارٍ تجهيز المعرف…"}</AppText><PrimaryButton label="تواصل عبر واتساب" icon="chat" variant="secondary" compact onPress={() => void Linking.openURL(`https://wa.me/967774824922?text=${encodeURIComponent(`أرغب بطلب اشتراك جديد. معرف الجهاز: ${deviceId}`)}`)} /><PrimaryButton label="إرسال بريد للدعم" icon="email" variant="ghost" compact onPress={() => void Linking.openURL(`mailto:${supportEmail}?subject=${encodeURIComponent("طلب اشتراك جديد")}&body=${encodeURIComponent(`رقم التواصل: ${supportPhone}\nمعرف الجهاز: ${deviceId}`)}`)} /></View> : null}

      {status.isLoading ? <ActivityIndicator color={colors.primary} /> : !status.data?.adminReady ? <View style={styles.setupHint}><AppText style={styles.setupTitle}>إعداد المسؤول لأول مرة</AppText><AppText style={styles.setupDescription}>هذه الخطوة تظهر فقط قبل إنشاء أول حساب مسؤول، وتتطلب رمز الإعداد السري.</AppText><PrimaryButton label="إعداد حساب المسؤول" icon="admin-panel-settings" variant="secondary" compact onPress={() => setShowSetup((value) => !value)} />{showSetup ? <View style={styles.setupForm}><FormInput label="اسم المستخدم للمسؤول" value={setup.username} onChangeText={(value) => setSetup((current) => ({ ...current, username: value }))} autoCapitalize="none" /><FormInput label="البريد الإلكتروني (اختياري)" value={setup.email} onChangeText={(value) => setSetup((current) => ({ ...current, email: value }))} autoCapitalize="none" keyboardType="email-address" /><FormInput label="كلمة مرور المسؤول" value={setup.password} onChangeText={(value) => setSetup((current) => ({ ...current, password: value }))} secureTextEntry autoCapitalize="none" /><FormInput label="رمز الإعداد السري" value={setup.setupCode} onChangeText={(value) => setSetup((current) => ({ ...current, setupCode: value }))} secureTextEntry autoCapitalize="none" /><PrimaryButton label={bootstrap.isPending ? "جارٍ الإعداد…" : "حفظ حساب المسؤول"} icon="verified-user" onPress={handleBootstrap} disabled={bootstrap.isPending || setup.username.length < 3 || setup.password.length < 10 || setup.setupCode.length < 12} /></View> : null}</View> : null}
    </LabScreen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16, paddingTop: 34 }, brand: { alignItems: "center", paddingVertical: 12 }, brandIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 12 }, brandTitle: { fontFamily: "Cairo-Bold", fontSize: 22, textAlign: "center" }, brandSubtitle: { color: colors.muted, fontSize: 12, textAlign: "center", marginTop: 4 }, card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 24, padding: 18, gap: 14 }, recoveryLink: { alignSelf: "flex-start", paddingVertical: 4 }, recoveryText: { color: colors.primary, fontFamily: "Cairo-SemiBold", fontSize: 11 }, recovery: { backgroundColor: colors.goldSoft, borderRadius: 18, padding: 15, gap: 9 }, recoveryTitle: { color: colors.warning, fontFamily: "Cairo-Bold", fontSize: 14, textAlign: "right" }, recoveryDescription: { color: colors.muted, fontSize: 11, lineHeight: 18, textAlign: "right" }, adminRecoveryLink: { alignItems: "center", paddingVertical: 3 }, adminRecoveryText: { color: colors.muted, fontFamily: "Cairo-SemiBold", fontSize: 10 }, adminRecovery: { backgroundColor: colors.tealSoft, borderRadius: 18, padding: 15, gap: 9 }, linkCard: { backgroundColor: colors.tealSoft, borderRadius: 18, padding: 14, flexDirection: "row-reverse", alignItems: "center", gap: 10 }, linkIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }, linkText: { flex: 1 }, linkTitle: { fontFamily: "Cairo-Bold", fontSize: 14 }, linkDescription: { color: colors.muted, fontSize: 11, marginTop: 2 }, subscription: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, gap: 10 }, subscriptionTitle: { fontFamily: "Cairo-Bold", fontSize: 15 }, deviceLabel: { color: colors.muted, fontSize: 11 }, deviceId: { fontFamily: "Cairo-SemiBold", color: colors.primary, fontSize: 12, textAlign: "left", writingDirection: "ltr" }, setupHint: { borderWidth: 1, borderColor: "#F2D9A5", backgroundColor: colors.goldSoft, borderRadius: 18, padding: 15, gap: 9 }, setupTitle: { fontFamily: "Cairo-Bold", fontSize: 14 }, setupDescription: { color: colors.muted, fontSize: 11, lineHeight: 18 }, setupForm: { gap: 10, paddingTop: 4 }, pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
