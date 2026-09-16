import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, spacing, typography } from "@/theme/tokens";

/**
 * DEV-ONLY role switcher. There is no authentication flow yet (Phase 1
 * scope), so this screen stands in for "log in as a role" and links
 * straight into each role's tab shell. Replace with the real login screen
 * before this ships.
 */
const ROLES = [
  { role: "PLAYER", href: "/player" as const, description: "Track bouts, belt, and ranking." },
  { role: "COACH", href: "/coach" as const, description: "Follow students and live competition." },
  { role: "ACADEMY", href: "/academy" as const, description: "Run your organization." },
  { role: "SCORER", href: "/scorer" as const, description: "Fast, focused officiating." },
];

export default function RoleSwitcherScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Karate Platform</Text>
      <Text style={styles.subheading}>Phase 1 demo — choose a role to preview its dashboard.</Text>
      <View style={styles.list}>
        {ROLES.map((item) => (
          <Link key={item.role} href={item.href} asChild>
            <View style={styles.card}>
              <Text style={styles.role}>{item.role}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </Link>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink, padding: spacing.xl },
  heading: { ...typography.title, color: colors.white, marginTop: spacing.xl },
  subheading: { ...typography.body, color: "rgba(255,255,255,0.7)", marginTop: spacing.xs },
  list: { marginTop: spacing.xl, gap: spacing.md },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  role: { ...typography.subtitle, color: colors.accent },
  description: { ...typography.body, color: "rgba(255,255,255,0.7)", marginTop: 4 },
});
