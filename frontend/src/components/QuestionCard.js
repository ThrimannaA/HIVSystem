import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const QuestionCard = ({ feature, featureName, value, onAnswer, index }) => {
  const { question, options } = feature;

  return (
    <View style={styles.card}>
      <Text style={styles.question}>
        {index + 1}. {question}
      </Text>

      <View style={styles.optionsContainer}>
        {options &&
          typeof options === "object" &&
          Object.entries(options).map(([optionValue, optionText]) => (
            <TouchableOpacity
              key={optionValue}
              style={[
                styles.optionButton,
                parseInt(value) === parseInt(optionValue) &&
                  styles.optionButtonSelected,
              ]}
              onPress={() => onAnswer(featureName, parseInt(optionValue))}
            >
              <Text
                style={[
                  styles.optionText,
                  parseInt(value) === parseInt(optionValue) &&
                    styles.optionTextSelected,
                ]}
              >
                {optionText}
              </Text>
            </TouchableOpacity>
          ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  question: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: "column",
  },
  optionButton: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  optionButtonSelected: {
    backgroundColor: "#dbeafe",
    borderColor: "#3b82f6",
  },
  optionText: {
    fontSize: 14,
    color: "#4b5563",
  },
  optionTextSelected: {
    color: "#1e40af",
    fontWeight: "600",
  },
});

export default QuestionCard;
