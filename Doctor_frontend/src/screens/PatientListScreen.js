import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { usePatients } from '../context/PatientsContext';

const PatientListScreen = ({ navigation }) => {
  const { patients } = usePatients();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('All');

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterRisk === 'All' || 
      (filterRisk === 'High' && p.riskScore >= 0.7) ||
      (filterRisk === 'Low' && p.riskScore < 0.7);
    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>Patient List</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search patients..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        {['All', 'High', 'Low'].map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              filterRisk === filter && styles.filterButtonActive
            ]}
            onPress={() => setFilterRisk(filter)}
          >
            <Text style={[
              styles.filterButtonText,
              filterRisk === filter && styles.filterButtonTextActive
            ]}>
              {filter} {filter !== 'All' && 'Risk'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.listContainer}>
        {filteredPatients.map((patient, index) => (
          <TouchableOpacity
            key={index}
            style={styles.patientListCard}
            onPress={() => navigation.navigate('Results', { patient })}
          >
            <View style={styles.patientListLeft}>
              <Text style={styles.patientListIcon}>
                {patient.riskScore >= 0.7 ? '🔴' : '🟢'}
              </Text>
              <View>
                <Text style={styles.patientListId}>{patient.id}</Text>
                <Text style={styles.patientListInfo}>
                  {patient.sex}, {patient.age}yo
                </Text>
                <Text style={styles.patientListRisk}>
                  Risk: {(patient.riskScore * 100).toFixed(0)}% | {patient.timeAgo}
                </Text>
              </View>
            </View>
            <Text style={styles.patientListArrow}>→</Text>
          </TouchableOpacity>
        ))}
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
  searchContainer: {
    padding: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  listContainer: {
    flex: 1,
    padding: 15,
  },
  patientListCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  patientListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  patientListIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  patientListId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  patientListInfo: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 3,
  },
  patientListRisk: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  patientListArrow: {
    fontSize: 20,
    color: COLORS.textSecondary,
  },
});

export default PatientListScreen;