import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { HIVApi } from '../api/client'; // Adjust path if necessary

const RISK_COLORS = {
  low: '#10B981', // Green
  moderate: '#F59E0B', // Orange
  high: '#EF4444', // Red
  veryHigh: '#7F1D1D', // Dark Red
};
// Sample data structure for demonstration purposes
export const RiskTrendScreen = ({ userId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await HIVApi.getHistory(userId);

        // 2. LOGIC TO COLOR EACH DOT BASED ON THE SCORE
        const chartData = data.map(item => {
          let pointColor = RISK_COLORS.low;
          const score = item.value;

          // Adjust these numbers based on your specific backend point system
          if (score >= 180) pointColor = RISK_COLORS.veryHigh;
          else if (score >= 150) pointColor = RISK_COLORS.high;
          else if (score >= 100) pointColor = RISK_COLORS.moderate;
          else pointColor = RISK_COLORS.low;

          return {
            value: item.value,
            label: item.label,
            dataPointText: item.value.toString(),
            // This is the specific property for Gifted Charts to color the dot
            dataPointColor: pointColor,
            focusedDataPointColor: pointColor,
          };
        });

        setHistory(chartData);
      } catch (error) {
        console.error('History fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [userId]);

  if (loading) return <ActivityIndicator size="small" color="#2196F3" />;

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>📉 Your Risk Trend Analysis</Text>
      <Text style={styles.chartSub}>
        Tracking progress across your assessments
      </Text>

      {history.length > 1 ? (
        <View style={{ marginLeft: -20 }}>
          {/* <LineChart
            data={history}
            height={180}
            width={Dimensions.get('window').width - 100}
            initialSpacing={30}
            spacing={50}
            color="#2196F3"
            thickness={3}
            startFillColor="rgba(33, 150, 243, 0.3)"
            endFillColor="rgba(33, 150, 243, 0.01)"
            startOpacity={0.9}
            endOpacity={0.2}
            curved
            noOfSections={4}
            maxValue={200}
            yAxisColor="#c6c6c6"
            xAxisColor="#c6c6c6"
            dataPointsColor="#0D47A1"
            focusedDataPointColor="#FF5722"
            xAxisLabelTextStyle={{ fontSize: 10, color: '#666' }}
            yAxisTextStyle={{ fontSize: 10, color: '#666' }}
          /> */}
          <LineChart
            data={history}
            height={180}
            width={Dimensions.get('window').width - 100}
            initialSpacing={30}
            spacing={50}
            // Line color is neutral gray so the colored dots stand out
            color="#150484ff"
            thickness={3}
            startFillColor="rgba(33, 150, 243, 0.3)"
            endFillColor="rgba(33, 150, 243, 0.01)"
            startOpacity={0.4}
            endOpacity={0.1}
            curved
            noOfSections={4}
            maxValue={400}
            yAxisColor="#c6c6c6"
            xAxisColor="#c6c6c6"
            // Ensure the data points use the colors we assigned in the map
            dataPointsHeight={15}
            dataPointsWidth={15}
            xAxisLabelTextStyle={{ fontSize: 12, color: '#666' }}
            yAxisTextStyle={{ fontSize: 12, color: '#666' }}
          />
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            {history.length === 1
              ? 'Keep going! You need at least 2 assessments to see a trend line.'
              : 'No history found yet. Complete your first assessment!'}
          </Text>
        </View>
      )}

      {/* 3. THE LEGEND SECTION */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: RISK_COLORS.low }]} />
          <Text style={styles.legText}>Low</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.dot, { backgroundColor: RISK_COLORS.moderate }]}
          />
          <Text style={styles.legText}>Moderate</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: RISK_COLORS.high }]} />
          <Text style={styles.legText}>High</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.dot, { backgroundColor: RISK_COLORS.veryHigh }]}
          />
          <Text style={styles.legText}>Very High</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginVertical: 10,
    elevation: 3,
  },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1C1E' },
  chartSub: { fontSize: 12, color: '#6b7280', marginBottom: 20 },
  emptyBox: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    padding: 10,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    mx: 10,
    marginHorizontal: 10,
  },
  dot: { width: 15, height: 15, borderRadius: 5, marginRight: 5 },
  legText: { fontSize: 15, color: '#4B5563' },
});
