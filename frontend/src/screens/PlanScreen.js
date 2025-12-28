import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const PlanScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prevention Plan</Text>
      <Text style={styles.text}>1. Regular testing every 3-6 months.</Text>
      <Text style={styles.text}>2. Use protection consistently.</Text>
      <Text style={styles.text}>3. Consult a healthcare provider about PrEP.</Text>
      
      <View style={{ marginTop: 20 }}>
        <Button title="Back to Home" onPress={() => navigation.popToTop()} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  text: { fontSize: 16, marginBottom: 10 }
});

export default PlanScreen;