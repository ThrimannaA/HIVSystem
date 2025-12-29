import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { HIVApi } from './src/api/client';

export default function App() {
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

  useEffect(() => {
    HIVApi.getSchema()
      .then(data => {
        setSchema(data);
        let initialData = {};
        Object.keys(data.feature_definitions).forEach(
          key => (initialData[key] = 1),
        );
        setFormData(initialData);
      })
      .catch(err => Alert.alert('Error', 'Backend not reachable'));
  }, []);

  const runAssessment = async () => {
    setLoading(true);
    const selected = languageCultureMap[prefLanguage];
    try {
      const response = await HIVApi.assessRisk(
        formData,
        selected.code,
        selected.culture,
      );
      setResult(response);
    } catch (e) {
      Alert.alert('Error', 'Assessment failed. Check backend console.');
    }
    setLoading(false);
  };

  if (!schema)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );

  return (
    <ScrollView style={styles.container}>
      {!result ? (
        <View>
          <Text style={styles.mainTitle}>🔬 HIV Prevention Assessment</Text>
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>🌍 Language & Culture</Text>
            <Picker
              selectedValue={prefLanguage}
              onValueChange={setPrefLanguage}
            >
              {Object.keys(languageCultureMap).map(l => (
                <Picker.Item key={l} label={l} value={l} />
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
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData[key]?.toString()}
                    onValueChange={val =>
                      setFormData({ ...formData, [key]: parseInt(val) })
                    }
                  >
                    {Object.entries(info.options).map(([v, l]) => (
                      <Picker.Item key={v} label={l} value={v} />
                    ))}
                  </Picker>
                </View>
              </View>
            ))}

          <TouchableOpacity style={styles.button} onPress={runAssessment}>
            <Text style={styles.buttonText}>RUN PERSONALIZED ASSESSMENT</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* --- DETAILED STYLE RESULTS --- */

        <View style={styles.resultView}>
          <TouchableOpacity onPress={() => setResult(null)}>
            <Text style={styles.backLink}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.resultMainTitle}>
            1. Risk Prediction & Explanation
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
              <Text style={styles.mLabel}>Score</Text>

              <Text style={styles.mValue}>
                {result.risk_prediction.risk_score?.toFixed(1)}
              </Text>
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.mLabel}>Confidence</Text>

              <Text style={styles.mValue}>
                {result.risk_prediction.confidence_percentage}
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
                  borderLeftColor: f.scoring_impact > 0 ? '#EF4444' : '#10B981',
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

          <Text style={styles.resultMainTitle}>
            2. True Personalized Intervention Plan
          </Text>

          <View style={styles.rationaleCard}>
            <Text style={styles.ratTitle}>📅 Plan Rationale</Text>

            <Text style={styles.ratText}>
              • Focus Areas:{' '}
              {result.intervention_plan.plan_summary.focus_areas.join(', ')}
            </Text>

            <Text style={styles.ratText}>
              • Duration:{' '}
              {result.intervention_plan.expected_outcomes.completion_timeline}
            </Text>

            <Text style={styles.ratText}>
              • Basis:{' '}
              {result.intervention_plan.plan_summary.timeline_calculation}
            </Text>
          </View>

          <Text style={styles.subHeader}>💡 Recommended Interventions</Text>

          {result.intervention_plan.personalized_plan.map((item, i) => (
            <View key={i} style={styles.interventionCard}>
              {/* Heading matches Streamlit: Title (Week X-Y) */}
              <Text style={styles.intTitle}>
                {i + 1}. {item.name} (Week {item.start_week}-{item.end_week})
              </Text>

              <Text style={styles.intMeta}>
                Duration:{' '}
                {item.duration_weeks || item.end_week - item.start_week + 1}{' '}
                weeks {'\n'}
                Intensity: {item.intensity} {'\n'}
                Phase: {i + 1}/
                {result.intervention_plan.personalized_plan.length}
              </Text>

              {/* Section 1: Main Goal */}
              <Text style={styles.intLabel}>
                🎯 Your main goal for these weeks:
              </Text>
              <Text style={styles.intGoalText}>{item.description}</Text>

              {/* Section 2: Weekly Plan */}
              <Text style={styles.intLabel}>📋 Your weekly plan:</Text>
              <View style={styles.weeklyPlanBox}>
                {item.simple_steps?.map((step, si) => (
                  <Text key={si} style={styles.stepText}>
                    • {step}
                  </Text>
                ))}
              </View>

              {/* Section 3: Rationale */}
              <Text style={styles.intLabel}>💡 Why this matters for you:</Text>
              <Text style={styles.rationaleContent}>{item.user_rationale}</Text>
            </View>
          ))}

          <TouchableOpacity
            style={styles.button}
            onPress={() => setResult(null)}
          >
            <Text style={styles.buttonText}>RESTART ASSESSMENT</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  intLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    color: '#1f2937',
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
});
