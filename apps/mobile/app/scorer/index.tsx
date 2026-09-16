import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { ConnectionIndicator } from "@/components/ConnectionIndicator";
import { demoScorerOverview } from "@/lib/mock-data";
import { colors, spacing, typography } from "@/theme/tokens";

export default function ScorerOverviewScreen() {
  const data = demoScorerOverview;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <View style={styles.row}>
          <Text style={styles.cardTitle}>Current assignment</Text>
          <ConnectionIndicator state={data.connectionState} />
        </View>
        <Text style={styles.bold}>{data.assignment.tournament}</Text>
        <Text style={styles.muted}>
          {data.assignment.tatami} · Function: {data.assignment.function}
        </Text>
      </Card>

      <Card style={{ borderColor: colors.accent }}>
        <View style={styles.row}>
          <Text style={styles.cardTitle}>Current bout</Text>
          <Badge label={data.currentBout.status} tone="danger" />
        </View>
        <View style={styles.boutRow}>
          <Text style={styles.bold}>{data.currentBout.redPlayer}</Text>
          <Text style={styles.muted}>vs</Text>
          <Text style={styles.bold}>{data.currentBout.bluePlayer}</Text>
        </View>
      </Card>

      <Text style={styles.footnote}>
        The full scoring interface is a Phase 2+ deliverable. This overview intentionally shows only
        assignment and connection state.
      </Text>
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
  boutRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { ...typography.subtitle, color: colors.textPrimary },
  bold: { ...typography.body, fontWeight: "600", color: colors.textPrimary },
  muted: { ...typography.caption, color: colors.textMuted },
  footnote: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
});
