import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppText, EmptyState, LabScreen, MetricCard, PrimaryButton, ScreenTitle, SectionHeader, StatusPill, colors } from "@/components/lab-ui";
import { formatMoney, orderStatusLabels } from "@/lib/lab-format";
import { trpc } from "@/lib/trpc";

/**
 * Home Screen - NativeWind Example
 *
 * This template uses NativeWind (Tailwind CSS for React Native).
 * You can use familiar Tailwind classes directly in className props.
 *
 * Key patterns:
 * - Use `className` instead of `style` for most styling
 * - Theme colors: use tokens directly (bg-background, text-foreground, bg-primary, etc.); no dark: prefix needed
 * - Responsive: standard Tailwind breakpoints work on web
 * - Custom colors defined in tailwind.config.js
 */
export default function HomeScreen() {
  const { data, isLoading, isError } = trpc.lab.bootstrap.useQuery();
  const { data: labProfile } = trpc.lab.profile.get.useQuery();

  if (isLoading) return <LabScreen scroll={false} style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /></LabScreen>;
  if (isError || !data) return <LabScreen><ScreenTitle title="نظام المختبر" subtitle="لوحة الحسابات" /><EmptyState title="تعذر تحميل البيانات" description="تأكد من اتصال التطبيق بالخادم ثم أعد المحاولة." icon="cloud-off" /></LabScreen>;

  const recentOrders = data.orders.slice(0, 4);
  return (
    <LabScreen>
      <ScreenTitle title="أهلاً وسهلاً" subtitle={labProfile?.labName || "نظام حسابات مختبر الأسنان"} />
      <View style={styles.hero}><View style={styles.heroTop}><View><AppText style={styles.heroLabel}>إجمالي المبالغ المستحقة</AppText><AppText style={styles.heroValue}>{formatMoney(data.dashboard.receivable)}</AppText></View><View style={styles.heroIcon}><AppText style={styles.heroCurrency}>ر.ي</AppText></View></View><AppText style={styles.heroCaption}>الرصيد الحي للأطباء والعيادات</AppText></View>
      <View style={styles.quickRow}><PrimaryButton label="طلب جديد" onPress={() => router.push("/order-form" as never)} icon="add-circle-outline" /><PrimaryButton label="سند قبض" onPress={() => router.push("/payment-form" as never)} icon="payments" variant="secondary" /></View>
      <SectionHeader title="ملخص اليوم" />
      <View style={styles.metrics}><MetricCard label="قيد التصنيع" value={String(data.dashboard.inProgress)} icon="precision-manufacturing" tone="gold" /><MetricCard label="حالات جديدة" value={String(data.dashboard.newOrders)} icon="assignment" tone="teal" /></View>
      <View style={styles.metrics}><MetricCard label="الأطباء والعيادات" value={String(data.dashboard.clientsCount)} icon="groups" tone="green" /><MetricCard label="المصروفات المسجلة" value={formatMoney(data.dashboard.expenseTotal)} icon="receipt-long" tone="red" /></View>
      <SectionHeader title="أحدث الحالات" action={<PrimaryButton label="كل الطلبات" onPress={() => router.push("/(tabs)/orders" as never)} variant="ghost" icon="arrow-back" compact />} />
      {recentOrders.length ? <View style={styles.ordersCard}>{recentOrders.map((order) => <View style={styles.orderRow} key={order.id}><View style={styles.orderMeta}><AppText style={styles.orderTitle}>{order.invoiceNumber} · {order.patientName || order.serviceName}</AppText><AppText style={styles.orderSub}>{order.doctorName} — {order.serviceName}</AppText></View><View style={styles.orderAmount}><StatusPill label={orderStatusLabels[order.orderStatus]} tone={order.orderStatus === "delivered" || order.orderStatus === "completed" ? "green" : order.orderStatus === "in_progress" ? "gold" : "teal"} /><AppText style={styles.amount}>{formatMoney(order.totalAmount)}</AppText></View></View>)}</View> : <EmptyState title="لا توجد حالات بعد" description="أنشئ أول طلب لبدء متابعة أعمال المختبر." icon="assignment-add" />}
    </LabScreen>
  );
}

const styles = StyleSheet.create({
  loading: { alignItems: "center", justifyContent: "center" }, hero: { borderRadius: 24, backgroundColor: colors.primary, padding: 20 }, heroTop: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }, heroLabel: { color: "#C9E9E3", fontSize: 12 }, heroValue: { color: "#FFFFFF", fontFamily: "Cairo-Bold", fontSize: 26, marginTop: 8 }, heroCaption: { color: "#C9E9E3", fontSize: 11, marginTop: 12 }, heroIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#138C80", alignItems: "center", justifyContent: "center" }, heroCurrency: { color: "#FFFFFF", fontFamily: "Cairo-Bold", fontSize: 14 }, quickRow: { flexDirection: "row-reverse", gap: 10 }, metrics: { flexDirection: "row-reverse", gap: 10 }, ordersCard: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }, orderRow: { flexDirection: "row-reverse", justifyContent: "space-between", padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 }, orderMeta: { flex: 1, alignItems: "flex-end" }, orderTitle: { fontFamily: "Cairo-SemiBold", fontSize: 12 }, orderSub: { color: colors.muted, fontSize: 10, marginTop: 2 }, orderAmount: { alignItems: "flex-start", gap: 7 }, amount: { color: colors.primary, fontFamily: "Cairo-Bold", fontSize: 10 },
});
