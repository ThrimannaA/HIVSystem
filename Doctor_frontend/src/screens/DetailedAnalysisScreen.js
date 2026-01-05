import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

const DetailedAnalysisScreen = ({ navigation, route }) => {
  const { patientData, apiResult } = route.params;

  // Calculate resistance percentages for each drug class
  const drugClasses = [
    { 
      name: 'PI', 
      mutations: patientData.PI_MU_Count,
      resistance: Math.min((patientData.PI_MU_Count / 10) * 100, 100),
      level: patientData.PI_MU_Count >= 7 ? 'High' : patientData.PI_MU_Count >= 4 ? 'Medium' : 'Low'
    },
    { 
      name: 'NRTI', 
      mutations: patientData.NRTI_MU_Count,
      resistance: Math.min((patientData.NRTI_MU_Count / 10) * 100, 100),
      level: patientData.NRTI_MU_Count >= 7 ? 'High' : patientData.NRTI_MU_Count >= 4 ? 'Medium' : 'Low'
    },
    { 
      name: 'NNRTI', 
      mutations: patientData.NNRTI_MU_Count,
      resistance: Math.min((patientData.NNRTI_MU_Count / 10) * 100, 100),
      level: patientData.NNRTI_MU_Count >= 7 ? 'High' : patientData.NNRTI_MU_Count >= 4 ? 'Medium' : 'Low'
    },
  ];

  // Determine drug efficacy based on mutation counts and resistance level
  const getDrugStatus = (drugName, drugClass) => {
    const classData = drugClasses.find(dc => dc.name === drugClass);
    if (!classData) return { status: 'Unknown', icon: '❓' };

    if (classData.level === 'High') {
      return { status: 'High Resistance', icon: '⚠️' };
    } else if (classData.level === 'Medium') {
      return { status: 'Intermediate', icon: '⚠️' };
    } else {
      return { status: 'Susceptible', icon: '✅' };
    }
  };

  const individualDrugs = [
    { name: 'TDF', drugClass: 'NRTI', ...getDrugStatus('TDF', 'NRTI') },
    { name: 'FTC', drugClass: 'NRTI', ...getDrugStatus('FTC', 'NRTI') },
    { name: '3TC', drugClass: 'NRTI', ...getDrugStatus('3TC', 'NRTI') },
    { name: 'LPV/r', drugClass: 'PI', ...getDrugStatus('LPV/r', 'PI') },
    { name: 'DRV/r', drugClass: 'PI', ...getDrugStatus('DRV/r', 'PI') },
    { name: 'EFV', drugClass: 'NNRTI', ...getDrugStatus('EFV', 'NNRTI') },
    { name: 'NVP', drugClass: 'NNRTI', ...getDrugStatus('NVP', 'NNRTI') },
  ];

  // Generate key drivers based on data
  const generateKeyDrivers = () => {
    const drivers = [];
    const totalMutations = apiResult.total_mutations;
    
    if (patientData.NRTI_MU_Count >= 4) {
      drivers.push(`High NRTI mutations (${patientData.NRTI_MU_Count}) indicating resistance to nucleoside drugs`);
    }
    if (patientData.PI_MU_Count >= 4) {
      drivers.push(`Elevated PI mutations (${patientData.PI_MU_Count}) affecting protease inhibitor efficacy`);
    }
    if (patientData.NNRTI_MU_Count >= 4) {
      drivers.push(`NNRTI mutations (${patientData.NNRTI_MU_Count}) limiting non-nucleoside options`);
    }
    if (patientData.viralLoad > 50000) {
      drivers.push(`High viral load (${parseInt(patientData.viralLoad).toLocaleString()} copies/mL) indicates active viral replication`);
    }
    if (patientData.cd4Count < 200) {
      drivers.push(`Low CD4+ count (${patientData.cd4Count} cells/μL) suggests advanced immunosuppression`);
    }
    if (totalMutations >= 8) {
      drivers.push(`Total mutation count (${totalMutations}) exceeds threshold for treatment modification`);
    }
    
    if (drivers.length === 0) {
      drivers.push('Low mutation burden suggests good treatment response');
      drivers.push('Current regimen appears effective based on resistance profile');
    }
    
    return drivers;
  };

  const keyDrivers = generateKeyDrivers();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Results</Text>
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>Detailed Analysis</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.detailContainer}>
        <Text style={styles.detailTitle}>📊 RESISTANCE BREAKDOWN</Text>

        <Text style={styles.detailSectionTitle}>Drug Class Resistance</Text>
        {drugClasses.map((drugClass, index) => (
          <View key={index} style={styles.classRow}>
            <View style={styles.classHeader}>
              <Text style={styles.className}>{drugClass.name}</Text>
              <Text style={styles.mutationCount}>({drugClass.mutations} mutations)</Text>
            </View>
            <View style={styles.classBarContainer}>
              <View
                style={[
                  styles.classBar,
                  { 
                    width: `${drugClass.resistance}%`,
                    backgroundColor: drugClass.level === 'High' ? COLORS.danger : 
                                   drugClass.level === 'Medium' ? COLORS.warning : 
                                   COLORS.success
                  }
                ]}
              />
            </View>
            <Text style={styles.classLevel}>
              {Math.round(drugClass.resistance)}% ({drugClass.level})
            </Text>
          </View>
        ))}

        <Text style={styles.detailSectionTitle}>Individual Drug Efficacy</Text>
        <Text style={styles.helperText}>
          Based on drug class resistance patterns and mutation profile
        </Text>
        {individualDrugs.map((drug, index) => (
          <View key={index} style={styles.drugStatusRow}>
            <Text style={styles.drugStatusIcon}>{drug.icon}</Text>
            <View style={styles.drugInfo}>
              <Text style={styles.drugStatusName}>{drug.name}</Text>
              <Text style={styles.drugClass}>({drug.drugClass} class)</Text>
            </View>
            <Text style={[
              styles.drugStatusText,
              { color: drug.status === 'Susceptible' ? COLORS.success : COLORS.warning }
            ]}>
              {drug.status}
            </Text>
          </View>
        ))}

        <Text style={styles.detailTitle}>🔍 KEY CLINICAL DRIVERS</Text>
        <View style={styles.keyDriversBox}>
          {keyDrivers.map((driver, index) => (
            <Text key={index} style={styles.keyDriverItem}>
              {index + 1}. {driver}
            </Text>
          ))}
        </View>

        <Text style={styles.detailTitle}>📈 PROBABILITY BREAKDOWN</Text>
        <View style={styles.probabilityBox}>
          {Object.entries(apiResult.all_probabilities)
            .sort((a, b) => b[1] - a[1]) // Sort by probability descending
            .map(([level, prob]) => (
              <View key={level} style={styles.probDetailRow}>
                <Text style={styles.probDetailLevel}>{level}:</Text>
                <View style={styles.probDetailBarContainer}>
                  <View 
                    style={[
                      styles.probDetailBar, 
                      { width: `${prob * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.probDetailValue}>{(prob * 100).toFixed(1)}%</Text>
              </View>
            ))}
        </View>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            alert('SHAP (SHapley Additive exPlanations) analysis visualization coming soon!');
          }}
        >
          <Text style={styles.actionButtonText}>📈 Show SHAP Analysis</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>← Back to Results</Text>
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
  detailContainer: {
    flex: 1,
    padding: 20,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 10,
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 15,
  },
  helperText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  classRow: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  mutationCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  classBarContainer: {
    height: 20,
    backgroundColor: COLORS.border,
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  classBar: {
    height: '100%',
    borderRadius: 10,
  },
  classLevel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  drugStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  drugStatusIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  drugInfo: {
    flex: 1,
  },
  drugStatusName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  drugClass: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  drugStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  keyDriversBox: {
    backgroundColor: COLORS.lightBlue,
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  keyDriverItem: {
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 22,
  },
  probabilityBox: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  probDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  probDetailLevel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    width: 30,
  },
  probDetailBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: COLORS.border,
    borderRadius: 6,
    marginHorizontal: 15,
    overflow: 'hidden',
  },
  probDetailBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  probDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    width: 55,
    textAlign: 'right',
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
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

export default DetailedAnalysisScreen;