import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

const LoadingScreen = ({ navigation, route }) => {
  const { patientData } = route.params;
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Processing patient data...');

  useEffect(() => {
    const steps = [
      { progress: 25, status: 'Processing patient data...', delay: 500 },
      { progress: 50, status: 'Analyzing mutations...', delay: 1000 },
      { progress: 75, status: 'Predicting resistance risk...', delay: 1500 },
      { progress: 100, status: 'Generating recommendations...', delay: 2000 },
    ];

    steps.forEach(({ progress, status, delay }) => {
      setTimeout(() => {
        setProgress(progress);
        setStatus(status);
      }, delay);
    });

    setTimeout(() => {
      // Calculate risk score
      const totalMutations = patientData.PI_MU + patientData.NRTI_MU + patientData.NNRTI_MU;
      const riskScore = Math.min(0.98, (totalMutations / 20) * 0.8 + 0.15);
      
      const results = {
        ...patientData,
        totalMutations,
        riskScore,
        riskLevel: riskScore >= 0.7 ? 'High Risk' : riskScore >= 0.4 ? 'Moderate Risk' : 'Low Risk',
        recommendation: riskScore >= 0.5 ? 'CHANGE ART REGIMEN' : 'CONTINUE CURRENT ART',
      };

      navigation.replace('Results', { patient: results });
    }, 2500);
  }, []);

  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingIcon}>🤖</Text>
      <Text style={styles.loadingTitle}>AI Analysis</Text>
      <Text style={styles.loadingSubtitle}>In Progress...</Text>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressText}>{progress}%</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{status}</Text>
      </View>

      <Text style={styles.loadingFooter}>Please wait 5-10 seconds</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 20,
  },
  loadingIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  loadingSubtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 40,
  },
  progressBarContainer: {
    width: '80%',
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 15,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 30,
  },
  statusContainer: {
    padding: 15,
    backgroundColor: COLORS.lightBlue,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
  loadingFooter: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 20,
  },
});

export default LoadingScreen;