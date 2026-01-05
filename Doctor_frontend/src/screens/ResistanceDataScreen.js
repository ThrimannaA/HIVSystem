import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

const ResistanceDataScreen = ({ navigation, route }) => {
  const { patientData } = route.params;
  const [loading, setLoading] = useState(false);
  const [mutations, setMutations] = useState({
    PI_MU_Count: 0,
    NRTI_MU_Count: 0,
    NNRTI_MU_Count: 0,
  });

  const handleAnalyze = async () => {
    setLoading(true);
    
    try {
      // Map the data to API format
      const apiPayload = {
        SEX: patientData.sex === 'Male' ? 1 : 0,
        YEAR: parseInt(patientData.age),
        Ethnicity: parseInt(patientData.ethnicity),
        Education: parseInt(patientData.education),
        Occupation: parseInt(patientData.occupation || '4'),
        Marital_status: parseInt(patientData.maritalStatus),
        Transmission_category: parseInt(patientData.transmissionCategory || '3'),
        Baseline_CD4: parseFloat(patientData.cd4Count),
        Baseline_VL: parseFloat(patientData.viralLoad),
        ART_duration: parseFloat(patientData.artDuration),
        HIV_1YX: patientData.hivSubtype,
        Initial_ART_regimen: patientData.artRegimen,
        PI_MU_Count: mutations.PI_MU_Count,
        NRTI_MU_Count: mutations.NRTI_MU_Count,
        NNRTI_MU_Count: mutations.NNRTI_MU_Count,
      };

      console.log('Sending to API:', apiPayload);

      // For testing on web, use your actual backend URL
      // Replace with your computer's IP address or use localhost
      const API_URL = 'http://127.0.0.1:8000/predict';
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      console.log('API Response:', result);

      // Navigate to results screen with the API response
      navigation.navigate('Results', { 
        patientData: { ...patientData, ...mutations },
        apiResult: result 
      });

    } catch (error) {
      console.error('Error calling API:', error);
      Alert.alert(
        'Analysis Failed',
        'Could not connect to the prediction service. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>New Analysis [3/3]</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.formContainer}>
        <Text style={styles.formTitle}>🧬 DRUG RESISTANCE DATA</Text>

        <Text style={styles.sectionSubtitle}>Mutation Counts</Text>
        <Text style={styles.helperText}>Enter the number of mutations detected for each drug class</Text>
        
        {Object.keys(mutations).map((key) => (
          <View key={key} style={styles.counterRow}>
            <Text style={styles.counterLabel}>
              {key === 'PI_MU_Count' ? 'PI Mutations' : 
               key === 'NRTI_MU_Count' ? 'NRTI Mutations' : 
               'NNRTI Mutations'}
            </Text>
            <View style={styles.counterControls}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setMutations({ ...mutations, [key]: Math.max(0, mutations[key] - 1) })}
              >
                <Text style={styles.counterButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.counterValue}>{mutations[key]}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setMutations({ ...mutations, [key]: mutations[key] + 1 })}
              >
                <Text style={styles.counterButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            📊 Total Mutations: {mutations.PI_MU_Count + mutations.NRTI_MU_Count + mutations.NNRTI_MU_Count}
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>← Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.analyzeButton, loading && styles.buttonDisabled]} 
            onPress={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>🔍 Analyze Now</Text>
            )}
          </TouchableOpacity>
        </View>
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
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 10,
    marginBottom: 10,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 15,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  counterLabel: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  counterButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  counterValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    minWidth: 30,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: COLORS.lightBlue,
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 20,
    gap: 15,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  analyzeButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ResistanceDataScreen;