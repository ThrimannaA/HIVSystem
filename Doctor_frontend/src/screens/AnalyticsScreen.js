import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { usePatients } from '../context/PatientsContext';

const AnalyticsScreen = ({ navigation }) => {
  const { patients } = usePatients();
  const highRiskCount = patients.filter(p => p.riskScore >= 0.7).length;
  const lowRiskCount = patients.filter(p => p.riskScore < 0.7).length;
  const totalPatients = patients.length;
  const highRiskPercent = ((highRiskCount / totalPatients) * 100).toFixed(1);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>Analytics</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.analyticsContainer}>
        <Text style={styles.analyticsTitle}>📈 SYSTEM STATISTICS</Text>

        <Text style={styles.analyticsSubtitle}>Date Range: Last 30 Days</Text>

        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsCardTitle}>Risk Distribution</Text>
          <View style={styles.distributionBar}>
            <View style={[styles.distributionSegment, { 
              width: `${highRiskPercent}%`, 
              backgroundColor: COLORS.danger 
            }]} />
            <View style={[styles.distributionSegment, { 
              width: `${100 - highRiskPercent}%`, 
              backgroundColor: COLORS.success 
            }]} />
          </View>
          <Text style={styles.distributionText}>
            {highRiskPercent}% High Risk ({highRiskCount}) | {(100 - highRiskPercent).toFixed(1)}% Low Risk ({lowRiskCount})
          </Text>
        </View>

        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsCardTitle}>Prediction Accuracy</Text>
          <Text style={styles.accuracyBig}>87.5%</Text>
          <Text style={styles.accuracySmall}>(AUC-ROC: 0.89)</Text>
        </View>

        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsCardTitle}>Most Common Resistance</Text>
          <Text style={styles.resistanceItem}>1. NRTI class: 45%</Text>
          <Text style={styles.resistanceItem}>2. PI class: 32%</Text>
          <Text style={styles.resistanceItem}>3. NNRTI class: 23%</Text>
        </View>

        <TouchableOpacity style={styles.exportButton}>
          <Text style={styles.buttonText}>📥 Export Analytics Report</Text>
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
  analyticsContainer: {
    flex: 1,
    padding: 20,
  },
  analyticsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  analyticsSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  analyticsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analyticsCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  distributionBar: {
    flexDirection: 'row',
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 10,
  },
  distributionSegment: {
    height: '100%',
  },
  distributionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  accuracyBig: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 5,
  },
  accuracySmall: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  resistanceItem: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 10,
  },
  exportButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AnalyticsScreen;