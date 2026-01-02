import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

// Use your API instead of direct Firebase
import { HIVApi } from '../api/client'; // This should point to your FastAPI backend

const RISK_COLORS = {
  'Low Risk': '#10B981',
  'Moderate Risk': '#F59E0B',
  'High Risk': '#EF4444',
  'Very High Risk': '#7F1D1D',
};

const RISK_VALUES = {
  'Low Risk': 1,
  'Moderate Risk': 2,
  'High Risk': 3,
  'Very High Risk': 4,
};

const RISK_DESCRIPTIONS = {
  'Low Risk': 'Minimal risk - Keep up good practices',
  'Moderate Risk': 'Moderate risk - Consider preventive measures',
  'High Risk': 'High risk - Take immediate action',
  'Very High Risk': 'Very high risk - Seek clinical guidance',
};

export const RiskTrendScreen = ({ userId }) => {
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // console.log('Fetching history for user:', userId);

        // Call your FastAPI endpoint
        const response = await HIVApi.getHistory(userId);
        // console.log('API Response:', response);

        if (!response || !Array.isArray(response)) {
          console.log('Invalid response format:', response);
          setHistory([]);
          setLoading(false);
          return;
        }

        // Process the API response
        const apiData = response.map((item, index) => {
          // console.log(`Processing item ${index}:`, item);

          // Extract data from API response
          // The API returns: { "value": 4, "label": "Dec 30" }
          const value = item.value || 1;
          const label = item.label || `Assess ${index + 1}`;

          // Convert numeric value to risk level
          let riskLevel = 'Low Risk';
          if (value === 4) riskLevel = 'Very High Risk';
          else if (value === 3) riskLevel = 'High Risk';
          else if (value === 2) riskLevel = 'Moderate Risk';
          else riskLevel = 'Low Risk';

          return {
            value: value,
            label: label,
            labelTextStyle: { fontSize: 10, color: '#666' },
            dataPointText: riskLevel.charAt(0).toUpperCase(),
            dataPointTextColor: '#FFF',
            dataPointColor: RISK_COLORS[riskLevel] || RISK_COLORS['Low Risk'],
            focusedDataPointColor:
              RISK_COLORS[riskLevel] || RISK_COLORS['Low Risk'],
            dataPointRadius: 10,
            riskLevel: riskLevel,
            fullDate: label, // Use label as date for now
            originalValue: value,
          };
        });

        // console.log('Processed chart data:', apiData);

        // Calculate summary statistics
        const riskCounts = {
          'Low Risk': 0,
          'Moderate Risk': 0,
          'High Risk': 0,
          'Very High Risk': 0,
        };

        apiData.forEach(item => {
          const level = item.riskLevel;
          if (riskCounts.hasOwnProperty(level)) {
            riskCounts[level] += 1;
          }
        });

        const totalAssessments = apiData.length;
        const latestRisk =
          apiData.length > 0
            ? apiData[apiData.length - 1].riskLevel
            : 'No Data';

        // Calculate trend
        let trend = 0;
        if (apiData.length >= 2) {
          const firstValue = apiData[0].value;
          const lastValue = apiData[apiData.length - 1].value;
          trend = lastValue - firstValue;
        }

        setSummary({
          totalAssessments,
          latestRisk,
          trend,
          riskCounts,
          trendDirection:
            trend < 0 ? 'improving' : trend > 0 ? 'worsening' : 'stable',
        });

        setHistory(apiData);
      } catch (error) {
        console.error('Error fetching history:', error);
        console.error('Error details:', error.message);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchHistory();
    } else {
      console.log('No userId provided');
      setLoading(false);
    }
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading your risk trends...</Text>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📊</Text>
        <Text style={styles.emptyTitle}>No Assessment History</Text>
        <Text style={styles.emptyText}>
          Complete your first assessment to start tracking your risk progression
          over time.
        </Text>
        <Text style={styles.emptyTip}>
          Your trend chart will appear here after 2+ assessments.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>📈 Risk Progression Timeline</Text>
        <Text style={styles.sectionSubtitle}>
          How your risk level has changed over time
        </Text>

        {history.length > 0 && (
          <View style={styles.chartContainer}>
            <LineChart
              data={history}
              height={220}
              width={Dimensions.get('window').width - 80}
              initialSpacing={30}
              spacing={Math.max(
                45,
                (Dimensions.get('window').width - 150) / history.length,
              )}
              endSpacing={20}
              color="#6366F1"
              thickness={3}
              curved={history.length > 1}
              noOfSections={4}
              maxValue={4.2}
              minValue={0.8}
              yAxisOffset={0.5}
              yAxisLabelTexts={[
                '',
                'Low Risk',
                'Moderate Risk',
                'High Risk',
                'Very High Risk',
              ]}
              yAxisColor="#E5E7EB"
              xAxisColor="#E5E7EB"
              rulesColor="#F3F4F6"
              xAxisLabelTextStyle={{
                fontSize: 11,
                color: '#6B7280',
                marginTop: 8,
                fontWeight: '500',
              }}
              yAxisTextStyle={{ fontSize: 11, color: '#6B7280' }}
              dataPointsHeight={16}
              dataPointsWidth={16}
              dataPointsRadius={8}
              dataPointsColorFromPoint
              areaChart
              startFillColor="rgba(99, 102, 241, 0.1)"
              endFillColor="rgba(99, 102, 241, 0.01)"
              startOpacity={0.4}
              endOpacity={0.1}
              pointerConfig={{
                pointerStripColor: '#9CA3AF',
                pointerStripWidth: 1,
                pointerColor: '#4F46E5',
                radius: 6,
                pointerLabelWidth: 110,
                pointerLabelHeight: 70,
                activatePointersOnLongPress: true,
                pointerLabelComponent: items => {
                  const item = items[0];
                  return (
                    <View style={styles.tooltip}>
                      <Text style={styles.tooltipDate}>{item?.fullDate}</Text>
                      <View
                        style={[
                          styles.tooltipRiskBadge,
                          { backgroundColor: item?.dataPointColor },
                        ]}
                      >
                        <Text style={styles.tooltipRisk}>
                          {item?.riskLevel}
                        </Text>
                      </View>
                      <Text style={styles.tooltipScore}>
                        Score: {item?.originalValue}/4
                      </Text>
                    </View>
                  );
                },
              }}
            />
          </View>
        )}

        <View style={styles.legend}>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: RISK_COLORS['Low Risk'] },
                ]}
              />
              <Text style={styles.legendText}>Low Risk</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: RISK_COLORS['Moderate Risk'] },
                ]}
              />
              <Text style={styles.legendText}>Moderate Risk</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: RISK_COLORS['High Risk'] },
                ]}
              />
              <Text style={styles.legendText}>High Risk</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: RISK_COLORS['Very High Risk'] },
                ]}
              />
              <Text style={styles.legendText}>Very High Risk</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Summary Cards */}
      {summary && (
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>📊 Assessment Summary</Text>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>
                {summary.totalAssessments}
              </Text>
              <Text style={styles.summaryLabel}>Total Assessments</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: '#FFF' }]}>
              <Text
                style={[
                  styles.summaryNumber,
                  {
                    color: RISK_COLORS[summary.latestRisk] || '#1F2937',
                    fontSize: summary.latestRisk.length > 10 ? 14 : 16,
                  },
                ]}
              >
                {summary.latestRisk}
              </Text>
              <Text style={styles.summaryLabel}>Current Risk Level</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text
                style={[
                  styles.summaryNumber,
                  {
                    color:
                      summary.trendDirection === 'improving'
                        ? '#10B981'
                        : summary.trendDirection === 'worsening'
                        ? '#EF4444'
                        : '#6B7280',
                    fontSize: 16,
                  },
                ]}
              >
                {summary.trendDirection === 'improving'
                  ? '↘ Improving'
                  : summary.trendDirection === 'worsening'
                  ? '↗ Higher Risk'
                  : '➡ Stable'}
              </Text>
              <Text style={styles.summaryLabel}>Overall Trend</Text>
            </View>
          </View>
        </View>
      )}

      {/* Risk Distribution */}
      {summary && (
        <View style={styles.distributionCard}>
          <Text style={styles.sectionTitle}>📋 Risk Level Distribution</Text>
          <View style={styles.distributionBars}>
            {Object.entries(summary.riskCounts).map(([level, count]) => (
              <View key={level} style={styles.distributionItem}>
                <View style={styles.distributionHeader}>
                  <View
                    style={[
                      styles.distributionDot,
                      { backgroundColor: RISK_COLORS[level] },
                    ]}
                  />
                  <Text style={styles.distributionLevel}>{level}</Text>
                  <Text style={styles.distributionCount}>{count}</Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(count / summary.totalAssessments) * 100}%`,
                        backgroundColor: RISK_COLORS[level],
                      },
                    ]}
                  />
                </View>
                <Text style={styles.distributionDescription}>
                  {RISK_DESCRIPTIONS[level]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Insights */}
      <View style={styles.insightsCard}>
        <Text style={styles.sectionTitle}>💡 Clinical Insights</Text>
        <View style={styles.insightItem}>
          <Text style={styles.insightEmoji}>📅</Text>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Consistent Monitoring</Text>
            <Text style={styles.insightText}>
              Regular assessments help track behavioral patterns and
              intervention effectiveness.
            </Text>
          </View>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.insightEmoji}>🎯</Text>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Trend Analysis</Text>
            <Text style={styles.insightText}>
              Upward trends indicate increased risk factors, while downward
              trends show improvement.
            </Text>
          </View>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.insightEmoji}>⚠️</Text>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Medical Note</Text>
            <Text style={styles.insightText}>
              This is a behavioral risk assessment, not a medical diagnosis.
              Consult healthcare providers for clinical testing.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  emptyTip: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  chartCard: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 15, // Added horizontal padding
    overflow: 'visible', // Added to prevent overflow
  },
  legend: {
    marginTop: 20,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    marginHorizontal: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#4B5563',
  },
  tooltip: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minWidth: 160,
  },
  tooltipDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  tooltipRiskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  tooltipRisk: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  tooltipScore: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  summaryContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    elevation: 1,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  distributionCard: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
  },
  distributionBars: {
    marginTop: 16,
  },
  distributionItem: {
    marginBottom: 20,
  },
  distributionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  distributionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  distributionLevel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  distributionCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  distributionDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  insightsCard: {
    backgroundColor: '#FFF',
    margin: 16,
    marginBottom: 32,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
  },
  insightItem: {
    flexDirection: 'row',
    marginTop: 16,
  },
  insightEmoji: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
});
