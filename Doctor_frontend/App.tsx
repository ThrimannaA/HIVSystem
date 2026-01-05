import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { PatientsProvider } from './src/context/PatientsContext';

export default function App() {
  return (
    <PatientsProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </PatientsProvider>
  );
}