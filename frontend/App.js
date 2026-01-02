import React, { useState, useEffect } from 'react';

import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';

import { Picker } from '@react-native-picker/picker';
import RNPrint from 'react-native-print';
import { HIVApi } from './src/api/client';
import { RiskTrendScreen } from './src/components/RiskTrendScreen';

export default function App() {
  // --- NAVIGATION STATES ---
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(true); // Your new state
  const [isLoginVisible, setIsLoginVisible] = useState(false); // Login Page
  const [isDashboardVisible, setIsDashboardVisible] = useState(false); // Patient Dashboard
  // --- NEW LOGIN STATES ---
  const [patientIdInput, setPatientIdInput] = useState('');
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [currentUser, setCurrentUser] = useState({ name: '', id: '' });
  // --- APP STATES ---
  const [resultPage, setResultPage] = useState(1); // 1: Prediction, 2: Plan, 3: Trend
  const [schema, setSchema] = useState(null);
  const [formData, setFormData] = useState({});
  const [prefLanguage, setPrefLanguage] = useState('English');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const languageCultureMap = {
    English: { code: 'en', culture: 'English-speaking' },

    'Sinhala (Sri Lanka)': { code: 'si', culture: 'Sri Lankan' },

    'Tamil (Sri Lanka)': { code: 'ta', culture: 'Sri Lankan' },
  };

  // Initial Data Fetch
  useEffect(() => {
    HIVApi.getSchema()

      .then(data => {
        setSchema(data);

        let initialData = {};

        // Use the feature_definitions keys to set every single question to -1

        Object.keys(data.feature_definitions).forEach(key => {
          if (!key.endsWith('_missing')) {
            initialData[key] = -1;
          }
        });

        setFormData(initialData);
      })

      .catch(err => {
        console.error('Schema fetch error:', err);
        Alert.alert('Error', 'Backend not reachable');
      });
  }, []);

  // Splash Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsWelcomeVisible(false);
      setIsLoginVisible(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async () => {
    // 1. Double-check that this string is EXACTLY your ngrok URL
    // 2. Ensure it has https:// at the start
    const BASE_URL = 'https://keely-unresourceful-streamingly.ngrok-free.dev';

    if (!patientIdInput || !accessCodeInput) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending Login Request to:', `${BASE_URL}/login`);

      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          patient_id: patientIdInput,
          access_code: accessCodeInput,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCurrentUser({ name: data.name, id: data.patient_id });
        setIsLoginVisible(false);
        setIsDashboardVisible(true);
      } else {
        Alert.alert(
          'Authentication Failed', // Title
          data.detail ||
            "We couldn't verify your credentials. Please try again.", // Message from Backend
          [{ text: 'OK' }],
        );
      }
    } catch (error) {
      Alert.alert(
        'Connection Error',
        'Unable to reach the clinical server. Please ensure you are connected to the internet.',
        [{ text: 'Try Again' }],
      );
    }
    setLoading(false);
  };

  const runAssessment = async () => {
    if (loading) return;
    setLoading(true);

    const selected = languageCultureMap[prefLanguage];
    try {
      // Use your NGROK URL here
      const response = await HIVApi.assessRisk(
        formData,
        selected.code,
        selected.culture,
      );

      // Navigate to results
      setResult(response);

      setResultPage(1);

      // SAVE TO FIREBASE
      const riskLevel = response.risk_prediction.risk_level; // e.g., "Low Risk"

      // Pass the CURRENT logged in user ID
      await HIVApi.saveAssessment(currentUser.id, 0, riskLevel);
    } catch (e) {
      console.error('Assessment Error:', e);
      Alert.alert(
        'Assessment Failed',
        'Please check your internet connection or server logs.',
      );
    }
    setLoading(false);
  };

  const createPDF = async () => {
    if (!result) return;

    const htmlContent = `
      <div style="padding: 20px; font-family: 'Helvetica';">
        <h1 style="color: #2196F3; text-align: center;">HIV Behavioral Risk Assessment</h1>
        <p style="text-align: center; color: #666;">Date: ${new Date().toLocaleDateString()}</p>
        <hr/>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 10px; border: 1px solid #dee2e6;">
          <h2>Assessment Summary</h2>
          <p><strong>Risk Level:</strong> ${
            result.risk_prediction.risk_level
          }</p>
          <p><strong>Clinical Note:</strong> This is a behavioral profile based on reported activities and is not a medical diagnosis.</p>
        </div>
        
        <h2>Behavioral Intervention Plan</h2>
        ${result.intervention_plan.personalized_plan
          .map(
            (item, i) => `
          <div style="margin-bottom: 15px; border-bottom: 1px solid #0D47A1'; padding-bottom: 10px;">
            <p><strong>Phase ${i + 1}: ${item.name} (Weeks ${item.start_week}-${
              item.end_week
            })</strong></p>
            <p>${item.description}</p>
          </div>
        `,
          )
          .join('')}
        
        <p style="margin-top: 40px; font-size: 10px; color: #999; text-align: center;">
          Generated by HIV Prevention System - Clinical Research Tool
        </p>
      </div>
    `;

    try {
      // This will open the native print dialog, where the user can select "Save as PDF"
      await RNPrint.print({
        html: htmlContent,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  if (!schema)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );

  // --- SCREEN 1: SPLASH ---
  if (isWelcomeVisible) {
    return (
      <View style={styles.welcomeContainer}>
        <ActivityIndicator size="large" color="#2196F3" />

        <Text style={styles.emojiTitle}>🎗️</Text>

        <Text style={styles.welcomeTitle}>
          HIV Risk Awareness and Prevention
        </Text>

        <Text style={styles.welcomeSubtitle}>
          Behavioral Risk Identification and Personalized Support
        </Text>
        <Text></Text>
        <Text style={styles.welcomeNote}>
          <Text style={{ fontWeight: 'bold' }}>Important Note: </Text>
          This system provides a personalized view of your HIV risk based on
          your behaviors. This system does{' '}
          <Text style={{ fontWeight: 'bold' }}>
            not provide a medical diagnosis
          </Text>{' '}
          and is intended to support prevention and risk-reduction planning.
          Clinical testing with a qualified healthcare provider is required to
          determine HIV status.
        </Text>
      </View>
    );
  }

  // 2. Only show the "Loading Parameters" if schema is still missing AFTER welcome screen
  if (!schema) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={{ marginTop: 10 }}>Fetching Assessment Parameters...</Text>
      </View>
    );
  }

  // --- SCREEN 2: LOGIN ---
  if (isLoginVisible) {
    return (
      <View style={styles.loginContainer}>
        <Text style={styles.loginHeader}>Clinical Access</Text>
        <Text style={styles.loginSub}>Please enter patient credentials</Text>

        <TextInput
          style={styles.input}
          placeholder="Patient ID (e.g. PN-2024)"
          placeholderTextColor="#999"
          value={patientIdInput} // ADD THIS
          onChangeText={setPatientIdInput} // ADD THIS
        />
        <TextInput
          style={styles.input}
          placeholder="Access Code"
          secureTextEntry={true}
          placeholderTextColor="#999"
          value={accessCodeInput} // ADD THIS
          onChangeText={setAccessCodeInput} // ADD THIS
        />

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin} // CHANGE THIS from () => {...} to handleLogin
        >
          <Text style={styles.loginButtonText}>LOGIN</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- SCREEN 3: DASHBOARD ---
  if (isDashboardVisible) {
    return (
      <ScrollView style={styles.dashboardContainer}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.dashWelcome}>Welcome,</Text>
            <Text style={styles.dashName}>{currentUser.name || 'Patient'}</Text>
          </View>
          <View style={styles.notifBadge}>
            <Text style={{ color: 'white', fontSize: 10 }}>1</Text>
          </View>
        </View>

        <Text style={styles.dashSectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionGrid}>
          <TouchableOpacity
            style={styles.actionBox}
            onPress={() => setIsDashboardVisible(false)}
          >
            <Text style={styles.actionEmoji}>📝</Text>
            <Text style={styles.actionText}>New Assessment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBox}
            onPress={() => {
              // 1. Set the page to 3 (Trends)
              setResultPage(3);
              // 2. Set a placeholder result so the 'result' view triggers
              // but include a flag to tell the app this is history mode
              setResult({ isHistoryMode: true });
              // 3. Hide dashboard to show the ScrollView content
              setIsDashboardVisible(false);
            }}
          >
            <Text style={styles.actionEmoji}>📊</Text>
            <Text style={styles.actionText}>View Trends</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Clinical Advisory</Text>
          <Text style={styles.infoText}>
            Your next biological screening is recommended in 3 months. Maintain
            your current intervention plan.
          </Text>
        </View>
      </ScrollView>
    );
  }

  // --- SCREEN 4: ASSESSMENT (Your Existing Questionnaire) ---
  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        {!result ? (
          <View>
            <TouchableOpacity
              onPress={() => setIsDashboardVisible(true)}
              style={{ marginBottom: 10 }}
            >
              <Text style={styles.backLink}>← Back to Dashboard</Text>
            </TouchableOpacity>
            <Text style={styles.mainTitle}>🔬 HIV Prevention Assessment</Text>
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>🌍 Language & Culture</Text>

              <Picker
                selectedValue={prefLanguage}
                onValueChange={setPrefLanguage}
                dropdownIconColor="#0e2e48ff"
              >
                {Object.keys(languageCultureMap).map(l => (
                  <Picker.Item key={l} label={l} value={l} color="#2196F3" />
                ))}
              </Picker>
            </View>

            {Object.entries(schema.feature_definitions)

              .sort((a, b) =>
                (a[1].category || '').localeCompare(b[1].category || ''),
              )

              .filter(([key]) => !key.endsWith('_missing'))

              .map(([key, info]) => (
                <View key={key} style={styles.questionCard}>
                  <Text style={styles.questionText}>{info.question}</Text>

                  {/* We add a specific style here to make it look like a box */}

                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={
                        formData[key] === -1 ? '-1' : formData[key]?.toString()
                      }
                      onValueChange={val =>
                        setFormData({ ...formData, [key]: parseInt(val) })
                      }
                      // This mode="dropdown" helps on Android to show the selection correctly

                      mode="dropdown"
                    >
                      <Picker.Item
                        label="--- Select an Option ---"
                        value="-1"
                        color="#635f5fff"
                      />

                      {Object.entries(info.options).map(([v, l]) => (
                        <Picker.Item
                          key={v}
                          label={l}
                          value={v.toString()}
                          color="#2cb3ecff"
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              ))}

            <Text
              style={{
                textAlign: 'center',
                color: '#6B7280',
                marginBottom: 5,
                fontSize: 13,
              }}
            >
              {Object.values(formData).filter(v => v !== -1).length} of{' '}
              {Object.keys(formData).length} answered
            </Text>

            <TouchableOpacity style={styles.button} onPress={runAssessment}>
              <Text style={styles.buttonText}>RUN PERSONALIZED ASSESSMENT</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* --- DETAILED STYLE RESULTS --- */

          <View style={styles.resultView}>
            <TouchableOpacity
              onPress={() => {
                // If we are looking at a fresh result, go back to questions
                // If we came from Dashboard (History Mode), go back to Dashboard
                if (result?.isHistoryMode) {
                  setResult(null);
                  setIsDashboardVisible(true);
                } else if (resultPage === 1) {
                  // If on page 1, go back to questions
                  setResult(null);
                } else if (resultPage === 2) {
                  // If on page 2, go back to page 1
                  setResultPage(1);
                } else if (resultPage === 3) {
                  // If on page 3 and not in history mode, go back to page 2
                  if (!result?.isHistoryMode) {
                    setResultPage(2);
                  } else {
                    setResult(null);
                    setIsDashboardVisible(true);
                  }
                }
              }}
            >
              <Text style={styles.backLink}>← Back</Text>
            </TouchableOpacity>

            {/* PAGE 1: RISK PREDICTION */}
            {resultPage === 1 && (
              <View>
                <View style={styles.disclaimerCard}>
                  <Text style={styles.disclaimerText}>
                    <Text style={{ fontWeight: 'bold' }}>Clinical Note: </Text>
                    This behavioral risk profile is intended to support
                    HIV-prevention and risk-reduction planning and is{' '}
                    <Text style={{ fontWeight: 'bold' }}>
                      not a medical diagnosis
                    </Text>
                    . Please speak with your healthcare provider to arrange a
                    clinical HIV test for a definitive diagnosis.
                  </Text>
                </View>

                <Text style={styles.resultMainTitle}>
                  Risk Prediction & Explanation
                </Text>

                <View
                  style={[
                    styles.riskBanner,
                    { backgroundColor: result.risk_prediction.color },
                  ]}
                >
                  <Text style={styles.riskLevel}>
                    {result.risk_prediction.risk_level}
                  </Text>
                  <Text style={styles.riskDescription}>
                    {result.risk_prediction.description}
                  </Text>
                </View>

                <View style={styles.metricContainer}>
                  <View style={styles.metricBox}>
                    <Text style={styles.mLabel}>Assessment Level</Text>
                    <Text style={styles.mValue}>
                      {result.risk_prediction.risk_level}
                    </Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.mLabel}>Analysis Strength</Text>
                    <Text style={styles.mValue}>
                      {parseInt(result.risk_prediction.confidence_percentage) >
                      80
                        ? 'High'
                        : 'Standard'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.subHeader}>🎯 Top Risk Factors</Text>
                {result.risk_prediction.personalized_factors.map((f, i) => (
                  <View
                    key={i}
                    style={[
                      styles.factorCard,
                      {
                        borderLeftColor:
                          f.scoring_impact > 0 ? '#EF4444' : '#10B981',
                      },
                    ]}
                  >
                    <Text style={styles.factorQ}>{f.question}</Text>
                    <Text style={styles.factorA}>
                      Your Answer: {f.readable_value}
                    </Text>
                    <Text
                      style={[
                        styles.factorI,
                        { color: f.scoring_impact > 0 ? '#EF4444' : '#10B981' },
                      ]}
                    >
                      {f.interpretation} (+{f.scoring_impact} pts)
                    </Text>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.button}
                  onPress={() => setResultPage(2)}
                >
                  <Text style={styles.buttonText}>
                    NEXT: VIEW INTERVENTION PLAN →
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* PAGE 2: INTERVENTION PLAN */}
            {resultPage === 2 && (
              <View>
                <Text style={styles.resultMainTitle}>
                  True Personalized Intervention Plan
                </Text>
                <View style={styles.rationaleCard}>
                  <Text style={styles.ratTitle}>📅 Plan Rationale</Text>
                  <Text style={styles.ratText}>
                    • Focus Areas:{' '}
                    {result.intervention_plan.plan_summary.focus_areas.join(
                      ', ',
                    )}
                  </Text>
                  <Text style={styles.ratText}>
                    • Duration:{' '}
                    {
                      result.intervention_plan.expected_outcomes
                        .completion_timeline
                    }
                  </Text>
                  <Text style={styles.ratText}>
                    • Basis:{' '}
                    {result.intervention_plan.plan_summary.timeline_calculation}
                  </Text>
                </View>

                <Text style={styles.subHeader}>
                  💡 Recommended Interventions
                </Text>
                {result.intervention_plan.personalized_plan.map((item, i) => (
                  <View key={i} style={styles.interventionCard}>
                    <Text style={styles.intTitle}>
                      {i + 1}. {item.name} (Week {item.start_week}-
                      {item.end_week})
                    </Text>
                    {/* <Text style={styles.intMeta}>
                      Duration:{' '}
                      {item.duration_weeks ||
                        item.end_week - item.start_week + 1}{' '}
                      weeks {'\n'}
                      Intensity: {item.intensity} {'\n'}
                      Phase: {i + 1}/
                      {result.intervention_plan.personalized_plan.length}
                    </Text> */}
                    <Text style={styles.intMeta}>
                      <Text style={{ fontWeight: 'bold' }}>Duration:</Text>{' '}
                      {item.duration_weeks ||
                        item.end_week - item.start_week + 1}{' '}
                      weeks {'\n'}
                      <Text style={{ fontWeight: 'bold' }}>
                        Intensity:
                      </Text>{' '}
                      {item.intensity} {'\n'}
                      <Text style={{ fontWeight: 'bold' }}>Phase:</Text> {i + 1}
                      /{result.intervention_plan.personalized_plan.length}
                    </Text>
                    <Text style={styles.intLabel}>
                      🎯 Your main goal for these weeks:
                    </Text>
                    <Text style={styles.intGoalText}>{item.description}</Text>
                    <Text style={styles.intLabel}>📋 Your weekly plan:</Text>
                    <View style={styles.weeklyPlanBox}>
                      {item.simple_steps?.map((step, si) => (
                        <Text key={si} style={styles.stepText}>
                          • {step}
                        </Text>
                      ))}
                    </View>
                    <Text style={styles.intLabel}>
                      💡 Why this matters for you:
                    </Text>
                    <Text style={styles.rationaleContent}>
                      {item.user_rationale}
                    </Text>
                  </View>
                ))}

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#6B7280' }]}
                  onPress={() => setResultPage(1)}
                >
                  <Text style={styles.buttonText}>← BACK TO PREDICTION</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => setResultPage(3)}
                >
                  <Text style={styles.buttonText}>
                    NEXT: VIEW RISK PROGRESS →
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* PAGE 3: TRENDS */}
            {resultPage === 3 && (
              <View>
                <Text style={styles.resultMainTitle}>
                  Longitudinal Risk Progress
                </Text>
                <RiskTrendScreen userId={currentUser.id} />

                {/* Only show PDF button if it's a fresh result, not history mode */}
                {!result?.isHistoryMode && (
                  <TouchableOpacity
                    style={[
                      styles.button,
                      { backgroundColor: '#10B981', marginTop: 10 },
                    ]}
                    onPress={createPDF}
                  >
                    <Text style={styles.buttonText}>
                      💾 SAVE AS PDF SUMMARY
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Change the BACK TO PLAN button logic */}
                {!result?.isHistoryMode && (
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#6B7280' }]}
                    onPress={() => setResultPage(2)}
                  >
                    <Text style={styles.buttonText}>← BACK TO PLAN</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.button}
                  onPress={() => {
                    setResult(null);
                    setIsDashboardVisible(true);
                  }}
                >
                  <Text style={styles.buttonText}>RETURN TO DASHBOARD</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>
            Analyzing Behavioral Patterns...
          </Text>
          <Text style={styles.loadingSubText}>
            Generating your personalized plan
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    padding: 30,
  },
  loginHeader: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 5,
  },
  loginSub: { fontSize: 16, color: '#6B7280', marginBottom: 30 },
  input: {
    backgroundColor: '#F3F4F6',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    color: '#333',
  },
  loginButton: {
    backgroundColor: '#1E3A8A',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  loginButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  dashboardContainer: { flex: 1, backgroundColor: '#F8F9FB', padding: 20 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  dashWelcome: { fontSize: 16, color: '#6B7280' },
  dashName: { fontSize: 24, fontWeight: 'bold', color: '#1A1C1E' },
  notifBadge: {
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  quickActionGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBox: {
    backgroundColor: '#FFF',
    width: '48%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
  },
  actionEmoji: { fontSize: 30, marginBottom: 10 },
  actionText: { fontWeight: '600', color: '#4B5563' },
  infoCard: {
    backgroundColor: '#DBEAFE',
    padding: 20,
    borderRadius: 15,
    marginTop: 30,
  },
  infoTitle: { fontWeight: 'bold', color: '#1E40AF', marginBottom: 5 },
  infoText: { color: '#1E40AF', lineHeight: 20 },
  container: { flex: 1, backgroundColor: '#F8F9FB', padding: 15 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  mainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#1A1C1E',
  },

  card: {
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
  },

  questionCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#2196F3',
  },

  questionText: { fontSize: 15, color: '#333', fontWeight: '500' },

  pickerContainer: {
    marginTop: 10,
    backgroundColor: '#f0f1eeff', // Light gray background to show it's an input
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    height: 50,
  },

  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2196F3',
  },

  button: {
    backgroundColor: '#2196F3',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 20,
  },

  buttonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  /* Result Styles */

  resultView: { marginTop: 10 },
  backLink: { color: '#2196F3', fontWeight: '600', marginBottom: 15 },

  resultMainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1C1E',
    marginTop: 25,
    marginBottom: 15,
  },

  riskBanner: { padding: 20, borderRadius: 12, marginBottom: 15 },
  riskLevel: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  riskDescription: { color: '#FFF', fontSize: 14, marginTop: 5, opacity: 0.9 },

  metricContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  metricBox: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
    elevation: 2,
  },

  mLabel: { fontSize: 12, color: '#666' },
  mValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },

  subHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },

  factorCard: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
  },

  factorQ: { fontSize: 14, fontWeight: 'bold', color: '#222' },
  factorA: { fontSize: 13, color: '#666', fontStyle: 'italic' },
  factorI: { fontSize: 13, fontWeight: '600', marginTop: 3 },

  rationaleCard: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },

  ratTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0D47A1',
    marginBottom: 8,
  },

  ratText: { fontSize: 14, color: '#1565C0', marginBottom: 4 },

  /* Intervention Details */

  interventionCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderTopWidth: 5,
    borderTopColor: '#2196F3', // Streamlit-like Blue
    elevation: 3, // For shadow
  },

  // intLabel: {
  //   fontSize: 16,
  //   fontWeight: 'bold',
  //   marginTop: 15,
  //   marginBottom: 8,
  //   color: '#1f2937',
  // },

  /* Intervention Details Styling */
  intMeta: {
    fontSize: 14,
    color: '#0D47A1', // Deep Blue for Duration, Intensity, Phase
    fontWeight: '600', // Makes it slightly bolder to read easier
    lineHeight: 20,
    marginTop: 5,
  },

  intLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    color: '#2196F3', // Matches your main theme blue
  },

  intGoalText: {
    fontSize: 15,
    color: '#059669', // Teal/Green color for the "Goal" to make it look positive
    fontWeight: '500',
    lineHeight: 22,
    backgroundColor: '#F0FDF4', // Very light green background highlight
    padding: 10,
    borderRadius: 8,
  },

  weeklyPlanBox: {
    paddingLeft: 5,
  },

  stepText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 10,
  },

  rationaleContent: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    lineHeight: 20,
  },

  disclaimerCard: {
    backgroundColor: '#EFF6FF', // Light medical blue
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#3B82F6', // Stronger blue accent
    marginBottom: 20,
    elevation: 1,
  },

  disclaimerText: {
    fontSize: 14,
    color: '#1E40AF', // Deep blue text for readability
    lineHeight: 20,
    textAlign: 'left',
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // White transparent background
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // Makes sure it sits on top of everything
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1C1E',
  },
  loadingSubText: {
    marginTop: 5,
    fontSize: 14,
    color: '#6B7280',
  },
  welcomeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emojiTitle: {
    fontSize: 36,
    textAlign: 'center',
    marginBottom: 4,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A', // Deep medical blue
    textAlign: 'center',
    marginTop: 25,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 22,
  },
  welcomeNoteBox: {
    marginTop: 40,
    padding: 15,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#9CA3AF',
  },
  welcomeNote: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});
