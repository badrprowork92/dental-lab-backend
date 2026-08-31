import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { ActivityIndicator, View } from "react-native";
import { Redirect, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useLabSession } from "@/providers/lab-session-provider";

export default function TabLayout() {
  const colors = useColors();
  const { loading, session } = useLabSession();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  if (loading) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={colors.primary} /></View>;
  if (!session) return <Redirect href={"/login" as Href} />;
  if (session.role === "admin") return <Redirect href={"/admin" as Href} />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "الرئيسية",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen name="orders" options={{ title: "الطلبات", tabBarIcon: ({ color }) => <IconSymbol size={25} name="doc.text.fill" color={color} /> }} />
      <Tabs.Screen name="clients" options={{ title: "الأطباء", tabBarIcon: ({ color }) => <IconSymbol size={25} name="person.2.fill" color={color} /> }} />
      <Tabs.Screen name="reports" options={{ title: "التقارير", tabBarIcon: ({ color }) => <IconSymbol size={25} name="chart.bar.fill" color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: "المزيد", tabBarIcon: ({ color }) => <IconSymbol size={25} name="ellipsis.circle.fill" color={color} /> }} />
    </Tabs>
  );
}
