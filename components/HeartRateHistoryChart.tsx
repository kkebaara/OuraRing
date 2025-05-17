import React from 'react';
import { View, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { HeartRateData } from '../types';

interface HeartRateHistoryChartProps {
  data: HeartRateData[];
}

const HeartRateHistoryChart = ({ data }: HeartRateHistoryChartProps) => {
  // Format data for the chart
  const formatChartData = () => {
    // Get total data points
    const totalPoints = data.length;
    
    // Determine how many labels to show based on data length
    const maxLabels = 6;
    const skipInterval = Math.max(1, Math.floor(totalPoints / maxLabels));
    
    // For short time periods, format with hours and minutes
    // For longer periods, use date formatting
    const isShortTimePeriod = 
      (new Date(data[totalPoints - 1].timestamp).getTime() - 
       new Date(data[0].timestamp).getTime()) < (24 * 60 * 60 * 1000);
    
    const labels = data
      .map((item, index) => {
        const date = new Date(item.timestamp);
        if (isShortTimePeriod) {
          return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        } else {
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }
      })
      .filter((_, index) => index % skipInterval === 0);
      
    // Ensure we don't have too many labels
    if (labels.length > maxLabels) {
      const reduceFactor = Math.ceil(labels.length / maxLabels);
      labels = labels.filter((_, index) => index % reduceFactor === 0);
    }
    
    return {
      labels,
      datasets: [
        {
          data: data.map(item => item.bpm),
          color: (opacity = 1) => `rgba(107, 181, 181, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };
  };

  const chartData = formatChartData();

  // Calculate min and max for Y axis
  const bpmValues = data.map(item => item.bpm);
  const minValue = Math.max(0, Math.min(...bpmValues) - 10);
  const maxValue = Math.max(...bpmValues) + 10;

  return (
    <View>
      <LineChart
        data={chartData}
        width={Dimensions.get('window').width - 64}
        height={220}
        yAxisSuffix=" bpm"
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(107, 181, 181, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16
          },
          propsForDots: {
            r: data.length > 100 ? '1' : '3',
            strokeWidth: '1',
            stroke: '#6BB5B5'
          },
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: '#e3e3e3'
          },
          yAxisMin: minValue,
          yAxisMax: maxValue
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