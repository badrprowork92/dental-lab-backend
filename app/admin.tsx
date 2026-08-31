import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, type Href } from "expo-router";
import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";

import { DateField } from "@/components/date-field";
import { AppText, colors, EmptyState, FormInput, IconButton, LabScreen, PrimaryButton, ScreenTitle, StatusPill } from "@/components/lab-ui";
import { trpc } from "@/lib/trpc";
import { useLabSession } from "@/providers/lab-session-provider";

type NewLabForm = { labCode: string; displayName: string; maxDevices: string; username: string; email: string; password: string; subscriptionStartDate: string; subscriptionEndDate: string };
type UserForm = { username: string; email: string; password: string; maxDevices: string };
type ManagedUser = { id: number; username: string; email: string | null; isActive: boolean; mustChangePassword: boolean; maxDevices?: number };

const today = new Date().toISOString().slice(0, 10);
const nextYear = `${Number(today.slice(0, 4)) + 1}${today.slice(4)}`;
const emptyLab: NewLabForm = { labCode: "", displayName: "", maxDevices: "1", username: "", email: "", password: "", subscriptionStartDate: today, subscriptionEndDate: nextYear };
const emptyUser: UserForm = { username: "", email: "", password: "", maxDevices: "1" };

export default function AdminScreen() {
  const { session, signOut } = useLabSession();
  const utils = trpc.useUtils();
  const labs = trpc.admin.labs.useQuery(undefined, { enabled: session?.role === "admin" });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<NewLabForm>(emptyLab);
  const [devicesFor, setDevicesFor] = useState<{ id: number; name: string } | null>(null);
  const [subscriptionFor, setSubscriptionFor] = useState<{ id: number; name: string; active: boolean; maxDevices: number } | null>(null);
  const [subscriptionStart, setSubscriptionStart] = useState(today);
  const [subscriptionEnd, setSubscriptionEnd] = useState(nextYear);
  const [usersFor, setUsersFor] = useState<{ id: number; name: string } | null>(null);
  const [userForm, setUserForm] = useState<UserForm>(emptyUser);
  const [showUserForm, setShowUserForm] = useState(false);
  const [resetFor, setResetFor] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const createLab = trpc.admin.createLab.useMutation({ onSuccess: async () => { setForm(emptyLab); setShowCreate(false); await utils.admin.labs.invalidate(); } });
  const updateLab = trpc.admin.updateLab.useMutation({ onSuccess: () => void utils.admin.labs.invalidate() });
  const devices = trpc.admin.devices.useQuery({ labId: devicesFor?.id ?? 0 }, { enabled: Boolean(devicesFor) });
  const users = trpc.admin.labUsers.useQuery({ labId: usersFor?.id ?? 0 }, { enabled: Boolean(usersFor) });
  const removeDevice = trpc.admin.removeDevice.useMutation({ onSuccess: () => void devices.refetch() });
  const createUser = trpc.admin.createLabUser.useMutation({ onSuccess: async () => { setUserForm(emptyUser); setShowUserForm(false); await users.refetch(); await utils.admin.labs.invalidate(); } });
  const resetPassword = trpc.admin.resetLabUserPassword.useMutation({ onSuccess: async () => { setNewPassword(""); setResetFor(null); await users.refetch(); Alert.alert("تمت إعادة التعيين", "تم تعيين كلمة المرور المؤقتة وإلغاء جلسات هذا المستخدم السابقة."); } });
  const setUserActive = trpc.admin.setLabUserActive.useMutation({ onSuccess: async () => { await users.refetch(); Alert.alert("تم تحديث الحساب", "تم تعديل حالة الحساب وإلغاء جلساته السابقة."); } });
  const deleteSuspendedUser = trpc.admin.deleteSuspendedLabUser.useMutation({ onSuccess: async () => { await users.refetch(); await utils.admin.labs.invalidate(); Alert.alert("تم حذف الحساب", "حُذف حساب المستخدم الموقوف نهائيًا."); } });

  if (session?.role !== "admin") return <LabScreen><EmptyState title="الوصول غير متاح" description="هذه الشاشة مخصصة لحساب المسؤول فقط." icon="lock" /></LabScreen>;

  const submitLab = async () => {
    if (form.subscriptionEndDate < form.subscriptionStartDate) return Alert.alert("تاريخ غير صحيح", "يجب أن يكون تاريخ الانتهاء بعد تاريخ البداية.");
    try {
      await createLab.mutateAsync({ labCode: form.labCode.trim().toLowerCase(), displayName: form.displayName.trim(), maxDevices: Number(form.maxDevices), username: form.username.trim(), email: form.email.trim() || undefined, password: form.password, subscriptionStartDate: form.subscriptionStartDate, subscriptionEndDate: form.subscriptionEndDate });
      Alert.alert("تمت إضافة المختبر", "أصبح حساب المختبر جاهزًا حتى تاريخ انتهاء الاشتراك المحدد.");
    } catch (error) { Alert.alert("تعذر إضافة المختبر", error instanceof Error ? error.message : "تحقق من البيانات المدخلة."); }
  };
  const openSubscription = (lab: NonNullable<typeof labs.data>[number]) => {
    setSubscriptionFor({ id: lab.id, name: lab.displayName, active: lab.isActive, maxDevices: lab.maxDevices });
    setSubscriptionStart(lab.subscriptionStartDate || today);
    setSubscriptionEnd(lab.subscriptionEndDate || nextYear);
  };
  const saveSubscription = async () => {
    if (!subscriptionFor) return;
    if (subscriptionEnd < subscriptionStart) return Alert.alert("تاريخ غير صحيح", "يجب أن يكون تاريخ الانتهاء بعد تاريخ البداية.");
    try {
      await updateLab.mutateAsync({ id: subscriptionFor.id, displayName: subscriptionFor.name, isActive: subscriptionFor.active, maxDevices: subscriptionFor.maxDevices, subscriptionStartDate: subscriptionStart, subscriptionEndDate: subscriptionEnd });
      setSubscriptionFor(null);
      Alert.alert("تم حفظ الاشتراك", "سيُمنع الدخول تلقائيًا بعد تاريخ الانتهاء.");
    } catch (error) { Alert.alert("تعذر الحفظ", error instanceof Error ? error.message : "تعذر تحديث الاشتراك."); }
  };
  const submitUser = async () => {
    if (!usersFor) return;
    try {
      await createUser.mutateAsync({ labId: usersFor.id, username: userForm.username.trim(), email: userForm.email.trim() || undefined, password: userForm.password, maxDevices: Number(userForm.maxDevices) });
      Alert.alert("تم إنشاء الحساب", "أصبح المستخدم قادرًا على دخول بيانات المختبر نفسه من جهاز مسموح.");
    } catch (error) { Alert.alert("تعذر إنشاء الحساب", error instanceof Error ? error.message : "تحقق من بيانات الحساب."); }
  };
  const submitReset = async () => {
    if (!usersFor || !resetFor || newPassword.length < 10) return Alert.alert("كلمة المرور قصيرة", "أدخل كلمة مرور جديدة من 10 أحرف على الأقل.");
    try { await resetPassword.mutateAsync({ labId: usersFor.id, userId: resetFor, password: newPassword }); } catch (error) { Alert.alert("تعذر إعادة التعيين", error instanceof Error ? error.message : "تعذر تحديث كلمة المرور."); }
  };
  const updateUserStatus = (user: ManagedUser) => {
    if (!usersFor) return;
    const nextActive = !user.isActive;
    Alert.alert(nextActive ? "تفعيل الحساب" : "إيقاف الحساب", nextActive ? `هل تريد إعادة تفعيل حساب ${user.username}؟` : `سيتم منع ${user.username} من الدخول وإلغاء جلساته. هل تريد المتابعة؟`, [
      { text: "إلغاء", style: "cancel" },
      { text: nextActive ? "تفعيل" : "إيقاف", style: nextActive ? "default" : "destructive", onPress: () => setUserActive.mutate({ labId: usersFor.id, userId: user.id, isActive: nextActive }) },
    ]);
  };
  const removeUser = (user: ManagedUser) => {
    if (!usersFor) return;
    Alert.alert("حذف حساب موقوف", `سيُحذف حساب ${user.username} نهائيًا. لا يمكن التراجع عن هذا الإجراء.`, [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف نهائي", style: "destructive", onPress: () => deleteSuspendedUser.mutate({ labId: usersFor.id, userId: user.id }) },
    ]);
  };

  return <LabScreen style={styles.page}>
    <View style={styles.header}>
      <IconButton icon="logout" tone="danger" label="تسجيل الخروج" onPress={() => void signOut().then(() => router.replace("/login" as Href))} />
      <ScreenTitle title="لوحة المسؤول" subtitle={`مرحبًا ${session.username} — إدارة التراخيص والمختبرات`} />
    </View>
    <View style={styles.summary}>
      <View style={styles.summaryIcon}><MaterialIcons name="admin-panel-settings" size={25} color="#FFFFFF" /></View>
      <View style={styles.summaryCopy}><AppText style={styles.summaryTitle}>إدارة الاشتراكات والأجهزة</AppText><AppText style={styles.summaryDescription}>يمكنك ضبط مدة الاشتراك، إدارة المستخدمين، وإلغاء وصول الأجهزة أو الحسابات عند الحاجة.</AppText></View>
    </View>
    <PrimaryButton label="إضافة مختبر جديد" icon="add-business" onPress={() => setShowCreate(true)} />
    <View style={styles.sectionRow}><AppText style={styles.sectionTitle}>المختبرات المسجلة</AppText><StatusPill label={`${labs.data?.length ?? 0} مختبر`} /></View>
    {labs.data?.length ? labs.data.map((lab) => <View key={lab.id} style={styles.labCard}>
      <View style={styles.labHead}><View><AppText style={styles.labName}>{lab.displayName}</AppText><AppText style={styles.labCode}>رمز الاشتراك: {lab.labCode}</AppText><AppText style={styles.subscription}>{lab.subscriptionEndDate ? `ينتهي: ${lab.subscriptionEndDate}` : "لا يوجد تاريخ انتهاء محدد"}</AppText></View><StatusPill label={lab.subscriptionState === "expired" ? "منتهي" : lab.isActive ? "مفعّل" : "موقوف"} tone={lab.subscriptionState === "expired" || !lab.isActive ? "red" : "green"} /></View>
      <View style={styles.metrics}><View><AppText style={styles.metricValue}>{lab.deviceCount}/{lab.maxDevices}</AppText><AppText style={styles.metricLabel}>الأجهزة</AppText></View><View><AppText style={styles.metricValue}>{lab.userCount}</AppText><AppText style={styles.metricLabel}>الحسابات</AppText></View><View style={styles.switchBox}><AppText style={styles.metricLabel}>تفعيل</AppText><Switch value={lab.isActive} trackColor={{ false: "#F2B8B5", true: "#94CFC7" }} thumbColor={lab.isActive ? colors.primary : colors.danger} onValueChange={(isActive) => updateLab.mutate({ id: lab.id, displayName: lab.displayName, isActive, maxDevices: lab.maxDevices, subscriptionStartDate: lab.subscriptionStartDate, subscriptionEndDate: lab.subscriptionEndDate })} /></View></View>
      <View style={styles.actions}><PrimaryButton label="الاشتراك" icon="event" compact variant="secondary" onPress={() => openSubscription(lab)} /><PrimaryButton label="الحسابات" icon="manage-accounts" compact variant="secondary" onPress={() => { setUsersFor({ id: lab.id, name: lab.displayName }); setShowUserForm(false); setResetFor(null); }} /><PrimaryButton label="الأجهزة" icon="phonelink-lock" compact variant="ghost" onPress={() => setDevicesFor({ id: lab.id, name: lab.displayName })} /><PrimaryButton label="بيانات" icon="business" compact variant="ghost" onPress={() => router.push(`/lab-profile?labId=${lab.id}` as Href)} /></View>
    </View>) : <EmptyState title="لا توجد مختبرات إضافية" description="أضف مختبرًا جديدًا لإنشاء حسابه ورخصته." icon="business" />}

    <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}><Pressable style={styles.backdrop} onPress={() => setShowCreate(false)}><Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}><ScrollView keyboardShouldPersistTaps="handled"><View style={styles.sheetHeader}><IconButton icon="close" onPress={() => setShowCreate(false)} /><ScreenTitle title="إضافة مختبر" subtitle="أنشئ حساب الدخول وحدد مدة الاشتراك." /></View><View style={styles.form}><FormInput label="اسم المختبر" value={form.displayName} onChangeText={(value) => setForm((current) => ({ ...current, displayName: value }))} placeholder="مثال: معمل الثقة" /><FormInput label="رمز الاشتراك" value={form.labCode} onChangeText={(value) => setForm((current) => ({ ...current, labCode: value.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase() }))} placeholder="مثال: thiqa-2026" autoCapitalize="none" /><FormInput label="الحد الأقصى للأجهزة" value={form.maxDevices} onChangeText={(value) => setForm((current) => ({ ...current, maxDevices: value }))} keyboardType="numeric" /><View style={styles.dates}><View style={styles.flex}><DateField label="بداية الاشتراك" value={form.subscriptionStartDate} onChange={(value) => setForm((current) => ({ ...current, subscriptionStartDate: value }))} /></View><View style={styles.flex}><DateField label="نهاية الاشتراك" value={form.subscriptionEndDate} onChange={(value) => setForm((current) => ({ ...current, subscriptionEndDate: value }))} /></View></View><FormInput label="اسم مستخدم المختبر" value={form.username} onChangeText={(value) => setForm((current) => ({ ...current, username: value }))} autoCapitalize="none" /><FormInput label="البريد الإلكتروني (اختياري)" value={form.email} onChangeText={(value) => setForm((current) => ({ ...current, email: value }))} autoCapitalize="none" keyboardType="email-address" /><FormInput label="كلمة المرور الأولى" value={form.password} onChangeText={(value) => setForm((current) => ({ ...current, password: value }))} secureTextEntry autoCapitalize="none" /><PrimaryButton label={createLab.isPending ? "جارٍ إنشاء الحساب…" : "إنشاء المختبر والحساب"} icon="verified" onPress={() => void submitLab()} disabled={createLab.isPending || form.displayName.length < 2 || form.labCode.length < 3 || form.username.length < 3 || form.password.length < 10 || Number(form.maxDevices) < 1} /></View></ScrollView></Pressable></Pressable></Modal>
    <Modal visible={Boolean(subscriptionFor)} transparent animationType="slide" onRequestClose={() => setSubscriptionFor(null)}><Pressable style={styles.backdrop} onPress={() => setSubscriptionFor(null)}><Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}><View style={styles.sheetHeader}><IconButton icon="close" onPress={() => setSubscriptionFor(null)} /><ScreenTitle title="مدة الاشتراك" subtitle={subscriptionFor?.name} /></View><View style={styles.form}><DateField label="تاريخ البداية" value={subscriptionStart} onChange={setSubscriptionStart} /><DateField label="تاريخ الانتهاء" value={subscriptionEnd} onChange={setSubscriptionEnd} /><AppText style={styles.explanation}>عند تجاوز تاريخ الانتهاء، يمنع النظام الدخول تلقائيًا بينما تبقى بيانات المختبر محفوظة.</AppText><PrimaryButton label={updateLab.isPending ? "جارٍ الحفظ…" : "حفظ مدة الاشتراك"} icon="event-available" onPress={() => void saveSubscription()} disabled={updateLab.isPending} /></View></Pressable></Pressable></Modal>
    <Modal visible={Boolean(usersFor)} transparent animationType="slide" onRequestClose={() => setUsersFor(null)}><Pressable style={styles.backdrop} onPress={() => setUsersFor(null)}><Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}><ScrollView keyboardShouldPersistTaps="handled"><View style={styles.sheetHeader}><IconButton icon="close" onPress={() => setUsersFor(null)} /><ScreenTitle title="حسابات المختبر" subtitle={usersFor?.name} /></View><PrimaryButton label={showUserForm ? "إخفاء النموذج" : "إضافة حساب مستخدم"} icon="person-add" variant="secondary" onPress={() => setShowUserForm((current) => !current)} />{showUserForm ? <View style={styles.form}><FormInput label="اسم المستخدم" value={userForm.username} onChangeText={(value) => setUserForm((current) => ({ ...current, username: value }))} autoCapitalize="none" /><FormInput label="البريد الإلكتروني (اختياري)" value={userForm.email} onChangeText={(value) => setUserForm((current) => ({ ...current, email: value }))} autoCapitalize="none" keyboardType="email-address" /><FormInput label="كلمة المرور الأولى" value={userForm.password} onChangeText={(value) => setUserForm((current) => ({ ...current, password: value }))} secureTextEntry autoCapitalize="none" /><FormInput label="أقصى عدد أجهزة لهذا المستخدم" value={userForm.maxDevices} onChangeText={(value) => setUserForm((current) => ({ ...current, maxDevices: value }))} keyboardType="numeric" /><PrimaryButton label={createUser.isPending ? "جارٍ الإنشاء…" : "إنشاء حساب"} icon="save" onPress={() => void submitUser()} disabled={createUser.isPending || userForm.username.length < 3 || userForm.password.length < 10 || Number(userForm.maxDevices) < 1} /></View> : null}<View style={styles.userList}>{users.data?.map((user) => <View key={user.id} style={styles.userRow}><View style={styles.userCopy}><View style={styles.userTitleRow}><AppText style={styles.userName}>{user.username}</AppText><StatusPill label={user.isActive ? "نشط" : "موقوف"} tone={user.isActive ? "green" : "red"} /></View><AppText style={styles.userMeta}>{user.email || "دون بريد"} · الأجهزة المسموحة: {user.maxDevices ?? 1}{user.mustChangePassword ? " · مطلوب تغيير كلمة المرور" : ""}</AppText></View><View style={styles.userActions}><Pressable onPress={() => { setResetFor(user.id); setNewPassword(""); }}><AppText style={styles.resetText}>إعادة تعيين</AppText></Pressable><Pressable onPress={() => updateUserStatus(user)}><AppText style={user.isActive ? styles.pauseText : styles.resumeText}>{user.isActive ? "إيقاف" : "تفعيل"}</AppText></Pressable>{!user.isActive ? <Pressable onPress={() => removeUser(user)}><AppText style={styles.deleteText}>حذف</AppText></Pressable> : null}</View></View>)}</View>{resetFor ? <View style={styles.resetBox}><AppText style={styles.resetTitle}>تعيين كلمة مرور مؤقتة</AppText><FormInput label="كلمة المرور الجديدة" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" placeholder="10 أحرف على الأقل" /><PrimaryButton label={resetPassword.isPending ? "جارٍ التعيين…" : "حفظ وإلغاء الجلسات"} icon="lock-reset" onPress={() => void submitReset()} disabled={resetPassword.isPending} /></View> : null}{!users.data?.length ? <EmptyState title="لا توجد حسابات" description="أنشئ حساب مستخدم ليتمكن المختبر من تسجيل الدخول." icon="person-add" /> : null}</ScrollView></Pressable></Pressable></Modal>
    <Modal visible={Boolean(devicesFor)} transparent animationType="slide" onRequestClose={() => setDevicesFor(null)}><Pressable style={styles.backdrop} onPress={() => setDevicesFor(null)}><Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}><View style={styles.sheetHeader}><IconButton icon="close" onPress={() => setDevicesFor(null)} /><ScreenTitle title="الأجهزة المسجلة" subtitle={devicesFor?.name} /></View>{devices.data?.length ? devices.data.map((device) => <View key={device.id} style={styles.deviceRow}><View style={styles.deviceCopy}><AppText style={styles.deviceName}>{device.deviceLabel || "جهاز غير مسمّى"}</AppText><AppText style={styles.deviceDate}>آخر ظهور: {new Date(device.lastSeenAt).toLocaleDateString("ar-YE")}</AppText></View><IconButton icon="delete-outline" tone="danger" label="إزالة الجهاز" onPress={() => Alert.alert("إزالة الجهاز", "سيسمح هذا بتسجيل جهاز آخر بدلًا منه.", [{ text: "إلغاء", style: "cancel" }, { text: "إزالة", style: "destructive", onPress: () => removeDevice.mutate({ labId: devicesFor!.id, id: device.id }) }])} /></View>) : <EmptyState title="لا توجد أجهزة مسجلة" description="سيظهر الجهاز هنا عند أول دخول من حساب المختبر." icon="phonelink" />}</Pressable></Pressable></Modal>
  </LabScreen>;
}

const styles = StyleSheet.create({
  page: { gap: 15 }, header: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 12 }, summary: { backgroundColor: colors.primary, borderRadius: 22, padding: 16, flexDirection: "row-reverse", gap: 12, alignItems: "center" }, summaryIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: "#168A7F", alignItems: "center", justifyContent: "center" }, summaryCopy: { flex: 1 }, summaryTitle: { color: "#FFFFFF", fontFamily: "Cairo-Bold", fontSize: 16 }, summaryDescription: { color: "#D9F5EF", fontSize: 11, lineHeight: 18, marginTop: 2 }, sectionRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginTop: 6 }, sectionTitle: { fontFamily: "Cairo-Bold", fontSize: 16 }, labCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 15, gap: 12 }, labHead: { flexDirection: "row-reverse", justifyContent: "space-between", gap: 10 }, labName: { fontFamily: "Cairo-Bold", fontSize: 16, textAlign: "right" }, labCode: { color: colors.muted, fontSize: 11, marginTop: 2, textAlign: "right" }, subscription: { color: colors.primary, fontFamily: "Cairo-SemiBold", fontSize: 10, marginTop: 4, textAlign: "right" }, metrics: { flexDirection: "row-reverse", backgroundColor: colors.background, borderRadius: 14, padding: 10, justifyContent: "space-between" }, metricValue: { color: colors.primary, fontFamily: "Cairo-Bold", fontSize: 15, textAlign: "center" }, metricLabel: { color: colors.muted, fontSize: 10, textAlign: "center" }, switchBox: { alignItems: "center", gap: 2 }, actions: { flexDirection: "row-reverse", gap: 8, flexWrap: "wrap" }, backdrop: { flex: 1, backgroundColor: "rgba(18,48,45,0.46)", justifyContent: "flex-end" }, sheet: { backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 18, paddingBottom: 32, maxHeight: "90%" }, sheetHeader: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 12, marginBottom: 14 }, form: { gap: 12, marginTop: 12 }, dates: { flexDirection: "row-reverse", gap: 8 }, flex: { flex: 1 }, explanation: { backgroundColor: colors.goldSoft, color: colors.warning, padding: 11, borderRadius: 12, fontSize: 11, lineHeight: 18, textAlign: "right" }, userList: { marginTop: 14, gap: 6 }, userRow: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 11, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", gap: 8 }, userCopy: { flex: 1, alignItems: "flex-end" }, userTitleRow: { flexDirection: "row-reverse", alignItems: "center", gap: 7 }, userName: { fontFamily: "Cairo-Bold", fontSize: 13 }, userMeta: { color: colors.muted, fontSize: 10, textAlign: "right", marginTop: 2 }, userActions: { flexDirection: "row-reverse", gap: 10, alignItems: "center" }, resetText: { color: colors.primary, fontFamily: "Cairo-SemiBold", fontSize: 10 }, pauseText: { color: colors.warning, fontFamily: "Cairo-SemiBold", fontSize: 10 }, resumeText: { color: colors.primary, fontFamily: "Cairo-SemiBold", fontSize: 10 }, deleteText: { color: colors.danger, fontFamily: "Cairo-SemiBold", fontSize: 10 }, resetBox: { marginTop: 14, borderRadius: 16, padding: 13, backgroundColor: colors.goldSoft, gap: 9 }, resetTitle: { color: colors.warning, fontFamily: "Cairo-Bold", textAlign: "right" }, deviceRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 11 }, deviceCopy: { flex: 1 }, deviceName: { fontFamily: "Cairo-SemiBold", fontSize: 13 }, deviceDate: { color: colors.muted, fontSize: 10, marginTop: 2 },
});
