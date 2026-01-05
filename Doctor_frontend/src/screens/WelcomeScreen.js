import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { COLORS } from '../constants/colors';

const WelcomeScreen = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <Text style={styles.icon}>🧬</Text>
      <Text style={styles.title}>HIV Care</Text>
      <Text style={styles.subtitle}>Optimizer</Text>
      <Text style={styles.tagline}>AI-Powered Treatment Prediction System</Text>
      <ActivityIndicator
        size="large"
        color={COLORS.white}
        style={styles.loader}
      />
      <Text style={styles.footer}>For Healthcare Professionals</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 38,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 15,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loader: {
    marginTop: 30,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.8,
  },
});

export default WelcomeScreen;
