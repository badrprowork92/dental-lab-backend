import { Alert, Pressable, StyleSheet, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, type Href } from "expo-router";

import { AppText, LabScreen, ScreenTitle, colors } from "@/components/lab-ui";
import { useLabSession } from "@/providers/lab-session-provider";

const items = [
  { title: "بيانات المختبر", subtitle: "الاسم والشعار والهاتف والموقع لترويسة التقارير", icon: "business", route: "/lab-profile" },
  { title: "الخدمات والفئات", subtitle: "إدارة أنواع الأعمال والأسعار الأساسية", icon: "category", route: "/services" },
  { title: "فنيو المختبر", subtitle: "التخصصات والعمولات ومستحقات الفنيين", icon: "engineering", route: "/technicians" },
  { title: "إنجازات الفنيين", subtitle: "تسجيل القطع المنجزة وأسعارها وتحديث المستحقات", icon: "construction", route: "/technician-work-form" },
  { title: "سندات صرف الفنيين", subtitle: "تسجيل المبالغ المصروفة وخصمها من المستحقات", icon: "account-balance-wallet", route: "/payout-form" },
  { title: "سندات القبض", subtitle: "الدفعات والخصومات ووسائل التحصيل", icon: "payments", route: "/payment-form" },
  { title: "الأرشيف الكلي الموحد", subtitle: "كل الطلبات والحركات مع بحث وفلاتر متقدمة", icon: "manage-search", route: "/global-archive" },
  { title: "الأرشيف المالي والتشغيلي", subtitle: "السندات والإنجازات والمشتريات مرتبة شهريًا مع التعديل والحذف", icon: "inventory-2", route: "/archive" },
  { title: "المصروفات", subtitle: "تسجيل تكلفة المواد والتشغيل والمصاريف", icon: "receipt-long", route: "/expenses" },
  { title: "حساب التكاليف", subtitle: "المواد والرواتب والإيجارات والمرافق والنثريات", icon: "account-balance-wallet", route: "/costs" },
  { title: "الموردون والمواد", subtitle: "فواتير المواد وسندات الصرف والأرصدة المتبقية", icon: "local-shipping", route: "/suppliers" },
  { title: "الأرباح والخسائر", subtitle: "الإيرادات والتكاليف وصافي النتيجة حسب الفترة", icon: "trending-up", route: "/profit-loss" },
  { title: "الصناديق المالية", subtitle: "أرصدة الصناديق والتحويلات بينها", icon: "account-balance", route: "/cashboxes" },
  { title: "تواصل معنا", subtitle: "واتساب والبريد الإلكتروني للدعم والاستفسارات", icon: "support-agent", route: "/contact" },
];

export default function MoreScreen() { const { signOut } = useLabSession(); return <LabScreen><ScreenTitle title="إدارة المختبر" subtitle="الخدمات والفنيون والحركات المالية" /><View style={styles.list}>{items.map((item) => <Pressable key={item.title} onPress={() => router.push(item.route as never)} style={({ pressed }) => [styles.item, pressed && styles.pressed]}><MaterialIcons name="chevron-left" size={24} color={colors.muted} /><View style={styles.copy}><AppText style={styles.itemTitle}>{item.title}</AppText><AppText style={styles.itemSub}>{item.subtitle}</AppText></View><View style={styles.icon}><MaterialIcons name={item.icon as never} size={22} color={colors.primary} /></View></Pressable>)}<Pressable onPress={() => Alert.alert("تسجيل الخروج", "هل تريد إنهاء الجلسة على هذا الجهاز؟", [{ text: "إلغاء", style: "cancel" }, { text: "تسجيل الخروج", style: "destructive", onPress: () => void signOut().then(() => router.replace("/login" as Href)) }])} style={({ pressed }) => [styles.item, styles.logout, pressed && styles.pressed]}><MaterialIcons name="logout" size={24} color={colors.danger} /><View style={styles.copy}><AppText style={[styles.itemTitle, { color: colors.danger }]}>تسجيل الخروج</AppText><AppText style={styles.itemSub}>إنهاء جلسة حساب المختبر على هذا الجهاز</AppText></View><View style={[styles.icon, styles.logoutIcon]}><MaterialIcons name="lock" size={22} color={colors.danger} /></View></Pressable></View></LabScreen>; }
const styles = StyleSheet.create({ list: { gap: 10 }, item: { minHeight: 82, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 14, flexDirection: "row-reverse", alignItems: "center", gap: 12 }, icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.tealSoft, alignItems: "center", justifyContent: "center" }, copy: { flex: 1, alignItems: "flex-end" }, itemTitle: { fontFamily: "Cairo-Bold", fontSize: 14 }, itemSub: { color: colors.muted, fontSize: 10, marginTop: 3, textAlign: "right" }, logout: { borderColor: "#F2B8B5", backgroundColor: colors.dangerSoft }, logoutIcon: { backgroundColor: "#FFFFFF" }, pressed: { opacity: 0.72 } });
