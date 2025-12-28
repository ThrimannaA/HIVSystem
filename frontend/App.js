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

  // Language & Culture Mapping (Same as your Streamlit code)
  const languageCultureMap = {
    English: { code: 'en', culture: 'English-speaking' },
    'Sinhala (Sri Lanka)': { code: 'si', culture: 'Sri Lankan' },
    'Tamil (Sri Lanka)': { code: 'ta', culture: 'Sri Lankan' },
  };

  // useEffect(() => {
  //   HIVApi.getSchema()
  //     .then(data => {
  //       setSchema(data);
  //       let initialData = {};
  //       Object.keys(data.feature_definitions).forEach(key => {
  //         initialData[key] = 1; // Default to first option
  //       });
  //       setFormData(initialData);
  //     })
  //     .catch(err =>
  //       Alert.alert('Error', 'Could not load schema from backend.'),
  //     );
  // }, []);

  useEffect(() => {
    HIVApi.getSchema()
      .then(data => {
        // 1. Convert the dictionary to an array so we can sort it
        const featuresArray = Object.entries(data.feature_definitions);

        // 2. Sort the array based on the 'category' field (exactly like Streamlit)
        featuresArray.sort((a, b) => {
          const catA = a[1].category.toUpperCase();
          const catB = b[1].category.toUpperCase();
          if (catA < catB) return -1;
          if (catA > catB) return 1;
          return 0;
        });

        // 3. Store the sorted array in the state
        setSchema({
          ...data,
          sorted_features: featuresArray,
        });

        // 4. Initialize default values
        let initialData = {};
        featuresArray.forEach(([key]) => {
          initialData[key] = 1;
        });
        setFormData(initialData);
      })
      .catch(err => Alert.alert('Error', 'Could not load schema.'));
  }, []);

  const runAssessment = async () => {
    setLoading(true);

    // 1. Get the codes based on the UI selection (English/Sinhala/Tamil)
    const selected = languageCultureMap[prefLanguage];

    // 2. Combine the questions AND the language settings into one object
    const finalPayload = {
      data: formData, // Your Q1, Q2, etc.
      preferred_language: selected.code, // "si" or "ta"
      preferred_culture: selected.culture, // "Sri Lankan"
    };

    try {
      // 3. Send the complete package to Python
      const response = await HIVApi.assessRisk(
        finalPayload.data,
        finalPayload.preferred_language,
        finalPayload.preferred_culture,
      );
      setResult(response);
    } catch (e) {
      Alert.alert('Error', 'Translation failed or Backend unreachable');
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
      <Text style={styles.mainTitle}>
        🔬 HIV Prevention: AI Personalization
      </Text>

      {!result ? (
        <View>
          {/* LANGUAGE SELECTION SECTION */}
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>🌍 Plan Language & Culture</Text>
            <Picker
              selectedValue={prefLanguage}
              onValueChange={itemValue => setPrefLanguage(itemValue)}
            >
              {Object.keys(languageCultureMap).map(lang => (
                <Picker.Item key={lang} label={lang} value={lang} />
              ))}
            </Picker>
          </View>

          {/* QUESTIONS SECTION */}
          <Text style={styles.sectionHeader}>👤 User Profile Simulation</Text>
          {schema.sorted_features.map(([key, info]) => (
            <View key={key} style={styles.questionCard}>
              <Text style={styles.categoryLabel}>{info.category}</Text>
              <Text style={styles.questionText}>{info.question}</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData[key]?.toString()}
                  onValueChange={val =>
                    setFormData({ ...formData, [key]: parseInt(val) })
                  }
                >
                  {Object.entries(info.options).map(([val, label]) => (
                    <Picker.Item key={val} label={label} value={val} />
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
        /* RESULTS VIEW (Streamlit-like UI) */
        <View style={styles.resultView}>
          <TouchableOpacity
            onPress={() => setResult(null)}
            style={styles.backBtn}
          >
            <Text style={{ color: '#2196F3' }}>← Back to Profile</Text>
          </TouchableOpacity>

          {/* RISK LEVEL HEADER */}
          <View
            style={[
              styles.riskHeader,
              { backgroundColor: result.risk_prediction.color },
            ]}
          >
            <Text style={styles.riskLevelText}>
              Current Risk Level: {result.risk_prediction.risk_level}
            </Text>
            <Text style={styles.riskDesc}>
              {result.risk_prediction.description}
            </Text>
          </View>

          {/* RISK EXPLANATION SECTION (Metrics like Streamlit Col 1 & 2) */}
          <View style={styles.card}>
            <Text style={styles.subTitle}>
              1. Risk Prediction & Explanation
            </Text>
            <View style={styles.metricRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Risk Score</Text>
                <Text style={styles.metricValue}>
                  {result.risk_prediction.risk_score?.toFixed(1)}
                </Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Confidence</Text>
                <Text style={styles.metricValue}>
                  {result.risk_prediction.confidence_percentage}
                </Text>
              </View>
            </View>

            {/* Personalized Factors List */}
            {result.risk_prediction.personalized_factors
              .slice(0, 3)
              .map((factor, i) => (
                <View
                  key={i}
                  style={[
                    styles.factorItem,
                    {
                      borderLeftColor:
                        factor.scoring_impact > 0 ? '#EF4444' : '#10B981',
                    },
                  ]}
                >
                  <Text style={styles.factorQuestion}>{factor.question}</Text>
                  <Text style={styles.factorImpact}>
                    {factor.interpretation} (Points: {factor.scoring_impact})
                  </Text>
                </View>
              ))}
          </View>

          {/* INTERVENTION PLAN SECTION (Like Streamlit Col 3) */}
          <View style={styles.card}>
            <Text style={styles.subTitle}>
              2. Personalized Intervention Plan
            </Text>
            <Text style={styles.rationaleText}>
              📅 Timeline Basis:{' '}
              {result.intervention_plan.plan_summary.timeline_calculation}
            </Text>

            {result.intervention_plan.personalized_plan.map((item, index) => (
              <View key={index} style={styles.planItem}>
                <Text style={styles.planName}>
                  {index + 1}. {item.name}
                </Text>
                <Text style={styles.planWeeks}>
                  Week {item.start_week} - {item.end_week} ({item.intensity})
                </Text>
                <Text style={styles.planDesc}>{item.description}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f6', padding: 15 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginVertical: 10,
  },
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  questionCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  questionText: { fontSize: 14, fontWeight: '600', color: '#4b5563' },
  pickerContainer: {
    backgroundColor: '#f9fafb',
    marginTop: 8,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  riskHeader: { padding: 20, borderRadius: 10, marginBottom: 20 },
  riskLevelText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  riskDesc: { color: 'white', fontSize: 14, marginTop: 5 },
  subTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  metricBox: { alignItems: 'center' },
  metricLabel: { fontSize: 12, color: '#6b7280' },
  metricValue: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  factorItem: {
    padding: 10,
    borderLeftWidth: 4,
    backgroundColor: '#f9fafb',
    marginBottom: 8,
  },
  factorQuestion: { fontSize: 13, fontWeight: 'bold' },
  factorImpact: { fontSize: 12, color: '#4b5563' },
  planItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 12,
  },
  planName: { fontSize: 15, fontWeight: 'bold', color: '#2196F3' },
  planWeeks: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  planDesc: { fontSize: 13, marginTop: 5, color: '#374151' },
  backBtn: { marginBottom: 15 },
  rationaleText: {
    fontStyle: 'italic',
    color: '#6b7280',
    fontSize: 13,
    marginBottom: 10,
  },
});
