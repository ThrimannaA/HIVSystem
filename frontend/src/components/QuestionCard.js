import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import QuestionCardStyles from './QuestionCardStyles'; // Import the separate styles file

const QuestionCard = ({ feature, featureName, value, onAnswer, index }) => {
  const { question, options } = feature;

  return (
    <View style={QuestionCardStyles.card}>
      <Text style={QuestionCardStyles.question}>
        {index + 1}. {question}
      </Text>

      <View style={QuestionCardStyles.optionsContainer}>
        {options &&
          typeof options === 'object' &&
          Object.entries(options).map(([optionValue, optionText]) => (
            <TouchableOpacity
              key={optionValue}
              style={[
                QuestionCardStyles.optionButton,
                parseInt(value) === parseInt(optionValue) &&
                  QuestionCardStyles.optionButtonSelected,
              ]}
              onPress={() => onAnswer(featureName, parseInt(optionValue))}
            >
              <Text
                style={[
                  QuestionCardStyles.optionText,
                  parseInt(value) === parseInt(optionValue) &&
                    QuestionCardStyles.optionTextSelected,
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

export default QuestionCard;
