import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { CashboxField } from "@/components/cashbox-field";
import { DateField } from "@/components/date-field";
import { AppText, FormInput, IconButton, PrimaryButton, ScreenTitle, SelectField, SelectionSheet, colors } from "@/components/lab-ui";
import { sharePdf, technicianPayoutReceiptHtml } from "@/lib/pdf-reports";
import { trpc } from "@/lib/trpc";

const today = new Date().toISOString().slice(0, 10);
type Picker = "technician" | "currency" | null;

export default function PayoutFormScreen() {
  const { data: technicians = [] } = trpc.lab.technicians.list.useQuery();
  const { data: currencies = [] } = trpc.lab.currencies.list.useQuery();
  const { data: profile } = trpc.lab.profile.get.useQuery();
  const utils = trpc.useUtils();
  const [technicianId, setTechnicianId] = useState<number | null>(null);
  const [payoutDate, setPayoutDate] = useState(today);
  const [amountPaid, setAmountPaid] = useState("");
  const [payoutType, setPayoutType] = useState<"payment" | "advance" | "bonus">("payment");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank" | "pos">("cash");
  const [currencyCode, setCurrencyCode] = useState<"YER" | "SAR" | "USD">("YER");
  const [cashboxId, setCashboxId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [picker, setPicker] = useState<Picker>(null);
  const technician = technicians.find((item) => item.id === technicianId);
  const activeCurrencies = useMemo(() => currencies.filter((item) => item.isActive), [currencies]);
  const currency = activeCurrencies.find((item) => item.currencyCode === currencyCode);
  const create = trpc.lab.technicians.payout.useMutation();
  const save = async (printAfterSave: boolean) => {
    if (!technicianId || !amountPaid.trim() || Number(amountPaid) <= 0 || !cashboxId) return Alert.alert("بيانات مطلوبة", "اختر الفني والصندوق وأدخل مبلغ الصرف.");
    try {
      const id = await create.mutateAsync({ technicianId, payoutDate, amountPaid, payoutType, paymentMethod, cashboxId, currencyCode, notes: notes || undefined });
      await Promise.all([utils.lab.technicians.invalidate(), utils.lab.bootstrap.invalidate(), utils.lab.cashboxes.invalidate()]);
      if (printAfterSave && profile && technician) await sharePdf(technicianPayoutReceiptHtml(profile, { reference: id, payoutDate, techName: technician.techName, amountPaid, payoutType, paymentMethod, currencyCode, notes }), `سند صرف الفني ${id}`);
      Alert.alert("تم الحفظ", printAfterSave ? "تم حفظ سند الصرف وتجهيز ملف PDF بالتوقيعات." : "تم حفظ سند الصرف.");
      router.back();
    } catch (error) { Alert.alert("تعذر الحفظ", error instanceof Error ? error.message : "حدث خطأ غير متوقع."); }
  };
  const items = picker === "technician" ? technicians.map((item) => ({ id: item.id, label: item.techName, subtitle: item.specialty })) : activeCurrencies.map((item, index) => ({ id: index, label: item.displayName, subtitle: item.currencyCode }));
  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={styles.header}><IconButton icon="close" onPress={() => router.back()} /><ScreenTitle title="سند صرف فني" subtitle="أدخل نوع الصرف ووسيلته ثم اطبع السند" /></View><View style={styles.form}>
    <SelectField label="الفني" value={technician ? `${technician.techName} — ${technician.specialty}` : undefined} placeholder="اختر الفني" onPress={() => setPicker("technician")} />
    <View style={styles.twoCols}><View style={styles.flex}><DateField label="تاريخ السند" value={payoutDate} onChange={setPayoutDate} /></View><View style={styles.flex}><SelectField label="العملة" value={currency ? `${currency.displayName} (${currencyCode})` : currencyCode} placeholder="اختر العملة" onPress={() => setPicker("currency")} /></View></View><CashboxField value={cashboxId} onChange={setCashboxId} currencyCode={currencyCode} label="الصندوق الصادر منه المبلغ" />
    <FormInput label="المبلغ المصروف" value={amountPaid} onChangeText={setAmountPaid} keyboardType="numeric" placeholder="0" />
    <AppText style={styles.label}>نوع الصرف</AppText><View style={styles.options}>{([ ["payment", "دفعة"], ["advance", "سلفة"], ["bonus", "مكافأة"] ] as const).map(([value, label]) => <Pressable key={value} onPress={() => setPayoutType(value)} style={({ pressed }) => [styles.option, payoutType === value && styles.optionActive, pressed && styles.pressed]}><AppText style={[styles.optionText, payoutType === value && styles.optionTextActive]}>{label}</AppText></Pressable>)}</View>
    <AppText style={styles.label}>وسيلة السداد</AppText><View style={styles.options}>{([ ["cash", "نقدي"], ["bank", "بنك"], ["pos", "شبكة"] ] as const).map(([value, label]) => <Pressable key={value} onPress={() => setPaymentMethod(value)} style={({ pressed }) => [styles.option, paymentMethod === value && styles.optionActive, pressed && styles.pressed]}><AppText style={[styles.optionText, paymentMethod === value && styles.optionTextActive]}>{label}</AppText></Pressable>)}</View>
    <FormInput label="ملاحظات" value={notes} onChangeText={setNotes} multiline placeholder="بيان الصرف أو رقم المرجع" />
  </View><View style={styles.actions}><PrimaryButton label={create.isPending ? "جارٍ الحفظ..." : "حفظ وطباعة PDF"} onPress={() => save(true)} icon="picture-as-pdf" disabled={create.isPending} /><PrimaryButton label={create.isPending ? "جارٍ الحفظ..." : "حفظ سند الصرف"} onPress={() => save(false)} icon="save" variant="secondary" disabled={create.isPending} /></View><SelectionSheet visible={Boolean(picker)} title={picker === "technician" ? "اختر الفني" : "اختر العملة"} items={items} onClose={() => setPicker(null)} onSelect={(item) => { if (picker === "technician") setTechnicianId(item.id); else { const selected = activeCurrencies[item.id]; if (selected) setCurrencyCode(selected.currencyCode as "YER" | "SAR" | "USD"); } setPicker(null); }} /></ScrollView></KeyboardAvoidingView>;
}
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.background }, content: { padding: 20, paddingTop: 54, gap: 22 }, header: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 12 }, form: { gap: 14 }, twoCols: { flexDirection: "row-reverse", gap: 9 }, flex: { flex: 1 }, label: { fontFamily: "Cairo-SemiBold", fontSize: 12, textAlign: "right" }, options: { flexDirection: "row-reverse", gap: 8 }, option: { flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }, optionActive: { backgroundColor: colors.primary, borderColor: colors.primary }, optionText: { color: colors.muted, fontFamily: "Cairo-SemiBold", fontSize: 11 }, optionTextActive: { color: "#fff" }, actions: { gap: 10 }, pressed: { opacity: .72 } });
