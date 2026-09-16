import { Tabs } from "expo-router";
import { colors } from "@/theme/tokens";

export default function CoachTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surfaceRaised },
        headerTintColor: colors.textPrimary,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Overview" }} />
      <Tabs.Screen name="students" options={{ title: "Students" }} />
      <Tabs.Screen name="tournaments" options={{ title: "Tournaments" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
