import { ActivityIndicator, View } from "react-native";
import { Redirect, type Href } from "expo-router";

import { colors } from "@/components/lab-ui";
import { useLabSession } from "@/providers/lab-session-provider";

export default function AppEntry() {
  const { loading, session } = useLabSession();
  if (loading) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}><ActivityIndicator color={colors.primary} size="large" /></View>;
  if (!session) return <Redirect href={"/login" as Href} />;
  return <Redirect href={(session.role === "admin" ? "/admin" : "/(tabs)") as Href} />;
}
