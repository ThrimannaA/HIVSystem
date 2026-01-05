import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { COLORS } from '../constants/colors';

const TreatmentRecommendationScreen = ({ navigation, route }) => {
  const { patientData, apiResult } = route.params;

  // Generate treatment recommendations based on resistance profile
  const generateRecommendations = () => {
    const recommendations = [];
    const resistanceLevel = apiResult.predicted_resistance_level;
    const piMutations = patientData.PI_MU_Count;
    const nrtiMutations = patientData.NRTI_MU_Count;
    const nnrtiMutations = patientData.NNRTI_MU_Count;

    // High resistance - need alternative regimens
    if (resistanceLevel === 'H' || resistanceLevel === 'I') {
      if (piMutations < 3) {
        recommendations.push({
          priority: '🥇 FIRST CHOICE',
          regimen: 'DRV/r + ABC + 3TC',
          success: 90,
          reason: 'Low PI resistance; DRV/r has high barrier to resistance',
          details: 'Darunavir/ritonavir with Abacavir and Lamivudine provides robust viral suppression'
        });
      }

      if (nrtiMutations < 3) {
        recommendations.push({
          priority: recommendations.length === 0 ? '🥇 FIRST CHOICE' : '🥈 ALTERNATIVE OPTION',
          regimen: 'DTG + TAF + FTC',
          success: 88,
          reason: 'INSTI-based regimen with low NRTI resistance',
          details: 'Dolutegravir (INSTI) combined with Tenofovir alafenamide and Emtricitabine'
        });
      }

      if (nnrtiMutations < 3) {
        recommendations.push({
          priority: recommendations.length === 0 ? '🥇 FIRST CHOICE' : '🥈 ALTERNATIVE OPTION',
          regimen: 'EFV + TDF + 3TC',
          success: 82,
          reason: 'Low NNRTI resistance detected',
          details: 'Efavirenz-based combination with standard NRTIs'
        });
      }

      // Add boosted PI option
      recommendations.push({
        priority: recommendations.length === 0 ? '🥇 FIRST CHOICE' : '🥉 THIRD OPTION',
        regimen: 'ATV/r + RAL + FTC',
        success: 85,
        reason: 'Combination therapy with boosted PI and INSTI',
        details: 'Atazanavir/ritonavir with Raltegravir and Emtricitabine'
      });

    } else {
      // Low/Susceptible - continue or optimize current regimen
      recommendations.push({
        priority: '🥇 RECOMMENDED',
        regimen: 'Continue Current Regimen',
        success: 95,
        reason: 'Low resistance profile - current therapy effective',
        details: `Continue ${patientData.artRegimen} with regular monitoring`
      });

      recommendations.push({
        priority: '🥈 OPTIMIZATION OPTION',
        regimen: 'BIC/TAF/FTC',
        success: 92,
        reason: 'Single-tablet INSTI-based regimen for improved adherence',
        details: 'Bictegravir/Tenofovir alafenamide/Emtricitabine - modern STR'
      });
    }

    return recommendations.slice(0, 3); // Return top 3 recommendations
  };

  // Generate drugs to avoid based on resistance
  const getDrugsToAvoid = () => {
    const avoid = [];
    const piMutations = patientData.PI_MU_Count;
    const nrtiMutations = patientData.NRTI_MU_Count;
    const nnrtiMutations = patientData.NNRTI_MU_Count;

    if (nrtiMutations >= 5) {
      avoid.push({ drug: 'TDF/TAF', reason: 'High NRTI resistance detected' });
      avoid.push({ drug: 'ABC', reason: 'Cross-resistance with other NRTIs' });
    } else if (nrtiMutations >= 3) {
      avoid.push({ drug: 'TDF', reason: 'Moderate NRTI resistance' });
    }

    if (nnrtiMutations >= 4) {
      avoid.push({ drug: 'EFV', reason: 'High NNRTI resistance' });
      avoid.push({ drug: 'NVP', reason: 'NNRTI class resistance' });
    }

    if (piMutations >= 5) {
      avoid.push({ drug: 'LPV/r', reason: 'PI resistance detected' });
    }

    if (avoid.length === 0) {
      avoid.push({ drug: 'None', reason: 'No specific drugs to avoid based on current resistance profile' });
    }

    return avoid;
  };

  const recommendations = generateRecommendations();
  const drugsToAvoid = getDrugsToAvoid();

  const handleSelectRegimen = (regimen) => {
    Alert.alert(
      'Regimen Selected',
      `You've selected: ${regimen}\n\nThis will be added to the patient's treatment plan.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => {
            Alert.alert('Success', 'Treatment plan updated successfully!');
            navigation.navigate('Results', { patientData, apiResult });
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>Treatment Plan</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.treatmentContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resistance Summary</Text>
          <Text style={styles.summaryText}>
            Level: <Text style={styles.summaryBold}>{apiResult.predicted_resistance_level}</Text>
          </Text>
          <Text style={styles.summaryText}>
            Category: <Text style={styles.summaryBold}>{apiResult.risk_category}</Text>
          </Text>
          <Text style={styles.summaryText}>
            Mutations: PI({patientData.PI_MU_Count}) | NRTI({patientData.NRTI_MU_Count}) | NNRTI({patientData.NNRTI_MU_Count})
          </Text>
        </View>

        <Text style={styles.treatmentTitle}>💊 RECOMMENDED REGIMENS</Text>

        {recommendations.map((rec, index) => (
          <View key={index} style={styles.treatmentCard}>
            <Text style={styles.treatmentPriority}>{rec.priority}</Text>
            <Text style={styles.treatmentRegimen}>{rec.regimen}</Text>
            <Text style={styles.treatmentSuccess}>
              ✅ Predicted Success: {rec.success}%
            </Text>
            <Text style={styles.treatmentReason}>{rec.reason}</Text>
            {rec.details && (
              <View style={styles.detailsBox}>
                <Text style={styles.detailsText}>{rec.details}</Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.selectRegimenButton}
              onPress={() => handleSelectRegimen(rec.regimen)}
            >
              <Text style={styles.selectRegimenButtonText}>
                {index === 0 ? 'Select This Regimen' : 'View Details'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.avoidBox}>
          <Text style={styles.avoidTitle}>⚠️ DRUGS TO AVOID OR USE WITH CAUTION:</Text>
          {drugsToAvoid.map((item, index) => (
            <View key={index} style={styles.avoidItem}>
              <Text style={styles.avoidDrug}>• {item.drug}</Text>
              <Text style={styles.avoidReason}>  {item.reason}</Text>
            </View>
          ))}
        </View>

        <View style={styles.guidelinesBox}>
          <Text style={styles.guidelinesTitle}>📋 Clinical Guidelines</Text>
          <Text style={styles.guidelineItem}>
            • Monitor viral load every 3-6 months
          </Text>
          <Text style={styles.guidelineItem}>
            • Check CD4+ count quarterly
          </Text>
          <Text style={styles.guidelineItem}>
            • Assess treatment adherence at each visit
          </Text>
          <Text style={styles.guidelineItem}>
            • Consider resistance testing if viral load {'>'} 200 copies/mL
          </Text>
          <Text style={styles.guidelineItem}>
            • Review drug interactions and side effects
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.exportButton}
          onPress={() => {
            Alert.alert(
              'Export Treatment Plan',
              'Treatment plan will be exported as PDF',
              [{ text: 'OK' }]
            );
          }}
        >
          <Text style={styles.buttonText}>📋 Export Treatment Plan</Text>
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
  treatmentContainer: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: COLORS.lightBlue,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 5,
  },
  summaryBold: {
    fontWeight: 'bold',
  },
  treatmentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
  },
  treatmentCard: {
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
  treatmentPriority: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  treatmentRegimen: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  treatmentSuccess: {
    fontSize: 16,
    color: COLORS.success,
    marginBottom: 10,
  },
  treatmentReason: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  detailsBox: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 6,
    marginBottom: 15,
  },
  detailsText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
  },
  selectRegimenButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectRegimenButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  avoidBox: {
    backgroundColor: COLORS.lightRed,
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  avoidTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.danger,
    marginBottom: 15,
  },
  avoidItem: {
    marginBottom: 10,
  },
  avoidDrug: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  avoidReason: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  guidelinesBox: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  guidelineItem: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 10,
    lineHeight: 20,
  },
  exportButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  buttonText: {
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

export default TreatmentRecommendationScreen;