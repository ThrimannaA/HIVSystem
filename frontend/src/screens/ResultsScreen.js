import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const ResultsScreen = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Your Results</Text>
        <View style={styles.card}>
          <Text style={styles.resultText}>Based on your assessment, your risk level is: Low</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Plan')}
        >
          <Text style={styles.buttonText}>View Prevention Plan</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginVertical: 20 },
  card: { padding: 20, borderRadius: 10, backgroundColor: '#f9f9f9', width: '100%', marginBottom: 20 },
  resultText: { fontSize: 18, textAlign: 'center' },
  button: { backgroundColor: '#2E7D32', padding: 15, borderRadius: 10, width: '100%' },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' }
});

export default ResultsScreen;