/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

// Mock the fetch API to avoid network errors in tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ feature_definitions: {} }),
  })
);

// Mock the Alert API
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Mock the Picker component
jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    Picker: ({ children, selectedValue, onValueChange, ...props }) => {
      return React.createElement(View, props, children);
    },
  };
});

// Mock expo-print
jest.mock('expo-print', () => ({
  printAsync: jest.fn(),
}));

// Mock react-native-gifted-charts
jest.mock('react-native-gifted-charts', () => ({
  LineChart: () => null,
  BarChart: () => null,
}));

import App from '../App';

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders correctly', async () => {
    let root;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(<App />);
    });
    expect(root).toBeTruthy();
  });
});
