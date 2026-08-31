import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { CashboxField } from "@/components/cashbox-field";
import { DateField } from "@/components/date-field";
import { AppText, FormInput, IconButton, PrimaryButton, ScreenTitle, SelectField, SelectionSheet, colors } from "@/components/lab-ui";
import { formatMoney } from "@/lib/lab-format";
import { paymentReceiptHtml, sharePdf } from "@/lib/pdf-reports";
import { trpc } from "@/lib/trpc";

const today = new Date().toISOString().slice(0, 10);
type Picker = "client" | "currency" | null;

export default function PaymentFormScreen() {
  const { data: clients = [] } = trpc.lab.clients.list.useQuery();
  const { data: currencies = [] } = trpc.lab.currencies.list.useQuery();
  const { data: profile } = trpc.lab.profile.get.useQuery();
  const utils = trpc.useUtils();
  const [clientId, setClientId] = useState<number | null>(null);
  const [picker, setPicker] = useState<Picker>(null);
  const [paymentDate, setPaymentDate] = useState(today);
  const [amountPaid, setAmountPaid] = useState("");
  const [discount, setDiscount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank" | "pos">("cash");
  const [currencyCode, setCurrencyCode] = useState<"YER" | "SAR" | "USD">("YER");
  const [cashboxId, setCashboxId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const client = clients.find((item) => item.id === clientId);
  const activeCurrencies = useMemo(() => currencies.filter((item) => item.isActive), [currencies]);
  const currency = activeCurrencies.find((item) => item.currencyCode === currencyCode);
  const create = trpc.lab.payments.create.useMutation();
  const estimatedBalance = client ? Number(client.currentBalance) - Number(amountPaid || 0) - Number(discount || 0) : 0;
  const save = async (printAfterSave: boolean) => {
    if (!clientId || !amountPaid.trim() || Number(amountPaid) <= 0 || !cashboxId) return Alert.alert("بيانات مطلوبة", "اختر الطبيب والصندوق وأدخل مبلغ قبض صحيحًا.");
    try {
      const result = await create.mutateAsync({ clientId, paymentDate, amountPaid, discount: discount || "0", paymentMethod, cashboxId, currencyCode, notes: notes || undefined });
      await Promise.all([utils.lab.clients.invalidate(), utils.lab.payments.invalidate(), utils.lab.bootstrap.invalidate(), utils.lab.dashboard.invalidate(), utils.lab.cashboxes.invalidate()]);
      if (printAfterSave && profile && client) {
        const refreshed = await utils.lab.clients.byId.fetch({ id: clientId });
        await sharePdf(paymentReceiptHtml(profile, { receiptNumber: result.receiptNumber, paymentDate, doctorName: client.doctorName, clinicName: client.clinicName, amountPaid, discount: discount || "0", paymentMethod, currencyCode, notes, remainingBalance: String(refreshed?.currentBalance ?? estimatedBalance) }), `سند قبض ${result.receiptNumber}`);
      }
      Alert.alert("تم الحفظ", printAfterSave ? "تم حفظ سند القبض وتجهيز ملف PDF." : "تم حفظ سند القبض.");
      router.back();
    } catch (error) { Alert.alert("تعذر الحفظ", error instanceof Error ? error.message : "حدث خطأ غير متوقع."); }
  };
  const items = picker === "client" ? clients.map((item) => ({ id: item.id, label: item.doctorName, subtitle: `${item.clinicName} · المتبقي: ${formatMoney(item.currentBalance)}` })) : activeCurrencies.map((item, index) => ({ id: index, label: item.displayName, subtitle: item.currencyCode }));
  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={styles.header}><IconButton icon="close" onPress={() => router.back()} /><ScreenTitle title="سند قبض" subtitle="سجّل الدفعة واطبع السند مباشرة" /></View><View style={styles.form}>
    <SelectField label="الطبيب / العيادة" value={client ? `${client.doctorName} — ${client.clinicName}` : undefined} placeholder="اختر الطبيب أو العيادة" onPress={() => setPicker("client")} />
    {client ? <View style={styles.balance}><AppText style={styles.balanceLabel}>الرصيد المتبقي للطبيب</AppText><AppText style={styles.balanceValue}>{formatMoney(estimatedBalance)}</AppText></View> : null}
    <View style={styles.twoCols}><View style={styles.flex}><DateField label="تاريخ السند" value={paymentDate} onChange={setPaymentDate} /></View><View style={styles.flex}><SelectField label="العملة" value={currency ? `${currency.displayName} (${currency.currencyCode})` : undefined} placeholder="اختر العملة" onPress={() => setPicker("currency")} /></View></View><CashboxField value={cashboxId} onChange={setCashboxId} currencyCode={currencyCode} label="الصندوق المستلم" />
    <View style={styles.twoCols}><View style={styles.flex}><FormInput label="المبلغ المقبوض" value={amountPaid} onChangeText={setAmountPaid} keyboardType="numeric" placeholder="0" /></View><View style={styles.flex}><FormInput label="خصم (اختياري)" value={discount} onChangeText={setDiscount} keyboardType="numeric" placeholder="0" /></View></View>
    <AppText style={styles.methodLabel}>وسيلة السداد</AppText><View style={styles.methods}>{([ ["cash", "نقدي"], ["bank", "بنك"], ["pos", "شبكة"] ] as const).map(([value, label]) => <Pressable key={value} onPress={() => setPaymentMethod(value)} style={({ pressed }) => [styles.method, paymentMethod === value && styles.methodActive, pressed && styles.pressed]}><AppText style={[styles.methodText, paymentMethod === value && styles.methodTextActive]}>{label}</AppText></Pressable>)}</View>
    <FormInput label="ملاحظات" value={notes} onChangeText={setNotes} multiline placeholder="تفاصيل إضافية إن وجدت" />
  </View><View style={styles.actions}><PrimaryButton label={create.isPending ? "جارٍ الحفظ..." : "حفظ وطباعة PDF"} onPress={() => save(true)} icon="picture-as-pdf" disabled={create.isPending} /><PrimaryButton label={create.isPending ? "جارٍ الحفظ..." : "حفظ السند"} onPress={() => save(false)} icon="save" variant="secondary" disabled={create.isPending} /></View><SelectionSheet visible={Boolean(picker)} title={picker === "client" ? "اختر الطبيب أو العيادة" : "اختر العملة"} items={items} onClose={() => setPicker(null)} onSelect={(item) => { if (picker === "client") { const selected = clients.find((entry) => entry.id === item.id); setClientId(item.id); if (selected?.defaultCurrencyCode) setCurrencyCode(selected.defaultCurrencyCode as "YER" | "SAR" | "USD"); } else { const selected = activeCurrencies[item.id]; if (selected) setCurrencyCode(selected.currencyCode as "YER" | "SAR" | "USD"); } setPicker(null); }} /></ScrollView></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.background }, content: { padding: 20, paddingTop: 54, gap: 22 }, header: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 12 }, form: { gap: 14 }, twoCols: { flexDirection: "row-reverse", gap: 9 }, flex: { flex: 1 }, methodLabel: { fontFamily: "Cairo-SemiBold", fontSize: 12, textAlign: "right" }, methods: { flexDirection: "row-reverse", gap: 8 }, method: { flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }, methodActive: { backgroundColor: colors.primary, borderColor: colors.primary }, methodText: { color: colors.muted, fontFamily: "Cairo-SemiBold", fontSize: 12 }, methodTextActive: { color: "#FFFFFF" }, balance: { backgroundColor: colors.tealSoft, padding: 12, borderRadius: 14, alignItems: "flex-end" }, balanceLabel: { color: colors.muted, fontSize: 10 }, balanceValue: { color: colors.primary, fontSize: 17, fontFamily: "Cairo-Bold" }, actions: { gap: 10 }, pressed: { opacity: .72 } });
