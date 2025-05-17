// In components/HeartRateHistoryChart.tsx
import React from 'react';
import { View, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { HeartRateData } from '../types';

interface HeartRateHistoryChartProps {
  data: HeartRateData[];
}

const HeartRateHistoryChart = ({ data }: HeartRateHistoryChartProps) => {
  // Format data for the chart
  const chartData = {
    labels: data.map(item => {
      const date = new Date(item.timestamp);
      return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    }).filter((_, index) => index % Math.max(1, Math.floor(data.length / 6)) === 0), // Show ~6 labels
    datasets: [
      {
        data: data.map(item => item.bpm),
        color: (opacity = 1) => `rgba(107, 181, 181, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };

  return (
    <View>
      <LineChart
        data={chartData}
        width={Dimensions.get('window').width - 64}
        height={220}
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16
          },
          propsForDots: {
            r: '3',
            strokeWidth: '1',
            stroke: '#6BB5B5'
          }
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16
        }}
      />
    </View>
  );
};

export default HeartRateHistoryChart;