import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import RNPrint from 'react-native-print';
import { HIVApi } from './src/api/client';
import { RiskTrendScreen } from './src/components/RiskTrendScreen';
import appStyles from './src/styles/appStyles';

export default function App() {
  // --- NAVIGATION STATES ---
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(true);
  const [isLoginVisible, setIsLoginVisible] = useState(false);
  const [isDashboardVisible, setIsDashboardVisible] = useState(false);
  // --- NEW LOGIN STATES ---
  const [patientIdInput, setPatientIdInput] = useState('');
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [currentUser, setCurrentUser] = useState({ name: '', id: '' });
  // --- APP STATES ---
  const [resultPage, setResultPage] = useState(1);
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
          'Authentication Failed',
          data.detail ||
            "We couldn't verify your credentials. Please try again.",
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
      const response = await HIVApi.assessRisk(
        formData,
        selected.code,
        selected.culture,
      );

      setResult(response);
      setResultPage(1);

      const riskLevel = response.risk_prediction.risk_level;
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
      await RNPrint.print({
        html: htmlContent,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  if (!schema)
    return (
      <View style={appStyles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );

  // --- SCREEN 1: SPLASH ---
  if (isWelcomeVisible) {
    return (
      <View style={appStyles.welcomeContainer}>
        <ActivityIndicator size="large" color="#2196F3" />

        <Text style={appStyles.emojiTitle}>🎗️</Text>

        <Text style={appStyles.welcomeTitle}>
          HIV Risk Awareness and Prevention
        </Text>

        <Text style={appStyles.welcomeSubtitle}>
          Behavioral Risk Identification and Personalized Support
        </Text>
        <Text></Text>
        <Text style={appStyles.welcomeNote}>
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
      <View style={appStyles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={{ marginTop: 10 }}>Fetching Assessment Parameters...</Text>
      </View>
    );
  }

  // --- SCREEN 2: LOGIN ---
  if (isLoginVisible) {
    return (
      <View style={appStyles.loginContainer}>
        <Text style={appStyles.loginHeader}>Clinical Access</Text>
        <Text style={appStyles.loginSub}>Please enter patient credentials</Text>

        <TextInput
          style={appStyles.input}
          placeholder="Patient ID (e.g. PN-2024)"
          placeholderTextColor="#999"
          value={patientIdInput}
          onChangeText={setPatientIdInput}
        />
        <TextInput
          style={appStyles.input}
          placeholder="Access Code"
          secureTextEntry={true}
          placeholderTextColor="#999"
          value={accessCodeInput}
          onChangeText={setAccessCodeInput}
        />

        <TouchableOpacity style={appStyles.loginButton} onPress={handleLogin}>
          <Text style={appStyles.loginButtonText}>LOGIN</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- SCREEN 3: DASHBOARD ---
  if (isDashboardVisible) {
    return (
      <ScrollView style={appStyles.dashboardContainer}>
        <View style={appStyles.headerRow}>
          <View>
            <Text style={appStyles.dashWelcome}>Welcome,</Text>
            <Text style={appStyles.dashName}>
              {currentUser.name || 'Patient'}
            </Text>
          </View>
          <View style={appStyles.notifBadge}>
            <Text style={{ color: 'white', fontSize: 10 }}>1</Text>
          </View>
        </View>

        <Text style={appStyles.dashSectionTitle}>Quick Actions</Text>
        <View style={appStyles.quickActionGrid}>
          <TouchableOpacity
            style={appStyles.actionBox}
            onPress={() => setIsDashboardVisible(false)}
          >
            <Text style={appStyles.actionEmoji}>📝</Text>
            <Text style={appStyles.actionText}>New Assessment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={appStyles.actionBox}
            onPress={() => {
              setResultPage(3);
              setResult({ isHistoryMode: true });
              setIsDashboardVisible(false);
            }}
          >
            <Text style={appStyles.actionEmoji}>📊</Text>
            <Text style={appStyles.actionText}>View Trends</Text>
          </TouchableOpacity>
        </View>

        <View style={appStyles.infoCard}>
          <Text style={appStyles.infoTitle}>Clinical Advisory</Text>
          <Text style={appStyles.infoText}>
            Your next biological screening is recommended in 3 months. Maintain
            your current intervention plan.
          </Text>
        </View>
      </ScrollView>
    );
  }

  // --- SCREEN 4: ASSESSMENT ---
  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={appStyles.container}>
        {!result ? (
          <View>
            <TouchableOpacity
              onPress={() => setIsDashboardVisible(true)}
              style={{ marginBottom: 10 }}
            >
              <Text style={appStyles.backLink}>← Back to Dashboard</Text>
            </TouchableOpacity>
            <Text style={appStyles.mainTitle}>
              🔬 HIV Prevention Assessment
            </Text>
            <View style={appStyles.card}>
              <Text style={appStyles.sectionHeader}>🌍 Language & Culture</Text>

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
                <View key={key} style={appStyles.questionCard}>
                  <Text style={appStyles.questionText}>{info.question}</Text>

                  <View style={appStyles.pickerContainer}>
                    <Picker
                      selectedValue={
                        formData[key] === -1 ? '-1' : formData[key]?.toString()
                      }
                      onValueChange={val =>
                        setFormData({ ...formData, [key]: parseInt(val) })
                      }
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

            <TouchableOpacity style={appStyles.button} onPress={runAssessment}>
              <Text style={appStyles.buttonText}>
                RUN PERSONALIZED ASSESSMENT
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={appStyles.resultView}>
            <TouchableOpacity
              onPress={() => {
                if (result?.isHistoryMode) {
                  setResult(null);
                  setIsDashboardVisible(true);
                } else if (resultPage === 1) {
                  setResult(null);
                } else if (resultPage === 2) {
                  setResultPage(1);
                } else if (resultPage === 3) {
                  if (!result?.isHistoryMode) {
                    setResultPage(2);
                  } else {
                    setResult(null);
                    setIsDashboardVisible(true);
                  }
                }
              }}
            >
              <Text style={appStyles.backLink}>← Back</Text>
            </TouchableOpacity>

            {/* PAGE 1: RISK PREDICTION */}
            {resultPage === 1 && (
              <View>
                <View style={appStyles.disclaimerCard}>
                  <Text style={appStyles.disclaimerText}>
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

                <Text style={appStyles.resultMainTitle}>
                  Risk Prediction & Explanation
                </Text>

                <View
                  style={[
                    appStyles.riskBanner,
                    { backgroundColor: result.risk_prediction.color },
                  ]}
                >
                  <Text style={appStyles.riskLevel}>
                    {result.risk_prediction.risk_level}
                  </Text>
                  <Text style={appStyles.riskDescription}>
                    {result.risk_prediction.description}
                  </Text>
                </View>

                <View style={appStyles.metricContainer}>
                  <View style={appStyles.metricBox}>
                    <Text style={appStyles.mLabel}>Assessment Level</Text>
                    <Text style={appStyles.mValue}>
                      {result.risk_prediction.risk_level}
                    </Text>
                  </View>
                  <View style={appStyles.metricBox}>
                    <Text style={appStyles.mLabel}>Analysis Strength</Text>
                    <Text style={appStyles.mValue}>
                      {parseInt(result.risk_prediction.confidence_percentage) >
                      80
                        ? 'High'
                        : 'Standard'}
                    </Text>
                  </View>
                </View>

                <Text style={appStyles.subHeader}>🎯 Top Risk Factors</Text>
                {result.risk_prediction.personalized_factors.map((f, i) => (
                  <View
                    key={i}
                    style={[
                      appStyles.factorCard,
                      {
                        borderLeftColor:
                          f.scoring_impact > 0 ? '#EF4444' : '#10B981',
                      },
                    ]}
                  >
                    <Text style={appStyles.factorQ}>{f.question}</Text>
                    <Text style={appStyles.factorA}>
                      Your Answer: {f.readable_value}
                    </Text>
                    <Text
                      style={[
                        appStyles.factorI,
                        { color: f.scoring_impact > 0 ? '#EF4444' : '#10B981' },
                      ]}
                    >
                      {f.interpretation} (+{f.scoring_impact} pts)
                    </Text>
                  </View>
                ))}

                <TouchableOpacity
                  style={appStyles.button}
                  onPress={() => setResultPage(2)}
                >
                  <Text style={appStyles.buttonText}>
                    NEXT: VIEW INTERVENTION PLAN →
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* PAGE 2: INTERVENTION PLAN */}
            {resultPage === 2 && (
              <View>
                <Text style={appStyles.resultMainTitle}>
                  True Personalized Intervention Plan
                </Text>
                <View style={appStyles.rationaleCard}>
                  <Text style={appStyles.ratTitle}>📅 Plan Rationale</Text>
                  <Text style={appStyles.ratText}>
                    • Focus Areas:{' '}
                    {result.intervention_plan.plan_summary.focus_areas.join(
                      ', ',
                    )}
                  </Text>
                  <Text style={appStyles.ratText}>
                    • Duration:{' '}
                    {
                      result.intervention_plan.expected_outcomes
                        .completion_timeline
                    }
                  </Text>
                  <Text style={appStyles.ratText}>
                    • Basis:{' '}
                    {result.intervention_plan.plan_summary.timeline_calculation}
                  </Text>
                </View>

                <Text style={appStyles.subHeader}>
                  💡 Recommended Interventions
                </Text>
                {result.intervention_plan.personalized_plan.map((item, i) => (
                  <View key={i} style={appStyles.interventionCard}>
                    <Text style={appStyles.intTitle}>
                      {i + 1}. {item.name} (Week {item.start_week}-
                      {item.end_week})
                    </Text>
                    <Text style={appStyles.intMeta}>
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
                    <Text style={appStyles.intLabel}>
                      🎯 Your main goal for these weeks:
                    </Text>
                    <Text style={appStyles.intGoalText}>
                      {item.description}
                    </Text>
                    <Text style={appStyles.intLabel}>📋 Your weekly plan:</Text>
                    <View style={appStyles.weeklyPlanBox}>
                      {item.simple_steps?.map((step, si) => (
                        <Text key={si} style={appStyles.stepText}>
                          • {step}
                        </Text>
                      ))}
                    </View>
                    <Text style={appStyles.intLabel}>
                      💡 Why this matters for you:
                    </Text>
                    <Text style={appStyles.rationaleContent}>
                      {item.user_rationale}
                    </Text>
                  </View>
                ))}

                <TouchableOpacity
                  style={[appStyles.button, { backgroundColor: '#6B7280' }]}
                  onPress={() => setResultPage(1)}
                >
                  <Text style={appStyles.buttonText}>← BACK TO PREDICTION</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={appStyles.button}
                  onPress={() => setResultPage(3)}
                >
                  <Text style={appStyles.buttonText}>
                    NEXT: VIEW RISK PROGRESS →
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* PAGE 3: TRENDS */}
            {resultPage === 3 && (
              <View>
                <Text style={appStyles.resultMainTitle}>
                  Longitudinal Risk Progress
                </Text>
                <RiskTrendScreen userId={currentUser.id} />

                {/* Only show PDF button if it's a fresh result, not history mode */}
                {!result?.isHistoryMode && (
                  <TouchableOpacity
                    style={[
                      appStyles.button,
                      { backgroundColor: '#10B981', marginTop: 10 },
                    ]}
                    onPress={createPDF}
                  >
                    <Text style={appStyles.buttonText}>
                      💾 SAVE AS PDF SUMMARY
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Change the BACK TO PLAN button logic */}
                {!result?.isHistoryMode && (
                  <TouchableOpacity
                    style={[appStyles.button, { backgroundColor: '#6B7280' }]}
                    onPress={() => setResultPage(2)}
                  >
                    <Text style={appStyles.buttonText}>← BACK TO PLAN</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={appStyles.button}
                  onPress={() => {
                    setResult(null);
                    setIsDashboardVisible(true);
                  }}
                >
                  <Text style={appStyles.buttonText}>RETURN TO DASHBOARD</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {loading && (
        <View style={appStyles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={appStyles.loadingText}>
            Analyzing Behavioral Patterns...
          </Text>
          <Text style={appStyles.loadingSubText}>
            Generating your personalized plan
          </Text>
        </View>
      )}
    </View>
  );
}
