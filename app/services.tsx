import { router } from "expo-router";
import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, View } from "react-native";

import { AppText, EmptyState, FormInput, IconButton, LabScreen, PrimaryButton, ScreenTitle, colors } from "@/components/lab-ui";
import { formatMoney } from "@/lib/lab-format";
import { trpc } from "@/lib/trpc";

type ServiceSelection = { id: number; serviceName: string; basePrice: string; urgentPrice: string };

export default function ServicesScreen() {
  const { data, isLoading } = trpc.lab.services.list.useQuery();
  const utils = trpc.useUtils();
  const [createOpen, setCreateOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [urgentPrice, setUrgentPrice] = useState("");
  const [selectedService, setSelectedService] = useState<ServiceSelection | null>(null);
  const refresh = () => Promise.all([utils.lab.services.invalidate(), utils.lab.bootstrap.invalidate()]);
  const create = trpc.lab.services.create.useMutation({
    onSuccess: async () => { await refresh(); setCategory(""); setServiceName(""); setBasePrice(""); setUrgentPrice(""); setCreateOpen(false); },
    onError: (error) => Alert.alert("تعذر الحفظ", error.message),
  });
  const updatePrice = trpc.lab.services.updatePrice.useMutation({
    onSuccess: async () => { await refresh(); setPriceOpen(false); setSelectedService(null); setBasePrice(""); setUrgentPrice(""); },
    onError: (error) => Alert.alert("تعذر تحديث السعر", error.message),
  });
  const remove = trpc.lab.services.delete.useMutation({ onSuccess: refresh, onError: (error) => Alert.alert("تعذر الحذف", error.message) });
  const openPrice = (service: NonNullable<typeof data>[number]) => {
    setSelectedService({ id: service.id, serviceName: service.serviceName, basePrice: String(service.basePrice), urgentPrice: String(service.urgentPrice) });
    setBasePrice(String(service.basePrice));
    setUrgentPrice(String(service.urgentPrice));
    setPriceOpen(true);
  };
  const validPrices = () => Boolean(basePrice.trim() && urgentPrice.trim() && Number(basePrice) >= 0 && Number(urgentPrice) >= 0);

  return <LabScreen>
    <View style={styles.header}><IconButton icon="close" onPress={() => router.back()} /><ScreenTitle title="الخدمات والفئات" subtitle="اضبط لكل خدمة سعرًا عاديًا وسعرًا خاصًا بالمستعجل" /></View>
    <PrimaryButton label="إضافة خدمة" onPress={() => setCreateOpen(true)} icon="add" />
    {isLoading ? null : !data?.length ? <EmptyState title="لا توجد خدمات" description="أضف الخدمات والفئات وأسعارها العادية والمستعجلة في مختبرك." icon="category" /> : <View style={styles.list}>{data.map((service) => <View key={service.id} style={styles.card}>
      <Pressable onPress={() => openPrice(service)} style={({ pressed }) => [styles.cardMain, pressed && styles.pressed]}>
        <View style={styles.priceBlock}><AppText style={styles.name}>{service.serviceName}</AppText><AppText style={styles.price}>عادي: {formatMoney(service.basePrice)}</AppText><AppText style={styles.urgentPrice}>مستعجل: {formatMoney(service.urgentPrice)}</AppText></View>
        <View style={styles.badge}><AppText style={styles.badgeText}>{service.category}</AppText></View>
      </Pressable>
      <Pressable onPress={() => Alert.alert("حذف الخدمة", `هل تريد حذف خدمة ${service.serviceName}؟`, [{ text: "إلغاء", style: "cancel" }, { text: "حذف", style: "destructive", onPress: () => remove.mutate({ id: service.id }) }])} style={({ pressed }) => [styles.delete, pressed && styles.pressed]}><AppText style={styles.deleteText}>حذف</AppText></Pressable>
    </View>)}</View>}
    <ServiceModal visible={createOpen} title="خدمة جديدة" confirmLabel={create.isPending ? "جارٍ الحفظ..." : "حفظ"} pending={create.isPending} category={category} serviceName={serviceName} basePrice={basePrice} urgentPrice={urgentPrice} onCategory={setCategory} onName={setServiceName} onBase={setBasePrice} onUrgent={setUrgentPrice} onCancel={() => setCreateOpen(false)} onConfirm={() => { if (!category.trim() || !serviceName.trim() || !validPrices()) return Alert.alert("بيانات مطلوبة", "أدخل الفئة واسم الخدمة والسعر العادي وسعر المستعجل بشكل صحيح."); create.mutate({ category, serviceName, basePrice, urgentPrice }); }} />
    <ServiceModal visible={priceOpen} title="تعديل أسعار الخدمة" subtitle={selectedService?.serviceName} confirmLabel={updatePrice.isPending ? "جارٍ التحديث..." : "تحديث الأسعار"} pending={updatePrice.isPending} basePrice={basePrice} urgentPrice={urgentPrice} onBase={setBasePrice} onUrgent={setUrgentPrice} onCancel={() => setPriceOpen(false)} onConfirm={() => { if (!selectedService || !validPrices()) return Alert.alert("سعر مطلوب", "أدخل السعر العادي وسعر المستعجل بشكل صحيح."); updatePrice.mutate({ id: selectedService.id, basePrice, urgentPrice }); }} />
  </LabScreen>;
}

function ServiceModal({ visible, title, subtitle, confirmLabel, pending, category, serviceName, basePrice, urgentPrice, onCategory, onName, onBase, onUrgent, onCancel, onConfirm }: { visible: boolean; title: string; subtitle?: string; confirmLabel: string; pending: boolean; category?: string; serviceName?: string; basePrice: string; urgentPrice: string; onCategory?: (value: string) => void; onName?: (value: string) => void; onBase: (value: string) => void; onUrgent: (value: string) => void; onCancel: () => void; onConfirm: () => void }) {
  return <Modal visible={visible} transparent animationType="fade"><View style={styles.backdrop}><View style={styles.modal}><AppText style={styles.modalTitle}>{title}</AppText>{subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}{onCategory ? <FormInput label="الفئة" value={category ?? ""} onChangeText={onCategory} placeholder="مثال: خزف" /> : null}{onName ? <FormInput label="اسم الخدمة" value={serviceName ?? ""} onChangeText={onName} placeholder="مثال: زركون" /> : null}<FormInput label="سعر الخدمة العادي" value={basePrice} onChangeText={onBase} keyboardType="numeric" placeholder="0" /><FormInput label="سعر الخدمة المستعجل" value={urgentPrice} onChangeText={onUrgent} keyboardType="numeric" placeholder="0" /><View style={styles.actions}><PrimaryButton label="إلغاء" onPress={onCancel} icon="close" variant="ghost" /><PrimaryButton label={confirmLabel} onPress={onConfirm} icon="save" disabled={pending} /></View></View></View></Modal>;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 12 }, list: { gap: 9 }, card: { padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, cardMain: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" }, priceBlock: { gap: 2, alignItems: "flex-end" }, pressed: { opacity: 0.72 }, badge: { backgroundColor: colors.tealSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }, badgeText: { color: colors.primary, fontFamily: "Cairo-SemiBold", fontSize: 10 }, name: { fontFamily: "Cairo-Bold", fontSize: 14, textAlign: "right" }, price: { color: colors.primary, fontFamily: "Cairo-SemiBold", fontSize: 11, textAlign: "right", marginTop: 3 }, urgentPrice: { color: colors.danger, fontFamily: "Cairo-SemiBold", fontSize: 11, textAlign: "right" }, delete: { alignSelf: "flex-start", marginTop: 7 }, deleteText: { color: colors.danger, fontFamily: "Cairo-SemiBold", fontSize: 10 }, backdrop: { flex: 1, backgroundColor: "rgba(18,38,34,.42)", justifyContent: "center", padding: 20 }, modal: { backgroundColor: colors.background, borderRadius: 24, padding: 20, gap: 14 }, modalTitle: { fontFamily: "Cairo-Bold", fontSize: 18, textAlign: "right" }, subtitle: { color: colors.muted, textAlign: "right" }, actions: { flexDirection: "row-reverse", gap: 10 },
});
