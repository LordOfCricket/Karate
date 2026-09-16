import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { StatTile } from "@/components/StatTile";
import { demoPlayerOverview } from "@/lib/mock-data";
import { colors, spacing, typography } from "@/theme/tokens";

export default function PlayerOverviewScreen() {
  const data = demoPlayerOverview;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={{ borderColor: colors.accent }}>
        <View style={styles.row}>
          <Text style={styles.cardTitle}>Upcoming bout</Text>
          <Badge label="Today" tone="warning" />
        </View>
        <Text style={styles.bold}>{data.upcomingBout.tournament}</Text>
        <Text style={styles.muted}>
          {data.upcomingBout.round} · {data.upcomingBout.tatami} · {data.upcomingBout.scheduledAt}
        </Text>
      </Card>

      <View style={styles.statsGrid}>
        <StatTile label="Bouts" value={data.stats.bouts} />
        <StatTile label="Wins" value={data.stats.wins} />
        <StatTile label="Losses" value={data.stats.losses} />
        <StatTile label="Ranking" value={`#${data.stats.ranking}`} />
      </View>

      <Card>
        <Text style={styles.cardTitle}>Current belt</Text>
        <Text style={styles.bold}>{data.currentBelt}</Text>
        <Text style={styles.muted}>{data.academy}</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.md },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  cardTitle: { ...typography.subtitle, color: colors.textPrimary },
  bold: { ...typography.body, fontWeight: "600", color: colors.textPrimary, marginTop: 4 },
  muted: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
});
