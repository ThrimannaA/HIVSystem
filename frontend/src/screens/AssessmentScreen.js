import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { apiClient } from './src/Api/client';
import QuestionCard from '../components/QuestionCard';
import LanguageSelector from '../components/LanguageSelector';
import { HIVApi } from './src/api/client';

const AssessmentScreen = ({ navigation }) => {
  const [features, setFeatures] = useState(null);
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedCulture, setSelectedCulture] = useState('English-speaking');

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      const data = await apiClient.getFeatures();
      setFeatures(data.feature_definitions);

      // Initialize userData with default values
      const initialData = {};
      Object.keys(data.feature_definitions).forEach(key => {
        if (!key.includes('_missing')) {
          const options = data.feature_definitions[key].options;
          if (options && typeof options === 'object') {
            // Set default to middle option
            const optionKeys = Object.keys(options);
            const middleIndex = Math.floor(optionKeys.length / 2);
            initialData[key] = parseInt(optionKeys[middleIndex]);
          }
        }
      });
      setUserData(initialData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load questions. Please try again.');
    }
  };

  const handleAnswer = (featureName, value) => {
    setUserData(prev => ({
      ...prev,
      [featureName]: value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // userAnswers is the object built from your QuestionCards
      const result = await HIVApi.assessRisk(
        userAnswers,
        'en',
        'English-speaking',
      );
      navigation.navigate('ResultsScreen', { assessmentResult: result });
    } catch (error) {
      alert('Backend Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!features) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading questions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>HIV Risk Assessment</Text>
          <Text style={styles.subtitle}>
            Answer questions honestly for personalized recommendations
          </Text>
        </View>

        <LanguageSelector
          selectedLanguage={selectedLanguage}
          selectedCulture={selectedCulture}
          onLanguageChange={setSelectedLanguage}
          onCultureChange={setSelectedCulture}
        />

        {Object.keys(features)
          .filter(key => !key.includes('_missing'))
          .map((featureName, index) => (
            <QuestionCard
              key={featureName}
              feature={features[featureName]}
              featureName={featureName}
              value={userData[featureName]}
              onAnswer={handleAnswer}
              index={index}
            />
          ))}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>
              Get Personalized Assessment
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
});

export default AssessmentScreen;
