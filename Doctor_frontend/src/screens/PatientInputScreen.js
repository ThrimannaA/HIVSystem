import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView, TextInput, Alert, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { COLORS } from '../constants/colors';

const PatientInputScreen = ({ navigation }) => {
  const [patientData, setPatientData] = useState({
    patientId: '',
    age: '',
    sex: 'Male',
    ethnicity: '1',
    education: '3',
    occupation: '4',
    maritalStatus: '2',
    transmissionCategory: '3',
    artRegimen: '2NRTIs+NNRTIs',
    artDuration: '',
    hivSubtype: 'CRF07_BC',
  });

  const handleNext = () => {
    if (!patientData.patientId || !patientData.age || !patientData.artDuration) {
      Alert.alert('Missing Information', 'Please fill in all required fields (Patient ID, Age, ART Duration)');
      return;
    }
    navigation.navigate('ClinicalData', { patientData });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>New Analysis [1/3]</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.formContainer}>
        <Text style={styles.formTitle}>👤 PATIENT INFORMATION</Text>

        <Text style={styles.label}>Patient ID *</Text>
        <TextInput
          style={styles.input}
          placeholder="P12345"
          value={patientData.patientId}
          onChangeText={(text) => setPatientData({ ...patientData, patientId: text })}
        />

        <Text style={styles.label}>Age (years) *</Text>
        <TextInput
          style={styles.input}
          placeholder="42"
          keyboardType="numeric"
          value={patientData.age}
          onChangeText={(text) => setPatientData({ ...patientData, age: text })}
        />

        <Text style={styles.label}>Sex *</Text>
        <View style={styles.radioGroup}>
          {[
            { label: 'Male', value: 'Male' },
            { label: 'Female', value: 'Female' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.radioButton}
              onPress={() => setPatientData({ ...patientData, sex: option.value })}
            >
              <View style={styles.radioCircle}>
                {patientData.sex === option.value && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.radioLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Ethnicity</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={patientData.ethnicity}
            onValueChange={(value) => setPatientData({ ...patientData, ethnicity: value })}
            style={styles.picker}
          >
            <Picker.Item label="Han" value="1" />
            <Picker.Item label="Other" value="2" />
          </Picker>
        </View>

        <Text style={styles.label}>Education Level</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={patientData.education}
            onValueChange={(value) => setPatientData({ ...patientData, education: value })}
            style={styles.picker}
          >
            <Picker.Item label="Primary" value="1" />
            <Picker.Item label="Secondary" value="2" />
            <Picker.Item label="High School" value="3" />
            <Picker.Item label="University" value="4" />
          </Picker>
        </View>

        <Text style={styles.label}>Marital Status</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={patientData.maritalStatus}
            onValueChange={(value) => setPatientData({ ...patientData, maritalStatus: value })}
            style={styles.picker}
          >
            <Picker.Item label="Single" value="1" />
            <Picker.Item label="Married" value="2" />
            <Picker.Item label="Divorced" value="3" />
          </Picker>
        </View>

        <Text style={styles.label}>HIV-1 Subtype</Text>
        <TextInput
          style={styles.input}
          placeholder="CRF07_BC"
          value={patientData.hivSubtype}
          onChangeText={(text) => setPatientData({ ...patientData, hivSubtype: text })}
        />

        <Text style={styles.label}>Initial ART Regimen *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={patientData.artRegimen}
            onValueChange={(value) => setPatientData({ ...patientData, artRegimen: value })}
            style={styles.picker}
          >
            <Picker.Item label="2NRTIs+NNRTIs" value="2NRTIs+NNRTIs" />
            <Picker.Item label="2NRTIs+PIs" value="2NRTIs+PIs" />
            <Picker.Item label="2NRTIs+INSTIs" value="2NRTIs+INSTIs" />
          </Picker>
        </View>

        <Text style={styles.label}>ART Duration (months) *</Text>
        <TextInput
          style={styles.input}
          placeholder="24"
          keyboardType="numeric"
          value={patientData.artDuration}
          onChangeText={(text) => setPatientData({ ...patientData, artDuration: text })}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
          <Text style={styles.buttonText}>Next: Lab Data →</Text>
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 15,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  radioGroup: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  radioLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PatientInputScreen;