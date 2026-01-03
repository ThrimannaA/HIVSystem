// styles/appStyles.js
import { StyleSheet } from "react-native";

const appStyles = StyleSheet.create({
  // Login Styles
  loginContainer: {
    flex: 1,
    backgroundColor: "#FFF",
    justifyContent: "center",
    padding: 30,
  },
  loginHeader: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1E3A8A",
    marginBottom: 5,
  },
  loginSub: { fontSize: 16, color: "#6B7280", marginBottom: 30 },
  input: {
    backgroundColor: "#F3F4F6",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    color: "#333",
  },
  loginButton: {
    backgroundColor: "#1E3A8A",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
  },
  loginButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },

  // Dashboard Styles
  dashboardContainer: { flex: 1, backgroundColor: "#F8F9FB", padding: 20 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 30,
  },
  dashWelcome: { fontSize: 16, color: "#6B7280" },
  dashName: { fontSize: 24, fontWeight: "bold", color: "#1A1C1E" },
  notifBadge: {
    backgroundColor: "#EF4444",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  dashSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  quickActionGrid: { flexDirection: "row", justifyContent: "space-between" },
  actionBox: {
    backgroundColor: "#FFF",
    width: "48%",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    elevation: 3,
  },
  actionEmoji: { fontSize: 30, marginBottom: 10 },
  actionText: { fontWeight: "600", color: "#4B5563" },
  infoCard: {
    backgroundColor: "#DBEAFE",
    padding: 20,
    borderRadius: 15,
    marginTop: 30,
  },
  infoTitle: { fontWeight: "bold", color: "#1E40AF", marginBottom: 5 },
  infoText: { color: "#1E40AF", lineHeight: 20 },

  // Main Container
  container: { flex: 1, backgroundColor: "#F8F9FB", padding: 15 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Title Styles
  mainTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    color: "#1A1C1E",
  },

  // Card Styles
  card: {
    backgroundColor: "#FFF",
    padding: 10,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
  },
  questionCard: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: "#2196F3",
  },
  questionText: { fontSize: 15, color: "#333", fontWeight: "500" },

  // Picker Styles
  pickerContainer: {
    marginTop: 10,
    backgroundColor: "#f0f1eeff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    height: 50,
  },

  // Section Header
  sectionHeader: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2196F3",
  },

  // Button Styles
  button: {
    backgroundColor: "#2196F3",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
  },
  buttonText: { color: "#FFF", fontWeight: "700", fontSize: 15 },

  // Result View Styles
  resultView: { marginTop: 10 },
  backLink: { color: "#2196F3", fontWeight: "600", marginBottom: 15 },
  resultMainTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1C1E",
    marginTop: 25,
    marginBottom: 15,
  },

  // Risk Banner
  riskBanner: { padding: 20, borderRadius: 12, marginBottom: 15 },
  riskLevel: { color: "#FFF", fontSize: 22, fontWeight: "bold" },
  riskDescription: { color: "#FFF", fontSize: 14, marginTop: 5, opacity: 0.9 },

  // Metric Container
  metricContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  metricBox: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 12,
    width: "48%",
    alignItems: "center",
    elevation: 2,
  },
  mLabel: { fontSize: 12, color: "#666" },
  mValue: { fontSize: 20, fontWeight: "bold", color: "#333" },

  // Sub Header
  subHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },

  // Factor Card
  factorCard: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  factorQ: { fontSize: 14, fontWeight: "bold", color: "#222" },
  factorA: { fontSize: 13, color: "#666", fontStyle: "italic" },
  factorI: { fontSize: 13, fontWeight: "600", marginTop: 3 },

  // Rationale Card
  rationaleCard: {
    backgroundColor: "#E3F2FD",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  ratTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0D47A1",
    marginBottom: 8,
  },
  ratText: { fontSize: 14, color: "#1565C0", marginBottom: 4 },

  // Intervention Card
  interventionCard: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderTopWidth: 5,
    borderTopColor: "#2196F3",
    elevation: 3,
  },
  intMeta: {
    fontSize: 14,
    color: "#0D47A1",
    fontWeight: "600",
    lineHeight: 20,
    marginTop: 5,
  },
  intLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 8,
    color: "#2196F3",
  },
  intGoalText: {
    fontSize: 15,
    color: "#059669",
    fontWeight: "500",
    lineHeight: 22,
    backgroundColor: "#F0FDF4",
    padding: 10,
    borderRadius: 8,
  },
  weeklyPlanBox: {
    paddingLeft: 5,
  },
  stepText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 10,
  },
  rationaleContent: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
    lineHeight: 20,
  },

  // Disclaimer Card
  disclaimerCard: {
    backgroundColor: "#EFF6FF",
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: "#3B82F6",
    marginBottom: 20,
    elevation: 1,
  },
  disclaimerText: {
    fontSize: 14,
    color: "#1E40AF",
    lineHeight: 20,
    textAlign: "left",
  },

  // Loading Overlay
  loadingOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1C1E",
  },
  loadingSubText: {
    marginTop: 5,
    fontSize: 14,
    color: "#6B7280",
  },

  // Welcome Screen
  welcomeContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emojiTitle: {
    fontSize: 36,
    textAlign: "center",
    marginBottom: 4,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E3A8A",
    textAlign: "center",
    marginTop: 25,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: "#4B5563",
    textAlign: "center",
    marginTop: 15,
    lineHeight: 22,
  },
  welcomeNote: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
  },
});

export default appStyles;
