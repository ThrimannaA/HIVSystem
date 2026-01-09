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
import riskTrendStyles from '../styles/RiskTrendScreenStyles'; // Import the styles

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
        // Call your FastAPI endpoint
        const response = await HIVApi.getHistory(userId);

        if (!response || !Array.isArray(response)) {
          console.log('Invalid response format:', response);
          setHistory([]);
          setLoading(false);
          return;
        }

        // Process the API response
        const apiData = response.map((item, index) => {
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
          const previousValue = apiData[apiData.length - 2].value;
          const lastValue = apiData[apiData.length - 1].value;
          trend = lastValue - previousValue;
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
      <View style={riskTrendStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={riskTrendStyles.loadingText}>
          Loading your risk trends...
        </Text>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={riskTrendStyles.emptyContainer}>
        <Text style={riskTrendStyles.emptyEmoji}>📊</Text>
        <Text style={riskTrendStyles.emptyTitle}>No Assessment History</Text>
        <Text style={riskTrendStyles.emptyText}>
          Complete your first assessment to start tracking your risk progression
          over time.
        </Text>
        <Text style={riskTrendStyles.emptyTip}>
          Your trend chart will appear here after 2+ assessments.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={riskTrendStyles.container}>
      <View style={riskTrendStyles.chartCard}>
        <Text style={riskTrendStyles.sectionTitle}>
          📈 Risk Progression Timeline
        </Text>
        <Text style={riskTrendStyles.sectionSubtitle}>
          How your risk level has changed over time
        </Text>

        {history.length > 0 && (
          <View style={riskTrendStyles.chartContainer}>
            <LineChart
              data={history}
              height={220}
              width={Dimensions.get('window').width - 100}
              initialSpacing={30}
              spacing={Math.max(
                50,
                (Dimensions.get('window').width - 160) /
                  (history.length > 1 ? history.length : 1),
              )}
              endSpacing={30}
              color="#080ce2ff"
              thickness={3}
              curved={history.length > 1}
              noOfSections={4}
              maxValue={4.5}
              minValue={0}
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
                    <View style={riskTrendStyles.tooltip}>
                      <Text style={riskTrendStyles.tooltipDate}>
                        {item?.fullDate}
                      </Text>
                      <View
                        style={[
                          riskTrendStyles.tooltipRiskBadge,
                          { backgroundColor: item?.dataPointColor },
                        ]}
                      >
                        <Text style={riskTrendStyles.tooltipRisk}>
                          {item?.riskLevel}
                        </Text>
                      </View>
                      <Text style={riskTrendStyles.tooltipScore}>
                        Score: {item?.originalValue}/4
                      </Text>
                    </View>
                  );
                },
              }}
            />
          </View>
        )}

        <View style={riskTrendStyles.legend}>
          <View style={riskTrendStyles.legendRow}>
            <View style={riskTrendStyles.legendItem}>
              <View
                style={[
                  riskTrendStyles.legendDot,
                  { backgroundColor: RISK_COLORS['Low Risk'] },
                ]}
              />
              <Text style={riskTrendStyles.legendText}>Low Risk</Text>
            </View>
            <View style={riskTrendStyles.legendItem}>
              <View
                style={[
                  riskTrendStyles.legendDot,
                  { backgroundColor: RISK_COLORS['Moderate Risk'] },
                ]}
              />
              <Text style={riskTrendStyles.legendText}>Moderate Risk</Text>
            </View>
            <View style={riskTrendStyles.legendItem}>
              <View
                style={[
                  riskTrendStyles.legendDot,
                  { backgroundColor: RISK_COLORS['High Risk'] },
                ]}
              />
              <Text style={riskTrendStyles.legendText}>High Risk</Text>
            </View>
            <View style={riskTrendStyles.legendItem}>
              <View
                style={[
                  riskTrendStyles.legendDot,
                  { backgroundColor: RISK_COLORS['Very High Risk'] },
                ]}
              />
              <Text style={riskTrendStyles.legendText}>Very High Risk</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Summary Cards */}
      {summary && (
        <View style={riskTrendStyles.summaryContainer}>
          <Text style={riskTrendStyles.sectionTitle}>
            📊 Assessment Summary
          </Text>

          <View style={riskTrendStyles.summaryGrid}>
            <View style={riskTrendStyles.summaryCard}>
              <Text style={riskTrendStyles.summaryNumber}>
                {summary.totalAssessments}
              </Text>
              <Text style={riskTrendStyles.summaryLabel}>
                Total Assessments
              </Text>
            </View>

            <View
              style={[riskTrendStyles.summaryCard, { backgroundColor: '#FFF' }]}
            >
              <Text
                style={[
                  riskTrendStyles.summaryNumber,
                  {
                    color: RISK_COLORS[summary.latestRisk] || '#1F2937',
                    fontSize: summary.latestRisk.length > 10 ? 14 : 16,
                  },
                ]}
              >
                {summary.latestRisk}
              </Text>
              <Text style={riskTrendStyles.summaryLabel}>
                Current Risk Level
              </Text>
            </View>

            <View style={riskTrendStyles.summaryCard}>
              <Text
                style={[
                  riskTrendStyles.summaryNumber,
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
              <Text style={riskTrendStyles.summaryLabel}>Your Progress</Text>
            </View>
          </View>
        </View>
      )}

      {/* Risk Distribution */}
      {summary && (
        <View style={riskTrendStyles.distributionCard}>
          <Text style={riskTrendStyles.sectionTitle}>
            📋 Risk Level Distribution
          </Text>
          <View style={riskTrendStyles.distributionBars}>
            {Object.entries(summary.riskCounts).map(([level, count]) => (
              <View key={level} style={riskTrendStyles.distributionItem}>
                <View style={riskTrendStyles.distributionHeader}>
                  <View
                    style={[
                      riskTrendStyles.distributionDot,
                      { backgroundColor: RISK_COLORS[level] },
                    ]}
                  />
                  <Text style={riskTrendStyles.distributionLevel}>{level}</Text>
                  <Text style={riskTrendStyles.distributionCount}>{count}</Text>
                </View>
                <View style={riskTrendStyles.progressBar}>
                  <View
                    style={[
                      riskTrendStyles.progressFill,
                      {
                        width: `${(count / summary.totalAssessments) * 100}%`,
                        backgroundColor: RISK_COLORS[level],
                      },
                    ]}
                  />
                </View>
                <Text style={riskTrendStyles.distributionDescription}>
                  {RISK_DESCRIPTIONS[level]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Insights */}
      <View style={riskTrendStyles.insightsCard}>
        <Text style={riskTrendStyles.sectionTitle}>💡 Clinical Insights</Text>
        <View style={riskTrendStyles.insightItem}>
          <Text style={riskTrendStyles.insightEmoji}>📅</Text>
          <View style={riskTrendStyles.insightContent}>
            <Text style={riskTrendStyles.insightTitle}>
              Consistent Monitoring
            </Text>
            <Text style={riskTrendStyles.insightText}>
              Regular assessments help track behavioral patterns and
              intervention effectiveness.
            </Text>
          </View>
        </View>
        <View style={riskTrendStyles.insightItem}>
          <Text style={riskTrendStyles.insightEmoji}>🎯</Text>
          <View style={riskTrendStyles.insightContent}>
            <Text style={riskTrendStyles.insightTitle}>Trend Analysis</Text>
            <Text style={riskTrendStyles.insightText}>
              Upward trends indicate increased risk factors, while downward
              trends show improvement.
            </Text>
          </View>
        </View>
        <View style={riskTrendStyles.insightItem}>
          <Text style={riskTrendStyles.insightEmoji}>⚠️</Text>
          <View style={riskTrendStyles.insightContent}>
            <Text style={riskTrendStyles.insightTitle}>Medical Note</Text>
            <Text style={riskTrendStyles.insightText}>
              This is a behavioral risk assessment, not a medical diagnosis.
              Consult healthcare providers for clinical testing.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};
