import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  StatusBar,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { getCurrentUser, getUserProfile, signOut } from '../firebase/firebaseService';

const SettingsScreen = ({ navigation }) => {
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const user = getCurrentUser();
    if (user) {
      const profile = await getUserProfile(user.uid);
      setDoctorProfile(profile);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            const result = await signOut();
            if (result.success) {
              // Navigation will be handled automatically by AppNavigator
            } else {
              Alert.alert('Error', 'Logout failed. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>Settings</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.settingsContainer}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Text style={styles.profileIcon}>👤</Text>
          <Text style={styles.profileName}>
            {doctorProfile?.fullName || 'Loading...'}
          </Text>
          <Text style={styles.profileTitle}>
            {doctorProfile?.specialization || 'Doctor'}
          </Text>
          <Text style={styles.profileEmail}>
            {doctorProfile?.email || ''}
          </Text>
        </View>

        {/* Preferences */}
        <Text style={styles.settingsSection}>⚙️ PREFERENCES</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Notifications</Text>
          <TouchableOpacity
            style={[styles.toggle, notifications && styles.toggleActive]}
            onPress={() => setNotifications(!notifications)}
          >
            <View
              style={[
                styles.toggleCircle,
                notifications && styles.toggleCircleActive,
              ]}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Dark Mode</Text>
          <TouchableOpacity
            style={[styles.toggle, darkMode && styles.toggleActive]}
            onPress={() => setDarkMode(!darkMode)}
          >
            <View
              style={[styles.toggleCircle, darkMode && styles.toggleCircleActive]}
            />
          </TouchableOpacity>
        </View>

        {/* Security */}
        <Text style={styles.settingsSection}>🔐 SECURITY</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Change Password</Text>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>

        {/* About */}
        <Text style={styles.settingsSection}>ℹ️ ABOUT</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Version</Text>
          <Text style={styles.settingValue}>1.0.0</Text>
        </View>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Privacy Policy</Text>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Terms of Service</Text>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>🚪 Logout</Text>
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
  settingsContainer: {
    padding: 15,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
  },
  profileIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  profileTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 5,
  },
  profileEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 5,
  },
  settingsSection: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 15,
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  settingValue: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  settingArrow: {
    fontSize: 18,
    color: COLORS.primary,
  },
  toggle: {
    width: 50,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.success,
  },
  toggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.white,
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
  },
  logoutButton: {
    backgroundColor: COLORS.danger,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    elevation: 2,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;