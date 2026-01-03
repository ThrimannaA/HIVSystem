// styles/RiskTrendScreenStyles.js
import { StyleSheet } from "react-native";

const riskTrendStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6B7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 12,
  },
  emptyTip: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    fontStyle: "italic",
  },
  chartCard: {
    backgroundColor: "#FFF",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: "center",
    marginVertical: 10,
    paddingHorizontal: 15,
    overflow: "visible",
  },
  legend: {
    marginTop: 20,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
    marginHorizontal: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#4B5563",
  },
  tooltip: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minWidth: 160,
  },
  tooltipDate: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
  },
  tooltipRiskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  tooltipRisk: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  tooltipScore: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
  },
  summaryContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  summaryCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    elevation: 1,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  distributionCard: {
    backgroundColor: "#FFF",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
  },
  distributionBars: {
    marginTop: 16,
  },
  distributionItem: {
    marginBottom: 20,
  },
  distributionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  distributionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  distributionLevel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  distributionCount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4B5563",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  distributionDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  insightsCard: {
    backgroundColor: "#FFF",
    margin: 16,
    marginBottom: 32,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
  },
  insightItem: {
    flexDirection: "row",
    marginTop: 16,
  },
  insightEmoji: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
});

export default riskTrendStyles;
