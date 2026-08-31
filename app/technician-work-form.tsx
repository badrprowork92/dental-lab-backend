import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useMemo, useState } from "react";

import { AppText, FormInput, IconButton, PrimaryButton, ScreenTitle, SelectField, SelectionSheet, colors } from "@/components/lab-ui";
import { calculateOrderTotal } from "@/lib/accounting";
import { formatMoney } from "@/lib/lab-format";
import { trpc } from "@/lib/trpc";

const today = new Date().toISOString().slice(0, 10);
export default function TechnicianWorkFormScreen() {
  const { data: technicians = [] } = trpc.lab.technicians.list.useQuery();
  const utils = trpc.useUtils();
  const [technicianId, setTechnicianId] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [workDate, setWorkDate] = useState(today);
  const [piecesCount, setPiecesCount] = useState("");
  const [unitRate, setUnitRate] = useState("");
  const [notes, setNotes] = useState("");
  const technician = technicians.find((entry) => entry.id === technicianId);
  const total = useMemo(() => calculateOrderTotal(piecesCount, unitRate), [piecesCount, unitRate]);
  const create = trpc.lab.technicians.work.create.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.lab.technicians.invalidate(), utils.lab.technicians.work.invalidate(), utils.lab.reports.invalidate(), utils.lab.bootstrap.invalidate()]);
      setPiecesCount(""); setUnitRate(""); setNotes("");
      Alert.alert("تم الحفظ", "تمت إضافة إنجاز الفني وتحديث مستحقاته.");
    },
    onError: (error) => Alert.alert("تعذر الحفظ", error.message),
  });
  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView contentContainerStyle={styles.content}><View style={styles.header}><IconButton icon="close" onPress={() => router.back()} /><ScreenTitle title="إنجازات الفنيين" subtitle="عدد القطع × سعر القطعة، مع احتساب الإجمالي تلقائيًا" /></View><View style={styles.form}>
    <SelectField label="الفني" value={technician ? `${technician.techName} — ${technician.specialty}` : undefined} placeholder="اختر الفني" onPress={() => setPickerOpen(true)} />
    <FormInput label="تاريخ الإنجاز" value={workDate} onChangeText={setWorkDate} placeholder="YYYY-MM-DD" />
    <View style={styles.twoCols}><View style={styles.flex}><FormInput label="عدد القطع" value={piecesCount} onChangeText={setPiecesCount} keyboardType="numeric" placeholder="0" /></View><View style={styles.flex}><FormInput label="سعر الوحدة" value={unitRate} onChangeText={setUnitRate} keyboardType="numeric" placeholder="0" /></View></View>
    <View style={styles.total}><AppText style={styles.totalValue}>{formatMoney(total)}</AppText><AppText style={styles.totalLabel}>إجمالي الإنجاز</AppText></View>
    <FormInput label="ملاحظات" value={notes} onChangeText={setNotes} multiline placeholder="مثال: دفعة خزف لشهر مايو" />
  </View><PrimaryButton label={create.isPending ? "جارٍ الحفظ..." : "حفظ إنجاز الفني"} onPress={() => { if (!technicianId || !/^\d{4}-\d{2}-\d{2}$/.test(workDate) || Number(piecesCount) < 1 || Number(unitRate) < 0 || !unitRate.trim()) return Alert.alert("بيانات مطلوبة", "اختر الفني وأدخل التاريخ وعدد القطع وسعر الوحدة."); create.mutate({ technicianId, workDate, piecesCount: Number(piecesCount), unitRate, notes: notes || undefined }); }} icon="save" disabled={create.isPending} /><SelectionSheet visible={pickerOpen} title="اختر الفني" items={technicians.map((entry) => ({ id: entry.id, label: entry.techName, subtitle: entry.specialty }))} onClose={() => setPickerOpen(false)} onSelect={(item) => { setTechnicianId(item.id); setPickerOpen(false); }} /></ScrollView></KeyboardAvoidingView>;
}
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.background }, content: { padding: 20, paddingTop: 54, paddingBottom: 36, gap: 20 }, header: { flexDirection: "row-reverse", gap: 12, alignItems: "flex-start" }, form: { gap: 14 }, twoCols: { flexDirection: "row-reverse", gap: 9 }, flex: { flex: 1 }, total: { backgroundColor: colors.tealSoft, borderRadius: 14, padding: 14, alignItems: "flex-end" }, totalValue: { color: colors.primary, fontFamily: "Cairo-Bold", fontSize: 19 }, totalLabel: { color: colors.muted, fontSize: 10, marginTop: 3 } });
