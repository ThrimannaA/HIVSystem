import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { getCurrentUser, getUserProfile, getPatientAnalyses } from '../firebase/firebaseService';

const DashboardScreen = ({ navigation }) => {
  const [doctorName, setDoctorName] = useState('Doctor');
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctorProfile();
    loadAnalyses();
  }, []);

  const loadDoctorProfile = async () => {
    const user = getCurrentUser();
    if (user) {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setDoctorName(profile.fullName);
      }
    }
  };

  const loadAnalyses = async () => {
    setLoading(true);
    const data = await getPatientAnalyses();
    setAnalyses(data);
    setLoading(false);
  };

  const highRiskCount = analyses.filter(a => a.results?.riskScore >= 0.7).length;
  const lowRiskCount = analyses.filter(a => a.results?.riskScore < 0.7).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>Welcome,</Text>
            <Text style={styles.headerName}>{doctorName}</Text>
          </View>
          <TouchableOpacity style={styles.notificationBadge}>
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{highRiskCount}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <Text style={styles.statsNumber}>{analyses.length}</Text>
            <Text style={styles.statsLabel}>Total Patients</Text>
          </View>
          <View style={[styles.statsCard, styles.statsCardDanger]}>
            <Text style={styles.statsNumber}>{highRiskCount}</Text>
            <Text style={styles.statsLabel}>High Risk</Text>
          </View>
          <View style={[styles.statsCard, styles.statsCardSuccess]}>
            <Text style={styles.statsNumber}>{lowRiskCount}</Text>
            <Text style={styles.statsLabel}>Low Risk</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('PatientInput')}
          >
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionText}>New Analysis</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('PatientList')}
          >
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionText}>Patient List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Analytics')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Analyses */}
        <Text style={styles.sectionTitle}>Recent Analyses</Text>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : analyses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📋</Text>
            <Text style={styles.emptyStateText}>No analyses yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start by analyzing your first patient
            </Text>
          </View>
        ) : (
          analyses.slice(0, 5).map((analysis, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recentCard}
              onPress={() =>
                navigation.navigate('Results', {
                  patient: {
                    ...analysis.patientData,
                    ...analysis.results,
                  },
                })
              }
            >
              <View style={styles.recentCardLeft}>
                <Text style={styles.recentCardId}>
                  {analysis.patientData?.patientId || 'Unknown'}
                </Text>
                <Text style={styles.recentCardRisk}>
                  {analysis.results?.riskScore >= 0.7
                    ? '🔴 High Risk'
                    : '🟢 Low Risk'}
                </Text>
              </View>
              <Text style={styles.recentCardTime}>
                {new Date(analysis.timestamp?.toDate()).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerGreeting: {
    color: COLORS.white,
    fontSize: 16,
    opacity: 0.9,
  },
  headerName: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  notificationBadge: {
    position: 'relative',
  },
  notificationIcon: {
    fontSize: 28,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  statsCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    elevation: 2,
  },
  statsCardDanger: {
    backgroundColor: COLORS.lightRed,
  },
  statsCardSuccess: {
    backgroundColor: COLORS.lightGreen,
  },
  statsNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statsLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 15,
    marginTop: 15,
    marginBottom: 10,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 10,
  },
  actionCard: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
  },
  actionIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
  },
  recentCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  recentCardLeft: {
    flex: 1,
  },
  recentCardId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  recentCardRisk: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 5,
  },
  recentCardTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default DashboardScreen;