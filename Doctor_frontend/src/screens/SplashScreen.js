import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    setTimeout(onFinish, 3000);
  }, []);

  return (
    <View style={styles.splashContainer}>
      <Text style={styles.splashIcon}>🧬</Text>
      <Text style={styles.splashTitle}>HIV Care</Text>
      <Text style={styles.splashSubtitle}>Optimizer</Text>
      <Text style={styles.splashTagline}>AI-Powered Treatment Prediction System</Text>
      <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 30 }} />
      <Text style={styles.splashVersion}>Version 1.0.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  splashIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  splashSubtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  splashTagline: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  splashVersion: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 20,
  },
});

export default SplashScreen;