import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { StatTile } from "@/components/StatTile";
import { EmptyState } from "@/components/EmptyState";
import { demoCoachOverview } from "@/lib/mock-data";
import { colors, spacing, typography } from "@/theme/tokens";

export default function CoachOverviewScreen() {
  const data = demoCoachOverview;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.statsGrid}>
        <StatTile label="Students" value={data.stats.studentCount} />
        <StatTile label="Wins" value={data.stats.studentWins} />
        <StatTile label="Losses" value={data.stats.studentLosses} />
        <StatTile label="Medals" value={data.stats.medalsWon} />
      </View>

      <Card>
        <Text style={styles.cardTitle}>Students competing now</Text>
        {data.studentsCompetingNow.length === 0 ? (
          <EmptyState title="No students competing right now" />
        ) : (
          data.studentsCompetingNow.map((student) => (
            <View key={student.name} style={styles.studentRow}>
              <View>
                <Text style={styles.bold}>{student.name}</Text>
                <Text style={styles.muted}>{student.tournament}</Text>
              </View>
              <Badge label={student.status} tone={student.status === "LIVE" ? "danger" : "neutral"} />
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.md },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  cardTitle: { ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.sm },
  studentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  bold: { ...typography.body, fontWeight: "600", color: colors.textPrimary },
  muted: { ...typography.caption, color: colors.textMuted },
});
