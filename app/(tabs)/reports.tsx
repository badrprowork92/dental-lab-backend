import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import { DateField } from "@/components/date-field";
import { AppText, EmptyState, IconButton, LabScreen, PrimaryButton, ScreenTitle, SelectField, SelectionSheet, colors } from "@/components/lab-ui";
import { formatMoney } from "@/lib/lab-format";
import { doctorLedgerBatchFileName, doctorLedgerFileName, doctorLedgerHtml, periodSummaryHtml, shareDoctorLedgerBatch, sharePdf, supplierLedgerHtml, technicianLedgerHtml } from "@/lib/pdf-reports";
import { trpc } from "@/lib/trpc";

const today = new Date().toISOString().slice(0, 10);
const firstDay = `${today.slice(0, 8)}01`;
type Picker = "client" | "technician" | "supplier" | "currency" | "cashbox" | null;
type CurrencyFilter = "ALL" | "YER" | "SAR" | "USD";

export default function ReportsScreen() {
  const params = useLocalSearchParams<{ clientId?: string }>();
  const utils = trpc.useUtils();
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(today);
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>("ALL");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(params.clientId ? Number(params.clientId) : null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<number | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [selectedCashboxId, setSelectedCashboxId] = useState<number | null>(null);
  const [picker, setPicker] = useState<Picker>(null);
  const [exporting, setExporting] = useState(false);
  const validRange = startDate <= endDate;
  const refresh = async () => { setRefreshing(true); try { await utils.invalidate(); } finally { setRefreshing(false); } };
  const currencyCode = currencyFilter === "ALL" ? undefined : currencyFilter;
  const { data: profile } = trpc.lab.profile.get.useQuery();
  const { data: clients = [] } = trpc.lab.clients.list.useQuery();
  const { data: currencies = [] } = trpc.lab.currencies.list.useQuery();
  const { data: technicians = [] } = trpc.lab.technicians.list.useQuery();
  const { data: suppliers = [] } = trpc.lab.suppliers.list.useQuery();
  const { data: cashboxes = [] } = trpc.lab.cashboxes.list.useQuery();
  const summary = trpc.lab.reports.periodSummary.useQuery({ startDate, endDate, ...(currencyCode ? { currencyCode } : {}) }, { enabled: validRange });
  const ledger = trpc.lab.reports.doctorLedger.useQuery({ clientId: selectedClientId ?? 0, startDate, endDate, ...(currencyCode ? { currencyCode } : {}) }, { enabled: Boolean(selectedClientId && validRange) });
  const technicianLedger = trpc.lab.reports.technicianLedger.useQuery({ technicianId: selectedTechnicianId ?? 0, startDate, endDate }, { enabled: Boolean(selectedTechnicianId && validRange) });
  const supplierLedger = trpc.lab.reports.supplierLedger.useQuery({ supplierId: selectedSupplierId ?? 0, startDate, endDate }, { enabled: Boolean(selectedSupplierId && validRange) });
  const profitLoss = trpc.lab.reports.profitLoss.useQuery({ startDate, endDate, ...(currencyCode ? { currencyCode } : {}), ...(selectedCashboxId ? { cashboxId: selectedCashboxId } : {}) }, { enabled: validRange });
  const selectedClient = clients.find((item) => item.id === selectedClientId);
  const selectedTechnician = technicians.find((item) => item.id === selectedTechnicianId);
  const selectedSupplier = suppliers.find((item) => item.id === selectedSupplierId);
  const selectedCashbox = cashboxes.find((item) => item.id === selectedCashboxId);
  const activeCurrencies = useMemo(() => currencies.filter((item) => item.isActive), [currencies]);
  const selectedCurrency = activeCurrencies.find((item) => item.currencyCode === currencyFilter);
  const lab = profile ?? { labName: "", phoneNumber: "", location: "", headerNote1: "", headerNote2: "", headerNote3: "", logoUrl: null, baseCurrencyCode: "YER" };
  useEffect(() => { if (!selectedClientId && clients[0]) setSelectedClientId(clients[0].id); }, [clients, selectedClientId]);
  const ensureRange = () => { if (!validRange) { Alert.alert("فترة غير صحيحة", "تاريخ النهاية يجب أن يكون بعد تاريخ البداية."); return false; } return true; };
  const withExport = async (callback: () => Promise<void>) => { try { setExporting(true); await callback(); } catch (error) { Alert.alert("تعذر التصدير", error instanceof Error ? error.message : "تعذر إنشاء ملف PDF."); } finally { setExporting(false); } };
  const exportSummary = () => { if (!ensureRange() || !summary.data) return; return withExport(() => sharePdf(periodSummaryHtml(lab, summary.data), `تقرير الحالات والإيرادات ${currencyFilter} ${startDate} إلى ${endDate}`)); };
  const exportDoctor = () => { if (!ensureRange() || !selectedClient || !ledger.data) return Alert.alert("اختر طبيبًا", "اختر الطبيب أو العيادة ثم انتظر تحميل كشف الحساب."); return withExport(() => sharePdf(doctorLedgerHtml(lab, ledger.data, startDate, endDate), doctorLedgerFileName(selectedClient.doctorName, startDate, endDate))); };
  const exportAllDoctors = () => { if (!ensureRange()) return; return withExport(async () => { const ledgers = await Promise.all(clients.map(async (client) => ({ client, ledger: await utils.lab.reports.doctorLedger.fetch({ clientId: client.id, startDate, endDate, ...(currencyCode ? { currencyCode } : {}) }) }))); const entries = ledgers.filter((item) => item.ledger.items.length > 0).map((item) => ({ fileName: doctorLedgerFileName(item.client.doctorName, startDate, endDate), html: doctorLedgerHtml(lab, item.ledger, startDate, endDate) })); if (!entries.length) return Alert.alert("لا توجد حالات", "لا توجد حالات ضمن العملة والفترة المحددتين."); await shareDoctorLedgerBatch(entries, doctorLedgerBatchFileName(startDate, endDate)); }); };
  const exportTechnician = () => { if (!ensureRange() || !selectedTechnician || !technicianLedger.data) return Alert.alert("اختر فنيًا", "اختر الفني ثم انتظر تحميل كشف الحساب."); return withExport(() => sharePdf(technicianLedgerHtml(lab, technicianLedger.data, startDate, endDate), `كشف حساب الفني ${selectedTechnician.techName}`)); };
  const exportSupplier = () => { if (!ensureRange() || !selectedSupplier || !supplierLedger.data) return Alert.alert("اختر موردًا", "اختر المورد ثم انتظر تحميل كشف الحساب."); return withExport(() => sharePdf(supplierLedgerHtml(lab, supplierLedger.data, startDate, endDate), `كشف حساب المورد ${selectedSupplier.supplierName}`)); };
  const pickerItems = picker === "client" ? clients.map((item) => ({ id: item.id, label: item.doctorName, subtitle: item.clinicName })) : picker === "technician" ? technicians.map((item) => ({ id: item.id, label: item.techName, subtitle: item.specialty })) : picker === "supplier" ? suppliers.map((item) => ({ id: item.id, label: item.supplierName, subtitle: `المتبقي: ${formatMoney(item.currentBalance)}` })) : picker === "cashbox" ? [{ id: 0, label: "كل الصناديق", subtitle: "التدفق النقدي لجميع الصناديق" }, ...cashboxes.filter((item) => item.isActive).map((item) => ({ id: item.id, label: item.cashboxName, subtitle: `${item.currencyCode} · ${formatMoney(item.currentBalance)}` }))] : [{ id: 0, label: "كل العملات", subtitle: "يعرض كل الحركات دون جمع العملات في إجمالي واحد" }, ...activeCurrencies.map((item, index) => ({ id: index + 1, label: item.displayName, subtitle: item.currencyCode }))];
  const currencyDisplay = currencyFilter === "ALL" ? "كل العملات" : selectedCurrency ? `${selectedCurrency.displayName} (${currencyFilter})` : currencyFilter;
  const cashboxDisplay = selectedCashbox ? `${selectedCashbox.cashboxName} (${selectedCashbox.currencyCode})` : "كل الصناديق";
  const displayAmount = (value: string) => `${formatMoney(value)}${currencyFilter === "ALL" ? "" : ` ${currencyFilter}`}`;
  return <LabScreen scroll={false}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.primary} colors={[colors.primary]} />}><ScreenTitle title="التقارير" subtitle="حدد الفترة والعملة ثم أنشئ التقرير أو صدّره PDF" action={<IconButton icon="refresh" label="تحديث التقارير" onPress={() => void refresh()} tone="primary" />} /><View style={styles.period}><View style={styles.flex}><DateField label="من تاريخ" value={startDate} onChange={setStartDate} /></View><View style={styles.flex}><DateField label="إلى تاريخ" value={endDate} onChange={setEndDate} /></View></View><SelectField label="العملة" value={currencyDisplay} placeholder="اختر العملة" onPress={() => setPicker("currency")} /><SelectField label="الصندوق" value={cashboxDisplay} placeholder="كل الصناديق" onPress={() => setPicker("cashbox")} />{!validRange ? <View style={styles.warning}><AppText style={styles.warningText}>تاريخ النهاية يجب أن يكون بعد تاريخ البداية.</AppText></View> : null}
    <View style={styles.section}>
      <AppText style={styles.sectionTitle}>ملخص الحالات والإيرادات</AppText>
      <AppText style={styles.currencyNote}>النتائج المعروضة: {currencyDisplay}</AppText>
      {summary.isLoading ? <ActivityIndicator color={colors.primary} /> : summary.data ? <>
        <View style={styles.metrics}><Metric label="الحالات" value={String(summary.data.totals.casesCount)} /><Metric label="القطع" value={String(summary.data.totals.piecesCount)} /><Metric label="الإيرادات" value={displayAmount(summary.data.totals.revenue)} /></View>
        <View style={styles.breakdown}>{summary.data.breakdown.map((item) => <View key={`${item.category}-${item.orderType}`} style={styles.breakdownRow}><AppText style={[styles.breakdownValue, item.orderType === "urgent" && styles.urgent]}>{item.category} — {item.orderType === "urgent" ? "مستعجل" : "عادي"}</AppText><AppText style={styles.breakdownMeta}>{item.piecesCount} قطعة · {displayAmount(item.revenue)}</AppText></View>)}</View>
        <PrimaryButton label={exporting ? "جارٍ تجهيز الملف..." : "تصدير ملخص الفترة PDF"} onPress={exportSummary} icon="picture-as-pdf" disabled={exporting} />
      </> : <EmptyState title="لا توجد بيانات" description="أدخل فترة صحيحة لعرض الملخص." icon="assessment" />}
    </View>
    {profitLoss.data ? <View style={styles.section}><AppText style={styles.sectionTitle}>الأرباح والخسائر والتدفق النقدي</AppText><AppText style={styles.currencyNote}>نطاق الصندوق: {cashboxDisplay} · العملة: {currencyDisplay}</AppText><View style={styles.metrics}><Metric label="صافي الربح" value={displayAmount(profitLoss.data.netResult)} /><Metric label="المقبوضات" value={displayAmount(profitLoss.data.cashflow.received)} /><Metric label="المدفوعات" value={displayAmount(profitLoss.data.cashflow.paid)} /></View><View style={styles.cashflowRow}><AppText style={styles.cashflowValue}>{displayAmount(profitLoss.data.cashflow.net)}</AppText><AppText style={styles.cashflowLabel}>صافي التدفق النقدي الفعلي</AppText></View></View> : null}
    <StatementSection title="كشف حساب طبيب أو عيادة" selectLabel="الطبيب / العيادة" value={selectedClient ? `${selectedClient.doctorName} — ${selectedClient.clinicName}` : undefined} placeholder="اختر الطبيب أو العيادة" onPick={() => setPicker("client")} preview={ledger.data ? `${ledger.data.client.doctorName} · المتبقي: ${formatMoney(ledger.data.totals.remainingAmount)} ${currencyFilter === "ALL" ? "" : currencyFilter}` : undefined} exportLabel="تصدير كشف الحساب PDF" onExport={exportDoctor} disabled={exporting || !selectedClientId} />
    <PrimaryButton label={exporting ? "جارٍ تجهيز الكشوفات..." : "تصدير جميع كشوفات الأطباء"} onPress={exportAllDoctors} icon="folder-zip" variant="secondary" disabled={exporting} /><AppText style={styles.hint}>ينتج ملف ZIP يحوي كشفًا منفصلًا لكل طبيب لديه حالات في العملة والفترة المحددتين.</AppText>
    <StatementSection title="كشف حساب فني" selectLabel="الفني" value={selectedTechnician ? `${selectedTechnician.techName} — ${selectedTechnician.specialty}` : undefined} placeholder="اختر الفني" onPick={() => setPicker("technician")} preview={technicianLedger.data ? `المستحق النهائي: ${formatMoney(technicianLedger.data.totals.remainingAmount)}` : undefined} exportLabel="تصدير كشف الفني PDF" onExport={exportTechnician} disabled={exporting || !selectedTechnicianId} />
    <StatementSection title="كشف حساب مورد" selectLabel="المورد" value={selectedSupplier?.supplierName} placeholder="اختر المورد" onPick={() => setPicker("supplier")} preview={supplierLedger.data ? `المتبقي: ${formatMoney(supplierLedger.data.totals.remainingAmount)}` : undefined} exportLabel="تصدير كشف المورد PDF" onExport={exportSupplier} disabled={exporting || !selectedSupplierId} />
    <SelectionSheet visible={Boolean(picker)} title={picker === "client" ? "اختر الطبيب أو العيادة" : picker === "technician" ? "اختر الفني" : picker === "supplier" ? "اختر المورد" : picker === "cashbox" ? "اختر الصندوق" : "اختر العملة"} items={pickerItems} onClose={() => setPicker(null)} onSelect={(item) => { if (picker === "client") setSelectedClientId(item.id); else if (picker === "technician") setSelectedTechnicianId(item.id); else if (picker === "supplier") setSelectedSupplierId(item.id); else if (picker === "cashbox") setSelectedCashboxId(item.id === 0 ? null : item.id); else setCurrencyFilter(item.id === 0 ? "ALL" : activeCurrencies[item.id - 1]?.currencyCode as CurrencyFilter); setPicker(null); }} />
  </ScrollView></LabScreen>;
}

function Metric({ label, value }: { label: string; value: string }) { return <View style={styles.metric}><AppText style={styles.metricValue}>{value}</AppText><AppText style={styles.metricLabel}>{label}</AppText></View>; }
function StatementSection({ title, selectLabel, value, placeholder, onPick, preview, exportLabel, onExport, disabled }: { title: string; selectLabel: string; value?: string; placeholder: string; onPick: () => void; preview?: string; exportLabel: string; onExport: () => void; disabled: boolean }) { return <View style={styles.section}><AppText style={styles.sectionTitle}>{title}</AppText><SelectField label={selectLabel} value={value} placeholder={placeholder} onPress={onPick} />{preview ? <View style={styles.preview}><AppText style={styles.previewText}>{preview}</AppText></View> : null}<PrimaryButton label={exportLabel} onPress={onExport} icon="picture-as-pdf" disabled={disabled} /></View>; }
const styles = StyleSheet.create({ content: { gap: 14, paddingBottom: 34 }, period: { flexDirection: "row-reverse", gap: 9 }, flex: { flex: 1 }, warning: { backgroundColor: colors.dangerSoft, padding: 10, borderRadius: 12 }, warningText: { color: colors.danger, textAlign: "right", fontSize: 11 }, section: { gap: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 14, backgroundColor: colors.surface }, sectionTitle: { color: colors.primary, fontFamily: "Cairo-Bold", fontSize: 15, textAlign: "right" }, currencyNote: { color: colors.muted, fontSize: 10, textAlign: "right" }, metrics: { flexDirection: "row-reverse", gap: 8 }, metric: { flex: 1, minHeight: 78, borderRadius: 14, backgroundColor: colors.background, padding: 10, alignItems: "flex-end", justifyContent: "space-between" }, metricValue: { color: colors.primary, fontFamily: "Cairo-Bold", fontSize: 13, textAlign: "right" }, metricLabel: { color: colors.muted, fontSize: 10, textAlign: "right" }, breakdown: { gap: 6 }, breakdownRow: { backgroundColor: colors.background, borderRadius: 10, padding: 9, flexDirection: "row-reverse", justifyContent: "space-between", gap: 8 }, breakdownValue: { fontFamily: "Cairo-SemiBold", fontSize: 11, flex: 1, textAlign: "right" }, breakdownMeta: { color: colors.muted, fontSize: 10, textAlign: "left" }, preview: { padding: 10, backgroundColor: colors.tealSoft, borderRadius: 11, alignItems: "flex-end" }, previewText: { color: colors.primary, fontFamily: "Cairo-SemiBold", fontSize: 11 }, hint: { color: colors.muted, fontSize: 10, lineHeight: 18, textAlign: "right" }, cashflowRow: { padding: 12, borderRadius: 12, backgroundColor: colors.tealSoft, flexDirection: "row-reverse", justifyContent: "space-between" }, cashflowLabel: { color: colors.muted, fontFamily: "Cairo-SemiBold", fontSize: 11 }, cashflowValue: { color: colors.primary, fontFamily: "Cairo-Bold", fontSize: 14 }, urgent: { color: colors.danger } });
