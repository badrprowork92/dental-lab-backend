import { router, useLocalSearchParams } from "expo-router";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";

import { AppText, FormInput, IconButton, PrimaryButton, ScreenTitle, colors } from "@/components/lab-ui";
import { trpc } from "@/lib/trpc";

export default function ClientFormScreen() {
  const { clientId } = useLocalSearchParams<{ clientId?: string }>();
  const editingId = clientId ? Number(clientId) : null;
  const isEditing = Number.isInteger(editingId) && Number(editingId) > 0;
  const client = trpc.lab.clients.byId.useQuery({ id: Number(editingId) }, { enabled: isEditing });
  const utils = trpc.useUtils();
  const [doctorName, setDoctorName] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [creditLimit, setCreditLimit] = useState("");

  useEffect(() => {
    if (!client.data) return;
    setDoctorName(client.data.doctorName);
    setClinicName(client.data.clinicName);
    setPhoneNumber(client.data.phoneNumber ?? "");
    setCreditLimit(String(client.data.creditLimit ?? "0"));
  }, [client.data]);

  const save = trpc.lab.clients.create.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.lab.bootstrap.invalidate(), utils.lab.clients.list.invalidate(), utils.lab.reports.invalidate()]);
      router.back();
    },
    onError: (error) => Alert.alert("تعذر الحفظ", error.message),
  });
  const update = trpc.lab.clients.update.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.lab.bootstrap.invalidate(), utils.lab.clients.list.invalidate(), utils.lab.clients.byId.invalidate(), utils.lab.reports.invalidate()]);
      router.back();
    },
    onError: (error) => Alert.alert("تعذر التعديل", error.message),
  });

  const submit = () => {
    const doctor = doctorName.trim();
    const clinic = clinicName.trim();
    if (!doctor || !clinic) return Alert.alert("بيانات مطلوبة", "أدخل اسم الطبيب واسم العيادة.");
    const input = { doctorName: doctor, clinicName: clinic, phoneNumber: phoneNumber.trim() || undefined, creditLimit: creditLimit.trim() || "0" };
    if (isEditing && editingId) update.mutate({ id: editingId, ...input });
    else save.mutate(input);
  };

  const pending = save.isPending || update.isPending || (isEditing && client.isLoading);
  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}><IconButton icon="close" onPress={() => router.back()} /><ScreenTitle title={isEditing ? "تعديل الطبيب أو العيادة" : "إضافة طبيب أو عيادة"} subtitle="تظهر المعاملات والرصيد ضمن الملف نفسه" /></View>
      {isEditing && client.isError ? <AppText style={styles.error}>تعذر تحميل بيانات السجل. أعد المحاولة.</AppText> : null}
      <View style={styles.form}>
        <FormInput label="اسم الدكتور" value={doctorName} onChangeText={setDoctorName} placeholder="مثال: د. أحمد" />
        <FormInput label="اسم العيادة" value={clinicName} onChangeText={setClinicName} placeholder="اسم العيادة" />
        <FormInput label="رقم الهاتف" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" placeholder="رقم التواصل" />
        <FormInput label="الحد الائتماني" value={creditLimit} onChangeText={setCreditLimit} keyboardType="numeric" placeholder="0" />
      </View>
      <PrimaryButton label={pending ? "جارٍ الحفظ..." : isEditing ? "حفظ التعديل" : "حفظ الطبيب"} onPress={submit} icon="save" disabled={Boolean(pending)} />
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.background }, content: { padding: 20, paddingTop: 54, gap: 22 }, header: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 12 }, form: { gap: 14 }, error: { color: colors.danger, textAlign: "right" } });
