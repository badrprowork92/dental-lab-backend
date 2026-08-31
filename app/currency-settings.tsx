import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, View } from "react-native";

import { AppText, FormInput, IconButton, LabScreen, PrimaryButton, ScreenTitle, SelectField, SelectionSheet, colors } from "@/components/lab-ui";
import { useLabSession } from "@/providers/lab-session-provider";
import { trpc } from "@/lib/trpc";

type CurrencyCode = "YER" | "SAR" | "USD";

export default function CurrencySettingsScreen() {
  const { session } = useLabSession();
  const params = useLocalSearchParams<{ labId?: string }>();
  const labId = Number(params.labId);
  const canEdit = session?.role === "admin" && Number.isInteger(labId) && labId > 0;
  const adminProfile = trpc.admin.profile.useQuery({ labId: labId || 0 }, { enabled: canEdit });
  const labProfile = trpc.lab.profile.get.useQuery(undefined, { enabled: session?.role === "lab_user" });
  const adminCurrencies = trpc.admin.currencies.useQuery({ labId: labId || 0 }, { enabled: canEdit });
  const labCurrencies = trpc.lab.currencies.list.useQuery(undefined, { enabled: session?.role === "lab_user" });
  const profile = canEdit ? adminProfile.data : labProfile.data;
  const currencies = canEdit ? adminCurrencies.data ?? [] : labCurrencies.data ?? [];
  const [baseCurrencyCode, setBaseCurrencyCode] = useState<CurrencyCode>("YER");
  const [rateValues, setRateValues] = useState<Record<string, string>>({});
  const [basePicker, setBasePicker] = useState(false);
  const utils = trpc.useUtils();
  useEffect(() => { if (profile?.baseCurrencyCode) setBaseCurrencyCode(profile.baseCurrencyCode as CurrencyCode); }, [profile]);
  useEffect(() => { if (currencies.length) setRateValues(Object.fromEntries(currencies.map((item) => [item.currencyCode, String(item.exchangeRate)]))); }, [currencies]);
  const updateProfile = trpc.admin.updateProfile.useMutation();
  const updateCurrency = trpc.admin.updateCurrency.useMutation();
  const save = async () => {
    if (!canEdit || !profile) return;
    try {
      await updateProfile.mutateAsync({ labId, profile: { labName: profile.labName, phoneNumber: profile.phoneNumber, location: profile.location, headerNote1: profile.headerNote1, headerNote2: profile.headerNote2, headerNote3: profile.headerNote3, baseCurrencyCode } });
      await Promise.all(currencies.map((currency) => updateCurrency.mutateAsync({ labId, currencyCode: currency.currencyCode as CurrencyCode, exchangeRate: rateValues[currency.currencyCode] || "1", isActive: currency.isActive })));
      await Promise.all([utils.admin.profile.invalidate(), utils.admin.currencies.invalidate(), utils.lab.currencies.invalidate(), utils.lab.profile.invalidate()]);
      Alert.alert("تم الحفظ", "تم حفظ العملة الأساسية وأسعار الصرف.");
    } catch (error) { Alert.alert("تعذر الحفظ", error instanceof Error ? error.message : "تعذر حفظ إعدادات العملات."); }
  };
  const toggle = async (code: CurrencyCode, active: boolean) => { if (!canEdit) return; if (code === baseCurrencyCode && !active) return Alert.alert("عملة أساسية", "لا يمكن تعطيل العملة الأساسية قبل اختيار عملة بديلة."); try { await updateCurrency.mutateAsync({ labId, currencyCode: code, exchangeRate: rateValues[code] || "1", isActive: active }); await utils.admin.currencies.invalidate(); } catch (error) { Alert.alert("تعذر التحديث", error instanceof Error ? error.message : "تعذر تعديل حالة العملة."); } };
  const activeCurrencies = currencies.filter((item) => item.isActive);
  return <LabScreen><View style={styles.header}><IconButton icon="close" onPress={() => router.back()} /><ScreenTitle title="العملات وأسعار الصرف" subtitle={canEdit ? "حدد العملة الأساسية وأسعار التحويل المعتمدة للمختبر" : "إعدادات العملات للعرض فقط"} /></View><View style={styles.form}>
    <SelectField label="العملة الأساسية للنظام" value={currencies.find((item) => item.currencyCode === baseCurrencyCode)?.displayName ?? baseCurrencyCode} placeholder="اختر العملة الأساسية" onPress={() => canEdit && setBasePicker(true)} />
    <View style={styles.notice}><AppText style={styles.noticeText}>سعر الصرف هو قيمة وحدة من العملة أمام العملة الأساسية. أدخل السعر المعتمد لديك قبل تسجيل حركات بهذه العملة.</AppText></View>
    {currencies.map((currency) => <View key={currency.currencyCode} style={styles.card}><View style={styles.cardTop}><View><AppText style={styles.code}>{currency.currencyCode}</AppText><AppText style={styles.name}>{currency.displayName}</AppText></View>{canEdit ? <Switch value={currency.isActive} onValueChange={(value) => toggle(currency.currencyCode as CurrencyCode, value)} trackColor={{ false: colors.border, true: colors.primary }} /> : null}</View><FormInput label={`سعر الصرف (${currency.currencyCode})`} value={rateValues[currency.currencyCode] ?? ""} onChangeText={(value) => setRateValues((current) => ({ ...current, [currency.currencyCode]: value }))} keyboardType="numeric" editable={canEdit} placeholder="1" /><AppText style={styles.hint}>{currency.currencyCode === baseCurrencyCode ? "هذه هي العملة الأساسية للمختبر." : currency.isActive ? "مفعّلة للحركات والتقارير." : "غير مفعّلة للحركات الجديدة."}</AppText></View>)}
  </View>{canEdit ? <PrimaryButton label={updateProfile.isPending || updateCurrency.isPending ? "جارٍ الحفظ..." : "حفظ إعدادات العملات"} onPress={save} icon="save" disabled={updateProfile.isPending || updateCurrency.isPending} /> : null}<SelectionSheet visible={basePicker} title="اختر العملة الأساسية" items={activeCurrencies.map((item, index) => ({ id: index, label: item.displayName, subtitle: item.currencyCode }))} onClose={() => setBasePicker(false)} onSelect={(item) => { const selected = activeCurrencies[item.id]; if (selected) setBaseCurrencyCode(selected.currencyCode as CurrencyCode); setBasePicker(false); }} /></LabScreen>;
}

const styles = StyleSheet.create({ header: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 12 }, form: { gap: 13 }, notice: { backgroundColor: colors.goldSoft, borderRadius: 14, padding: 12 }, noticeText: { color: colors.warning, textAlign: "right", fontSize: 11, lineHeight: 18 }, card: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 13, gap: 8, backgroundColor: colors.surface }, cardTop: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" }, code: { color: colors.primary, fontFamily: "Cairo-Bold", fontSize: 13, textAlign: "right" }, name: { fontFamily: "Cairo-SemiBold", fontSize: 12, textAlign: "right" }, hint: { color: colors.muted, fontSize: 10, textAlign: "right" } });
