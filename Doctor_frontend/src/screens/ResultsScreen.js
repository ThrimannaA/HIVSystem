import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

const ResultsScreen = ({ navigation, route }) => {
  const { patientData, apiResult } = route.params;

  // Map API result to display data
  const getRiskScore = () => {
    const resistanceLevel = apiResult.predicted_resistance_level;
    // Map resistance levels to risk scores
    if (resistanceLevel === 'H') return 0.9;
    if (resistanceLevel === 'I') return 0.6;
    if (resistanceLevel === 'L') return 0.3;
    if (resistanceLevel === 'P') return 0.2;
    return 0.1; // S - Susceptible
  };

  const riskScore = getRiskScore();
  const riskLevel = apiResult.risk_category || 'MODERATE';

  const getRiskColor = () => {
    if (riskScore >= 0.7) return COLORS.danger;
    if (riskScore >= 0.4) return COLORS.warning;
    return COLORS.success;
  };

  const getRiskBackground = () => {
    if (riskScore >= 0.7) return COLORS.lightRed;
    if (riskScore >= 0.4) return COLORS.lightOrange;
    return COLORS.lightGreen;
  };

  const getResistanceLevelText = (level) => {
    const mapping = {
      'H': 'High Resistance',
      'I': 'Intermediate Resistance',
      'L': 'Low Resistance',
      'P': 'Potential Resistance',
      'S': 'Susceptible'
    };
    return mapping[level] || 'Unknown';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.backButton}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>Results</Text>
        <TouchableOpacity>
          <Text style={styles.shareButton}>📤 Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultContainer}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientInfoText}>
            Patient: {patientData.patientId} ({patientData.sex}, {patientData.age}yo)
          </Text>
          <Text style={styles.patientInfoDate}>
            Analysis Date: {new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* Risk Assessment */}
        <Text style={styles.resultSectionTitle}>⚠️ RISK ASSESSMENT</Text>
        <View style={[styles.riskCard, { backgroundColor: getRiskBackground() }]}>
          <View style={styles.riskIconContainer}>
            <Text style={styles.riskEmoji}>
              {riskScore >= 0.7 ? '🔴' : riskScore >= 0.4 ? '🟡' : '🟢'}
            </Text>
            <Text style={[styles.riskLevel, { color: getRiskColor() }]}>
              {riskLevel}
            </Text>
          </View>

          <Text style={styles.riskScoreLabel}>Resistance Level:</Text>
          <View style={styles.resistanceBadgeContainer}>
            <Text style={[styles.resistanceLevelBig, { color: getRiskColor() }]}>
              {apiResult.predicted_resistance_level}
            </Text>
            <Text style={[styles.resistanceLevelText, { color: getRiskColor() }]}>
              {getResistanceLevelText(apiResult.predicted_resistance_level)}
            </Text>
          </View>

          <Text style={styles.riskScoreLabel}>Risk Score:</Text>
          <Text style={[styles.riskScoreValue, { color: getRiskColor() }]}>
            {(riskScore * 100).toFixed(0)}%
          </Text>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${riskScore * 100}%`, backgroundColor: getRiskColor() }
              ]}
            />
          </View>

          <View style={styles.mutationSummary}>
            <Text style={styles.mutationText}>
              Total Mutations: {apiResult.total_mutations}
            </Text>
            <Text style={styles.mutationBreakdown}>
              PI: {patientData.PI_MU_Count} | NRTI: {patientData.NRTI_MU_Count} | NNRTI: {patientData.NNRTI_MU_Count}
            </Text>
          </View>
        </View>

        {/* Probabilities Section */}
        <Text style={styles.resultSectionTitle}>📊 RESISTANCE PROBABILITIES</Text>
        <View style={styles.probabilitiesCard}>
          {Object.entries(apiResult.all_probabilities).map(([level, prob]) => (
            <View key={level} style={styles.probRow}>
              <Text style={styles.probLabel}>{getResistanceLevelText(level)}:</Text>
              <View style={styles.probBarContainer}>
                <View 
                  style={[
                    styles.probBar, 
                    { width: `${prob * 100}%`, backgroundColor: getRiskColor() }
                  ]} 
                />
              </View>
              <Text style={styles.probValue}>{(prob * 100).toFixed(1)}%</Text>
            </View>
          ))}
        </View>

        {/* Recommendation */}
        <Text style={styles.resultSectionTitle}>💊 RECOMMENDATION</Text>
        <View style={styles.recommendationCard}>
          <Text style={[styles.recommendationTitle, { color: getRiskColor() }]}>
            {apiResult.recommendation}
          </Text>
          <Text style={styles.recommendationText}>
            {apiResult.explanation}
          </Text>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('DetailedAnalysis', { 
            patientData, 
            apiResult 
          })}
        >
          <Text style={styles.actionButtonText}>📊 Detailed Analysis</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('TreatmentRecommendation', { 
            patientData, 
            apiResult 
          })}
        >
          <Text style={styles.actionButtonText}>💊 Treatment Options</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            // Generate report functionality
            alert('Report generation feature coming soon!');
          }}
        >
          <Text style={styles.actionButtonText}>📝 Generate Report</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('PatientInput')}
        >
          <Text style={styles.secondaryButtonText}>➕ New Analysis</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    color: COLORS.primary,
    fontSize: 16,
  },
  headerBarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  shareButton: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    padding: 20,
  },
  patientInfo: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  patientInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 5,
  },
  patientInfoDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  resultSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 15,
  },
  riskCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  riskIconContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  riskEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  riskLevel: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  resistanceBadgeContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  resistanceLevelBig: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  resistanceLevelText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 5,
  },
  riskScoreLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 5,
    textAlign: 'center',
  },
  riskScoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: COLORS.white,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 15,
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  mutationSummary: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  mutationText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 5,
    textAlign: 'center',
  },
  mutationBreakdown: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  probabilitiesCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  probRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  probLabel: {
    fontSize: 14,
    color: COLORS.text,
    width: 140,
  },
  probBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  probBar: {
    height: '100%',
    borderRadius: 4,
  },
  probValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    width: 50,
    textAlign: 'right',
  },
  recommendationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  recommendationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  recommendationText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ResultsScreen;