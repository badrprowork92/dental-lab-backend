import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { AppText, EmptyState, LabScreen, PrimaryButton, ScreenTitle, StatusPill, colors } from "@/components/lab-ui";
import { formatMoney } from "@/lib/lab-format";
import { trpc } from "@/lib/trpc";

export default function ClientsScreen() {
  const { data, isLoading, isError } = trpc.lab.clients.list.useQuery();
  const utils = trpc.useUtils();
  const remove = trpc.lab.clients.delete.useMutation({
    onSuccess: async () => { await Promise.all([utils.lab.clients.invalidate(), utils.lab.bootstrap.invalidate(), utils.lab.reports.invalidate(), utils.lab.dashboard.invalidate()]); },
    onError: (error) => Alert.alert("تعذر الحذف", error.message),
  });

  if (isLoading) return <LabScreen scroll={false} style={styles.loading}><ActivityIndicator color={colors.primary} size="large" /></LabScreen>;
  return <LabScreen>
    <ScreenTitle title="الأطباء والعيادات" subtitle="الأرصدة والبيانات الأساسية" action={<PrimaryButton label="إضافة طبيب" onPress={() => router.push("/client-form" as never)} icon="person-add" compact />} />
    {isError ? <EmptyState title="تعذر تحميل الأطباء" description="تحقق من الاتصال ثم أعد المحاولة." icon="cloud-off" /> : !data?.length ? <EmptyState title="لا يوجد أطباء بعد" description="أضف الطبيب أو العيادة الأولى للبدء." icon="groups" /> : <View style={styles.list}>
      {data.map((client) => <View key={client.id} style={styles.card}>
        <Pressable style={({ pressed }) => [styles.main, pressed && styles.pressed]} onPress={() => router.push({ pathname: "/(tabs)/reports" as never, params: { clientId: String(client.id) } } as never)}>
          <View style={styles.top}><View><StatusPill label={Number(client.currentBalance) > 0 ? "مستحق" : Number(client.currentBalance) < 0 ? "دائن" : "متوازن"} tone={Number(client.currentBalance) > 0 ? "red" : Number(client.currentBalance) < 0 ? "green" : "grey"} /><AppText style={styles.balance}>{formatMoney(client.currentBalance)}</AppText></View><View style={styles.right}><AppText style={styles.doctor}>{client.doctorName}</AppText><AppText style={styles.clinic}>{client.clinicName}</AppText></View></View>
          <View style={styles.bottom}><AppText style={styles.phone}>{client.phoneNumber || "لا يوجد رقم هاتف"}</AppText><AppText style={styles.ledger}>فتح كشف الحساب ←</AppText></View>
        </Pressable>
        <View style={styles.cardActions}>
          <Pressable onPress={() => router.push({ pathname: "/client-form", params: { clientId: String(client.id) } } as never)} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><AppText style={styles.editText}>تعديل البيانات</AppText></Pressable>
          <Pressable onPress={() => Alert.alert("حذف الطبيب أو العيادة", `هل تريد حذف ${client.doctorName}؟ لا يمكن الحذف إذا كانت له حالات أو سندات قبض.`, [{ text: "إلغاء", style: "cancel" }, { text: "حذف", style: "destructive", onPress: () => remove.mutate({ id: client.id }) }])} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><AppText style={styles.deleteText}>حذف</AppText></Pressable>
        </View>
      </View>)}
    </View>}
  </LabScreen>;
}

const styles = StyleSheet.create({ loading: { alignItems: "center", justifyContent: "center" }, list: { gap: 10 }, card: { borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }, main: { padding: 15 }, top: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "flex-start" }, right: { alignItems: "flex-end", flex: 1 }, doctor: { fontFamily: "Cairo-Bold", fontSize: 15 }, clinic: { color: colors.muted, fontSize: 11, marginTop: 2 }, balance: { color: colors.danger, fontFamily: "Cairo-Bold", fontSize: 14, marginTop: 7 }, bottom: { flexDirection: "row-reverse", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, marginTop: 12, paddingTop: 10 }, phone: { color: colors.muted, fontSize: 11 }, ledger: { color: colors.primary, fontFamily: "Cairo-SemiBold", fontSize: 11 }, cardActions: { flexDirection: "row-reverse", borderTopWidth: 1, borderTopColor: colors.border, padding: 10, gap: 18 }, action: { paddingHorizontal: 5, paddingVertical: 2 }, editText: { color: colors.primary, fontFamily: "Cairo-SemiBold", fontSize: 11 }, deleteText: { color: colors.danger, fontFamily: "Cairo-SemiBold", fontSize: 11 }, pressed: { opacity: 0.72 } });
