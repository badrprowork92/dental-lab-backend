import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";

import { AppText, FormInput, IconButton, PrimaryButton, ScreenTitle, SelectField, SelectionSheet, colors } from "@/components/lab-ui";
import { DateField } from "@/components/date-field";
import { formatMoney, orderLabels } from "@/lib/lab-format";
import { calculateOrderTotal, calculateUnitPrice, countToothLocations } from "@/lib/accounting";
import { orderInvoiceHtml, sharePdf } from "@/lib/pdf-reports";
import { trpc } from "@/lib/trpc";

const today = new Date().toISOString().slice(0, 10);
type Picker = "client" | "category" | "service" | "technician" | "currency" | null;

export default function OrderFormScreen() {
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = Number(params.orderId);
  const isEditing = Number.isInteger(orderId) && orderId > 0;
  const { data, isLoading } = trpc.lab.bootstrap.useQuery();
  const { data: existingOrder, isLoading: isLoadingOrder } = trpc.lab.orders.byId.useQuery({ id: orderId }, { enabled: isEditing });
  const { data: currencies = [] } = trpc.lab.currencies.list.useQuery();
  const { data: profile } = trpc.lab.profile.get.useQuery();
  const utils = trpc.useUtils();
  const didLoadExisting = useRef(false);
  const [clientId, setClientId] = useState<number | null>(null);
  const [category, setCategory] = useState("");
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [techId, setTechId] = useState<number | null>(null);
  const [picker, setPicker] = useState<Picker>(null);
  const [caseNumber, setCaseNumber] = useState("");
  const [orderDate, setOrderDate] = useState(today);
  const [patientName, setPatientName] = useState("");
  const [orderType, setOrderType] = useState<"normal" | "urgent">("normal");
  const [currencyCode, setCurrencyCode] = useState<"YER" | "SAR" | "USD">("YER");
  const [teethCount, setTeethCount] = useState("");
  const [quantityOverridden, setQuantityOverridden] = useState(false);
  const [unitPrice, setUnitPrice] = useState("");
  const [upperRight, setUpperRight] = useState("");
  const [upperLeft, setUpperLeft] = useState("");
  const [lowerRight, setLowerRight] = useState("");
  const [lowerLeft, setLowerLeft] = useState("");
  const [notes, setNotes] = useState("");

  const servicesForCategory = useMemo(() => data?.services.filter((entry) => entry.category === category) ?? [], [data?.services, category]);
  const categories = useMemo(() => Array.from(new Set(data?.services.map((entry) => entry.category) ?? [])), [data?.services]);
  const detectedCount = useMemo(() => countToothLocations(upperRight, upperLeft, lowerRight, lowerLeft), [upperRight, upperLeft, lowerRight, lowerLeft]);
  const client = data?.clients.find((entry) => entry.id === clientId);
  const service = data?.services.find((entry) => entry.id === serviceId);
  const tech = data?.technicians.find((entry) => entry.id === techId);
  const total = useMemo(() => calculateOrderTotal(teethCount, unitPrice), [teethCount, unitPrice]);

  useEffect(() => {
    if (!quantityOverridden) setTeethCount(detectedCount ? String(detectedCount) : "");
  }, [detectedCount, quantityOverridden]);

  useEffect(() => {
    if (!isEditing || !existingOrder || !data || didLoadExisting.current) return;
    didLoadExisting.current = true;
    const existingService = data.services.find((entry) => entry.id === existingOrder.serviceId);
    setClientId(existingOrder.clientId); setCategory(existingService?.category ?? ""); setServiceId(existingOrder.serviceId);
    setCaseNumber(existingOrder.invoiceNumber); setOrderDate(existingOrder.orderDate); setPatientName(existingOrder.patientName ?? "");
    setOrderType(existingOrder.orderType === "urgent" ? "urgent" : "normal"); setUpperRight(existingOrder.upperRight); setUpperLeft(existingOrder.upperLeft); setLowerRight(existingOrder.lowerRight); setLowerLeft(existingOrder.lowerLeft);
    setTeethCount(String(existingOrder.teethCount)); setQuantityOverridden(true); setUnitPrice(String(existingOrder.unitPrice)); setCurrencyCode(existingOrder.currencyCode as "YER" | "SAR" | "USD"); setNotes(existingOrder.notes ?? "");
  }, [isEditing, existingOrder, data]);

  const createOrder = trpc.lab.orders.create.useMutation();
  const updateOrder = trpc.lab.orders.update.useMutation();
  const assign = trpc.lab.technicians.assign.useMutation();
  const pending = createOrder.isPending || updateOrder.isPending || assign.isPending;

  const chooseService = (id: number) => {
    const selected = data?.services.find((entry) => entry.id === id);
    setServiceId(id);
    if (selected) setUnitPrice(String(orderType === "urgent" ? selected.urgentPrice : selected.basePrice));
  };
  const changeOrderType = (type: "normal" | "urgent") => {
    setOrderType(type);
    if (service) setUnitPrice(String(type === "urgent" ? service.urgentPrice : service.basePrice));
  };
  const resetForSequentialEntry = () => {
    setCaseNumber(""); setPatientName(""); setUpperRight(""); setUpperLeft(""); setLowerRight(""); setLowerLeft(""); setTeethCount(""); setQuantityOverridden(false); setNotes(""); setTechId(null);
    if (service) setUnitPrice(String(orderType === "urgent" ? service.urgentPrice : service.basePrice));
  };
  const invalidate = async () => Promise.all([utils.lab.bootstrap.invalidate(), utils.lab.orders.invalidate(), utils.lab.clients.invalidate(), utils.lab.dashboard.invalidate()]);
  const save = async (mode: "sequential" | "new") => {
    if (!clientId || !serviceId || !caseNumber.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(orderDate) || !Number(teethCount) || Number(teethCount) < 1 || !unitPrice.trim() || Number(unitPrice) < 0) {
      return Alert.alert("بيانات مطلوبة", "أدخل رقم الحالة والتاريخ واختر الطبيب والفئة والخدمة وحدد كمية وسعرًا صحيحين.");
    }
    const input = { invoiceNumber: caseNumber, clientId, patientName: patientName || undefined, orderDate, orderType, serviceId, upperRight, upperLeft, lowerRight, lowerLeft, teethCount: Number(teethCount), unitPrice, currencyCode, notes: notes || undefined };
    try {
      if (isEditing) {
        await updateOrder.mutateAsync({ id: orderId, ...input });
        await invalidate();
        Alert.alert("تم الحفظ", "تم تحديث بيانات الحالة.");
        router.back();
        return;
      }
      const id = await createOrder.mutateAsync(input);
      if (techId) await assign.mutateAsync({ orderId: id, technicianId: techId, stageName: "wax", assignedTeeth: Number(teethCount) });
      await invalidate();
      if (mode === "sequential") { resetForSequentialEntry(); return Alert.alert("تم الحفظ", "يمكنك الآن إدخال حالة أخرى للطبيب نفسه بسرعة."); }
      router.replace("/order-form");
    } catch (error) {
      Alert.alert("تعذر حفظ الطلب", error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
    }
  };

  if (isLoading || !data || (isEditing && isLoadingOrder)) return <KeyboardAvoidingView style={styles.page} />;
  const activeCurrencies = currencies.filter((entry) => entry.isActive);
  const selectedCurrency = activeCurrencies.find((entry) => entry.currencyCode === currencyCode);
  const printInvoice = async () => { if (!existingOrder || !profile || !client || !service) return; try { await sharePdf(orderInvoiceHtml(profile, { ...existingOrder, doctorName: client.doctorName, clinicName: client.clinicName, category: service.category, serviceName: service.serviceName }), `فاتورة الحالة ${existingOrder.invoiceNumber}`); } catch (error) { Alert.alert("تعذر الطباعة", error instanceof Error ? error.message : "تعذر تجهيز الفاتورة."); } };
  const pickerItems = picker === "client" ? data.clients.map((entry) => ({ id: entry.id, label: entry.doctorName, subtitle: entry.clinicName }))
    : picker === "category" ? categories.map((entry, index) => ({ id: index, label: entry, subtitle: "اختر الفئة" }))
      : picker === "service" ? servicesForCategory.map((entry) => ({ id: entry.id, label: entry.serviceName, subtitle: `عادي: ${formatMoney(entry.basePrice)} · مستعجل: ${formatMoney(entry.urgentPrice)}` }))
        : picker === "currency" ? activeCurrencies.map((entry, index) => ({ id: index, label: entry.displayName, subtitle: entry.currencyCode }))
          : data.technicians.map((entry) => ({ id: entry.id, label: entry.techName, subtitle: entry.specialty }));

  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={styles.header}><IconButton icon="close" onPress={() => router.back()} /><ScreenTitle title={isEditing ? "تعديل طلب" : "طلب جديد"} subtitle={isEditing ? "صحّح بيانات الحالة ثم احفظ التعديل" : "أدخل البيانات حسب السجل الدفتري"} /></View><View style={styles.form}>
    <View style={styles.twoCols}><View style={styles.flex}><FormInput label="رقم الحالة" value={caseNumber} onChangeText={setCaseNumber} keyboardType="default" placeholder="يُدخل يدويًا كل شهر" /></View><View style={styles.flex}><DateField label="تاريخ الحالة" value={orderDate} onChange={setOrderDate} /></View></View>
    <View style={styles.twoCols}><View style={styles.flex}><SelectField label="الطبيب / العيادة" value={client ? `${client.doctorName} — ${client.clinicName}` : undefined} placeholder="اختر الطبيب" onPress={() => setPicker("client")} /></View><View style={styles.flex}><SelectField label="العملة" value={selectedCurrency ? `${selectedCurrency.displayName} (${currencyCode})` : currencyCode} placeholder="اختر العملة" onPress={() => setPicker("currency")} /></View></View>
    <View style={styles.twoCols}><View style={styles.flex}><SelectField label="الفئة" value={category || undefined} placeholder="خزف، مثبتات..." onPress={() => setPicker("category")} /></View><View style={styles.flex}><SelectField label="نوع الخدمة" value={service?.serviceName} placeholder={category ? "اختر الخدمة" : "اختر الفئة أولًا"} onPress={() => category && setPicker("service")} /></View></View>
    <AppText style={styles.label}>نوع الطلب</AppText><View style={styles.types}>{(["normal", "urgent"] as const).map((type) => <Pressable key={type} onPress={() => changeOrderType(type)} style={({ pressed }) => [styles.type, orderType === type && styles.typeActive, pressed && styles.pressed]}><AppText style={[styles.typeText, orderType === type && styles.typeTextActive]}>{orderLabels[type]}{service ? ` (${formatMoney(type === "urgent" ? service.urgentPrice : service.basePrice)})` : ""}</AppText></Pressable>)}</View>
    <AppText style={styles.label}>موقع الأسنان</AppText><View style={styles.twoCols}><View style={styles.flex}><FormInput label="علوي يمين" value={upperRight} onChangeText={setUpperRight} placeholder="مثال: 5432" /></View><View style={styles.flex}><FormInput label="علوي يسار" value={upperLeft} onChangeText={setUpperLeft} placeholder="مثال: 1234" /></View></View><View style={styles.twoCols}><View style={styles.flex}><FormInput label="سفلي يمين" value={lowerRight} onChangeText={setLowerRight} placeholder="مثال: 8765" /></View><View style={styles.flex}><FormInput label="سفلي يسار" value={lowerLeft} onChangeText={setLowerLeft} placeholder="مثال: 5678" /></View></View>
    <View style={styles.twoCols}><View style={styles.flex}><FormInput label="الكمية / عدد المواقع" value={teethCount} onChangeText={(value) => { setQuantityOverridden(true); setTeethCount(value); }} keyboardType="numeric" placeholder="يُحتسب تلقائيًا" />{quantityOverridden ? <Pressable onPress={() => { setQuantityOverridden(false); setTeethCount(detectedCount ? String(detectedCount) : ""); }} style={({ pressed }) => [styles.restore, pressed && styles.pressed]}><AppText style={styles.restoreText}>استعادة العدد التلقائي ({detectedCount})</AppText></Pressable> : null}</View><View style={styles.flex}><FormInput label="سعر الوحدة" value={unitPrice} onChangeText={setUnitPrice} keyboardType="numeric" placeholder="يُسحب من الخدمة" /></View></View>
    <View style={styles.total}><AppText style={styles.totalValue}>{formatMoney(total)}</AppText><AppText style={styles.totalLabel}>الإجمالي المحسوب تلقائيًا</AppText></View>
    <FormInput label="اسم المريض أو ملاحظة مختصرة" value={patientName} onChangeText={setPatientName} placeholder="اختياري" />
    {!isEditing ? <SelectField label="إسناد لفني (اختياري)" value={tech ? `${tech.techName} — ${tech.specialty}` : undefined} placeholder="اختر الفني" onPress={() => setPicker("technician")} /> : null}
    <FormInput label="ملاحظات إضافية" value={notes} onChangeText={setNotes} multiline placeholder="أي تفاصيل إضافية للحالة" />
  </View><View style={styles.actions}>{isEditing ? <><PrimaryButton label="طباعة فاتورة PDF" onPress={printInvoice} icon="picture-as-pdf" variant="secondary" /><PrimaryButton label={pending ? "جارٍ الحفظ..." : "حفظ التعديلات"} onPress={() => save("new")} icon="save" disabled={pending} /></> : <><PrimaryButton label={pending ? "جارٍ الحفظ..." : "حفظ متسلسل"} onPress={() => save("sequential")} icon="content-copy" variant="secondary" disabled={pending} /><PrimaryButton label={pending ? "جارٍ الحفظ..." : "حفظ الطلب"} onPress={() => save("new")} icon="save" disabled={pending} /></>}</View>
    <SelectionSheet visible={Boolean(picker)} title={picker === "client" ? "اختر الطبيب أو العيادة" : picker === "category" ? "اختر الفئة" : picker === "service" ? "اختر نوع الخدمة" : picker === "currency" ? "اختر العملة" : "اختر الفني"} items={pickerItems} onClose={() => setPicker(null)} onSelect={(item) => { if (picker === "client") { setClientId(item.id); const selected = data.clients.find((entry) => entry.id === item.id); if (selected?.defaultCurrencyCode) setCurrencyCode(selected.defaultCurrencyCode as "YER" | "SAR" | "USD"); } if (picker === "category") { setCategory(categories[item.id] ?? ""); setServiceId(null); setUnitPrice(""); } if (picker === "service") chooseService(item.id); if (picker === "currency") { const selected = activeCurrencies[item.id]; if (selected) setCurrencyCode(selected.currencyCode as "YER" | "SAR" | "USD"); } if (picker === "technician") setTechId(item.id); setPicker(null); }} />
  </ScrollView></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.background }, content: { padding: 20, paddingTop: 54, paddingBottom: 40, gap: 20 }, header: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 12 }, form: { gap: 14 }, label: { fontFamily: "Cairo-SemiBold", fontSize: 12, textAlign: "right" }, types: { flexDirection: "row-reverse", gap: 8 }, type: { flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 }, typeActive: { backgroundColor: colors.primary, borderColor: colors.primary }, typeText: { color: colors.muted, fontSize: 11, fontFamily: "Cairo-SemiBold", textAlign: "center" }, typeTextActive: { color: "#FFFFFF" }, twoCols: { flexDirection: "row-reverse", gap: 9 }, flex: { flex: 1 }, total: { backgroundColor: colors.tealSoft, borderRadius: 14, padding: 14, alignItems: "flex-end" }, totalLabel: { color: colors.muted, fontSize: 10 }, totalValue: { color: colors.primary, fontFamily: "Cairo-Bold", fontSize: 19, marginTop: 3 }, restore: { marginTop: -6, paddingVertical: 5, alignSelf: "flex-end" }, restoreText: { color: colors.primary, fontSize: 10, fontFamily: "Cairo-SemiBold" }, actions: { gap: 10 }, pressed: { opacity: 0.72 } });
