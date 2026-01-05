import AsyncStorage from '@react-native-async-storage/async-storage';

export const savePatient = async (patientData) => {
  try {
    const existingPatients = await getPatients();
    const updatedPatients = [...existingPatients, patientData];
    await AsyncStorage.setItem('patients', JSON.stringify(updatedPatients));
    return true;
  } catch (error) {
    console.error('Save Error:', error);
    return false;
  }
};

export const getPatients = async () => {
  try {
    const data = await AsyncStorage.getItem('patients');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Get Error:', error);
    return [];
  }
};

export const deletePatient = async (patientId) => {
  try {
    const patients = await getPatients();
    const filtered = patients.filter(p => p.id !== patientId);
    await AsyncStorage.setItem('patients', JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Delete Error:', error);
    return false;
  }
};