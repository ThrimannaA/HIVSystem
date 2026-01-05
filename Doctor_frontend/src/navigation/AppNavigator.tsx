import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

// Authentication Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Main App Screens
import DashboardScreen from '../screens/DashboardScreen';
import PatientInputScreen from '../screens/PatientInputScreen';
import ClinicalDataScreen from '../screens/ClinicalDataScreen';
import ResistanceDataScreen from '../screens/ResistanceDataScreen';
import LoadingScreen from '../screens/LoadingScreen';
import ResultsScreen from '../screens/ResultsScreen';
import DetailedAnalysisScreen from '../screens/DetailedAnalysisScreen';
import TreatmentRecommendationScreen from '../screens/TreatmentRecommendationScreen';
import PatientListScreen from '../screens/PatientListScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Handle user state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, userState => {
      setUser(userState);
      if (initializing) setInitializing(false);
    });
    return unsubscribe; // unsubscribe on unmount
  }, [initializing]);

  if (initializing) return null; // Show loading screen if needed

  return (
    <Stack.Navigator
      initialRouteName={user ? 'Dashboard' : 'Welcome'}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {!user ? (
        // Auth Stack
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        // Main App Stack
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="PatientInput" component={PatientInputScreen} />
          <Stack.Screen name="ClinicalData" component={ClinicalDataScreen} />
          <Stack.Screen name="ResistanceData" component={ResistanceDataScreen} />
          <Stack.Screen name="Loading" component={LoadingScreen} />
          <Stack.Screen name="Results" component={ResultsScreen} />
          <Stack.Screen name="DetailedAnalysis" component={DetailedAnalysisScreen} />
          <Stack.Screen name="TreatmentRecommendation" component={TreatmentRecommendationScreen} />
          <Stack.Screen name="PatientList" component={PatientListScreen} />
          <Stack.Screen name="Analytics" component={AnalyticsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  PatientInput: undefined;
  ClinicalData: { patientData: any };
  ResistanceData: { patientData: any };
  Loading: { patientData: any };
  Results: { patient: any };
  DetailedAnalysis: { patient: any };
  TreatmentRecommendation: { patient: any };
  PatientList: undefined;
  Analytics: undefined;
  Settings: undefined;
};