import { router } from "expo-router";
import { useState } from "react";
import { Alert, Modal, StyleSheet, View } from "react-native";

import { CashboxField } from "@/components/cashbox-field";
import { AppText, EmptyState, FormInput, IconButton, LabScreen, PrimaryButton, ScreenTitle, SelectField, SelectionSheet, colors } from "@/components/lab-ui";
import { formatMoney } from "@/lib/lab-format";
import { trpc } from "@/lib/trpc";

const today = new Date().toISOString().slice(0, 10);
type CurrencyCode = "YER" | "SAR" | "USD";

export default function ExpensesScreen() {
  const { data, isLoading } = trpc.lab.expenses.list.useQuery();
  const { data: currencies = [] } = trpc.lab.currencies.list.useQuery();
  const [open, setOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>("YER");
  const [cashboxId, setCashboxId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const utils = trpc.useUtils();
  const activeCurrencies = currencies.filter((item) => item.isActive);
  const selectedCurrency = activeCurrencies.find((item) => item.currencyCode === currencyCode);
  const create = trpc.lab.expenses.create.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.lab.expenses.invalidate(), utils.lab.bootstrap.invalidate(), utils.lab.cashboxes.invalidate(), utils.lab.reports.invalidate()]);
      setOpen(false); setCategory(""); setAmount(""); setNotes(""); setCashboxId(null);
    },
    onError: (e) => Alert.alert("تعذر الحفظ", e.message),
  });
  return <LabScreen>
    <View style={styles.header}><IconButton icon="close" onPress={() => router.back()} /><ScreenTitle title="المصروفات" subtitle="سجّل المصروف النقدي مع الصندوق والعملة" /></View>
    <PrimaryButton label="تسجيل مصروف" onPress={() => setOpen(true)} icon="add" />
    {isLoading ? null : !data?.length ? <EmptyState title="لا توجد مصروفات" description="سجل المصروفات التشغيلية لمتابعة أداء المختبر." icon="receipt-long" /> : <View style={styles.list}>{data.map((item) => <View key={item.id} style={styles.card}><View><AppText style={styles.date}>{item.expenseDate}</AppText><AppText style={styles.notes}>{item.notes || "بدون ملاحظات"}</AppText></View><View style={styles.copy}><AppText style={styles.amount}>{formatMoney(item.amount)} {item.currencyCode}</AppText><AppText style={styles.category}>{item.category}</AppText></View></View>)}</View>}
    <Modal visible={open} transparent animationType="fade"><View style={styles.backdrop}><View style={styles.modal}><AppText style={styles.modalTitle}>مصروف جديد</AppText><FormInput label="الفئة" value={category} onChangeText={setCategory} placeholder="مثال: مواد، إيجار، نقل" /><FormInput label="المبلغ" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" /><SelectField label="العملة" value={selectedCurrency ? `${selectedCurrency.displayName} (${currencyCode})` : currencyCode} placeholder="اختر العملة" onPress={() => setCurrencyOpen(true)} /><CashboxField value={cashboxId} onChange={setCashboxId} currencyCode={currencyCode} label="الصندوق الصادر منه المبلغ" /><FormInput label="ملاحظات" value={notes} onChangeText={setNotes} multiline placeholder="تفاصيل المصروف" /><View style={styles.actions}><PrimaryButton label="إلغاء" onPress={() => setOpen(false)} icon="close" variant="ghost" /><PrimaryButton label="حفظ المصروف" onPress={() => { if (!category || !amount || !cashboxId) return Alert.alert("بيانات مطلوبة", "أدخل الفئة والمبلغ واختر الصندوق."); create.mutate({ category, amount, cashboxId, currencyCode, expenseDate: today, notes: notes || undefined }); }} icon="save" disabled={create.isPending} /></View></View></View></Modal>
    <SelectionSheet visible={currencyOpen} title="اختر العملة" items={activeCurrencies.map((item, index) => ({ id: index, label: item.displayName, subtitle: item.currencyCode }))} onClose={() => setCurrencyOpen(false)} onSelect={(item) => { const selected = activeCurrencies[item.id]; if (selected) { setCurrencyCode(selected.currencyCode as CurrencyCode); setCashboxId(null); } setCurrencyOpen(false); }} />
  </LabScreen>;
}

const styles = StyleSheet.create({ header: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 12 }, list: { gap: 10 }, card: { padding: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 17, flexDirection: "row-reverse", justifyContent: "space-between" }, copy: { alignItems: "flex-end" }, amount: { color: colors.danger, fontFamily: "Cairo-Bold", fontSize: 14 }, category: { fontFamily: "Cairo-SemiBold", fontSize: 12, marginTop: 4 }, date: { color: colors.muted, fontSize: 11 }, notes: { color: colors.muted, fontSize: 10, marginTop: 3 }, backdrop: { flex: 1, backgroundColor: "rgba(18,38,34,.42)", justifyContent: "center", padding: 20 }, modal: { backgroundColor: colors.background, borderRadius: 24, padding: 20, gap: 14 }, modalTitle: { fontFamily: "Cairo-Bold", fontSize: 18 }, actions: { flexDirection: "row-reverse", gap: 10 } });
