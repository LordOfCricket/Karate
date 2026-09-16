import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/Card";
import { StatTile } from "@/components/StatTile";
import { demoAcademyOverview } from "@/lib/mock-data";
import { colors, spacing, typography } from "@/theme/tokens";

export default function AcademyOverviewScreen() {
  const data = demoAcademyOverview;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {data.pendingMembershipRequests > 0 && (
        <Card style={{ borderColor: colors.info }}>
          <Text style={styles.bold}>{data.pendingMembershipRequests} pending membership requests</Text>
        </Card>
      )}

      <View style={styles.statsGrid}>
        <StatTile label="Players" value={data.stats.playerCount} />
        <StatTile label="Coaches" value={data.stats.coachCount} />
        <StatTile label="Tournaments hosted" value={data.stats.tournamentsHosted} />
      </View>

      <Card>
        <Text style={styles.cardTitle}>{data.name}</Text>
        <Text style={styles.muted}>
          Organization overview and live tournament activity will surface here.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.md },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  cardTitle: { ...typography.subtitle, color: colors.textPrimary },
  bold: { ...typography.body, fontWeight: "600", color: colors.textPrimary },
  muted: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
});
