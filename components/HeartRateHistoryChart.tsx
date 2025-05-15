import React from 'react';
import { Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { HeartRateData } from '../types';

interface HeartRateHistoryChartProps {
  data: HeartRateData[];
}

const HeartRateHistoryChart: React.FC<HeartRateHistoryChartProps> = ({ data = [] }) => {
  // If no data, return null
  if (data.length === 0) {
    return null;
  }

  // Format data for the chart
  const chartData = {
    labels: data.map((item, index) => {
      // Show a label every 3 points to avoid crowding
      return index % 3 === 0 ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    }),
    datasets: [
      {
        data: data.map(item => item.bpm),
        color: (opacity = 1) => `rgba(107, 181, 181, ${opacity})`, // Teal color
        strokeWidth: 2,
      },
    ],
  };

  return (
    <LineChart
      data={chartData}
      width={Dimensions.get('window').width - 32} // Screen width minus padding
      height={220}
      yAxisSuffix=" bpm"
      chartConfig={{
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        style: {
          borderRadius: 16,
        },
        propsForDots: {
          r: '4',
          strokeWidth: '2',
          stroke: '#6BB5B5',
        },
      }}
      bezier
      style={{
        marginVertical: 8,
        borderRadius: 16,
      }}
    />
  );
};

export default HeartRateHistoryChart;