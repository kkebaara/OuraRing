import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Provider as PaperProvider, Button, Card, Appbar, Dialog, Portal, TextInput, Menu, Divider } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import { HR_ZONES, determineHeartRateZone } from './constants/heartRateZones';
import HeartRateHistoryChart from './components/HeartRateHistoryChart';
import { HeartRateData, HeartRateZone } from './types';
import DateTimePicker from '@react-native-community/datetimepicker';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  }),
});

export default function App() {
  const [ouraToken, setOuraToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [currentZone, setCurrentZone] = useState<HeartRateZone | null>(null);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [showSetupDialog, setShowSetupDialog] = useState<boolean>(false);
  const [setupToken, setSetupToken] = useState<string>('');
  const [tokenSaved, setTokenSaved] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [heartRateHistory, setHeartRateHistory] = useState<HeartRateData[]>([]);
  
  // New state variables for historical data
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 86400000)); // Default to 24 hours ago
  const [endDate, setEndDate] = useState<Date>(new Date()); // Default to now
  const [timeRangeMenuVisible, setTimeRangeMenuVisible] = useState<boolean>(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('Last 24 Hours');
  const [heartRateStats, setHeartRateStats] = useState<{avg: number, min: number, max: number}>({avg: 0, min: 0, max: 0});
  const [zoneDistribution, setZoneDistribution] = useState<{zoneName: string, percentage: number, color: string}[]>([]);

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Register for notifications on mount
  useEffect(() => {
    registerForPushNotificationsAsync();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  // Check for stored token on mount and fetch initial data
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('ouraToken');
        if (storedToken) {
          setOuraToken(storedToken);
          setTokenSaved(true);
          // Automatically fetch historical data once token is loaded
          fetchHistoricalData(startDate, endDate);
        } else {
          setShowSetupDialog(true);
        }
      } catch (err) {
        console.error('Failed to load token:', err);
        setError('Failed to load your Oura token. Please set it up again.');
      }
    })();
  }, []);

  const registerForPushNotificationsAsync = async (): Promise<void> => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert('Permission required', 'Push notifications are needed to alert you about heart rate zones.');
      return;
    }
  };

  const saveToken = async (): Promise<void> => {
    if (!setupToken || setupToken.trim() === '') {
      Alert.alert('Invalid Token', 'Please enter a valid Oura API token');
      return;
    }

    try {
      await SecureStore.setItemAsync('ouraToken', setupToken);
      setOuraToken(setupToken);
      setTokenSaved(true);
      setShowSetupDialog(false);
      Alert.alert('Success', 'Oura token has been saved securely!');
      
      // Fetch data immediately after token is saved
      fetchHistoricalData(startDate, endDate);
    } catch (err) {
      console.error('Error saving token:', err);
      Alert.alert('Error', 'Failed to save your token. Please try again.');
    }
  };

  // Function to fetch latest heart rate for monitoring
  const fetchLatestHeartRate = async (): Promise<void> => {
    if (!ouraToken) {
      setError('Oura token is not set. Please set it up first.');
      return;
    }

    try {
      setError(null);
      
      // Fetch the latest heart rate data
      const response = await axios.get('https://api.ouraring.com/v2/usercollection/heartrate', {
        headers: {
          'Authorization': `Bearer ${ouraToken}`,
          'Content-Type': 'application/json',
        },
        params: {
          start_datetime: new Date(Date.now() - 300000).toISOString(), // Last 5 minutes
          end_datetime: new Date().toISOString(),
        }
      });

      // Check if we got any data back
      if (response.data && response.data.data && response.data.data.length > 0) {
        // Sort by timestamp descending to get the most recent
        const sortedData = response.data.data.sort((a: { timestamp: string }, b: { timestamp: string }) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        const latestHR = sortedData[0].bpm;
        setHeartRate(latestHR);
        
        // Determine the zone
        const zone = determineHeartRateZone(latestHR);
        setCurrentZone(zone);
        
        // Send notification if we're monitoring
        if (isMonitoring) {
          await sendHeartRateNotification(latestHR, zone);
        }
      } else {
        console.log('No recent heart rate data available');
        // Don't set error during monitoring to avoid constant error messages
        if (!isMonitoring) {
          setError('No recent heart rate data available from Oura. Make sure your ring is synced and worn correctly.');
        }
      }
    } catch (err: any) {
      console.error('Error fetching heart rate:', err);
      // Only show error if not in monitoring mode
      if (!isMonitoring) {
        setError(`Failed to fetch heart rate data: ${err.message}`);
      }
    }
  };

  // New function to fetch historical heart rate data
  const fetchHistoricalData = async (start: Date, end: Date): Promise<void> => {
    if (!ouraToken) {
      setError('Oura token is not set. Please set it up first.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch historical heart rate data
      const response = await axios.get('https://api.ouraring.com/v2/usercollection/heartrate', {
        headers: {
          'Authorization': `Bearer ${ouraToken}`,
          'Content-Type': 'application/json',
        },
        params: {
          start_datetime: start.toISOString(),
          end_datetime: end.toISOString(),
        }
      });

      // Process the data if we got any back
      if (response.data && response.data.data && response.data.data.length > 0) {
        const hrData = response.data.data;
        
        // Sort by timestamp ascending for the chart
        const sortedData = hrData.sort((a: { timestamp: string }, b: { timestamp: string }) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        setHeartRateHistory(sortedData);
        
        // Calculate statistics
        const bpmValues = sortedData.map((item: HeartRateData) => item.bpm);
        const min = Math.min(...bpmValues);
        const max = Math.max(...bpmValues);
        const avg = Math.round(bpmValues.reduce((sum, val) => sum + val, 0) / bpmValues.length);
        
        setHeartRateStats({
          min,
          max,
          avg
        });
        
        // Set current heart rate to the latest reading
        const latestHR = sortedData[sortedData.length - 1].bpm;
        setHeartRate(latestHR);
        setCurrentZone(determineHeartRateZone(latestHR));
        
        // Calculate zone distribution
        calculateZoneDistribution(bpmValues);
      } else {
        console.log('No heart rate data available for the selected period');
        setError('No heart rate data available for the selected time period. Try a different range or make sure your ring is synced.');
        setHeartRateHistory([]);
        setHeartRateStats({avg: 0, min: 0, max: 0});
        setZoneDistribution([]);
      }
    } catch (err: any) {
      console.error('Error fetching historical heart rate data:', err);
      setError(`Failed to fetch heart rate data: ${err.message}`);
      setHeartRateHistory([]);
      setHeartRateStats({avg: 0, min: 0, max: 0});
      setZoneDistribution([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate the distribution of time spent in each heart rate zone
  const calculateZoneDistribution = (bpmValues: number[]): void => {
    // Count readings in each zone
    const zoneCounts = HR_ZONES.map(zone => ({
      zoneName: zone.name,
      count: 0,
      color: zone.color
    }));
    
    bpmValues.forEach(bpm => {
      const zone = determineHeartRateZone(bpm);
      const zoneIndex = HR_ZONES.findIndex(z => z.name === zone.name);
      if (zoneIndex >= 0) {
        zoneCounts[zoneIndex].count++;
      }
    });
    
    // Calculate percentages
    const total = bpmValues.length;
    const distribution = zoneCounts.map(zone => ({
      zoneName: zone.zoneName,
      percentage: Math.round((zone.count / total) * 100),
      color: zone.color
    }));
    
    setZoneDistribution(distribution);
  };

  const sendHeartRateNotification = async (hr: number, zone: HeartRateZone): Promise<void> => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Heart Rate Zone Update',
        body: `Current HR: ${hr} bpm - You are in the ${zone.name} zone`,
        data: { hr, zone },
      },
      trigger: null, // Send immediately
    });
  };

  const startMonitoring = (): void => {
    // Start polling for heart rate
    if (!pollingInterval.current) {
      fetchLatestHeartRate(); // Initial fetch
      
      // Set up interval to fetch every 30 seconds
      pollingInterval.current = setInterval(() => {
        fetchLatestHeartRate();
      }, 30000); // 30 seconds
      
      setIsMonitoring(true);
      Alert.alert('Monitoring Started', 'You will receive notifications about your heart rate zone while working out.');
    }
  };

  const stopMonitoring = (): void => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
      setIsMonitoring(false);
      Alert.alert('Monitoring Stopped', 'Heart rate zone notifications have been stopped.');
    }
  };

  // Handle date picker changes
  const onDateChange = (event: any, selectedDate?: Date): void => {
    if (selectedDate) {
      if (datePickerMode === 'start') {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    }
    setShowDatePicker(false);
    
    // If both dates are set, fetch data
    if (selectedDate && ((datePickerMode === 'start' && endDate) || (datePickerMode === 'end' && startDate))) {
      const start = datePickerMode === 'start' ? selectedDate : startDate;
      const end = datePickerMode === 'end' ? selectedDate : endDate;
      
      // Ensure start is before end
      if (start < end) {
        fetchHistoricalData(start, end);
      } else {
        Alert.alert('Invalid Date Range', 'Start date must be before end date.');
      }
    }
  };

  // Handle preset time ranges
  const handleTimeRangeSelect = (range: string): void => {
    setTimeRangeMenuVisible(false);
    setSelectedTimeRange(range);
    
    let start = new Date();
    const end = new Date();
    
    switch (range) {
      case 'Last 24 Hours':
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'Last 3 Days':
        start = new Date(end.getTime() - 3 * 24 * 60 * 60 * 1000);
        break;
      case 'Last Week':
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'Last Month':
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        // Custom - don't change the dates
        return;
    }
    
    setStartDate(start);
    setEndDate(end);
    fetchHistoricalData(start, end);
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.Content title="Oura Heart Rate Analysis" />
          <Appbar.Action icon="cog" onPress={() => setShowSetupDialog(true)} />
        </Appbar.Header>

        <View style={styles.content}>
          {tokenSaved ? (
            <>
              <Card style={styles.card}>
                <Card.Title title="Heart Rate Analysis" />
                <Card.Content>
                  <View style={styles.timeRangeSelector}>
                    <Text style={styles.timeRangeLabel}>Time Range:</Text>
                    <Menu
                      visible={timeRangeMenuVisible}
                      onDismiss={() => setTimeRangeMenuVisible(false)}
                      anchor={
                        <Button 
                          mode="outlined" 
                          onPress={() => setTimeRangeMenuVisible(true)}
                          icon="clock-outline"
                        >
                          {selectedTimeRange}
                        </Button>
                      }
                    >
                      <Menu.Item onPress={() => handleTimeRangeSelect('Last 24 Hours')} title="Last 24 Hours" />
                      <Menu.Item onPress={() => handleTimeRangeSelect('Last 3 Days')} title="Last 3 Days" />
                      <Menu.Item onPress={() => handleTimeRangeSelect('Last Week')} title="Last Week" />
                      <Menu.Item onPress={() => handleTimeRangeSelect('Last Month')} title="Last Month" />
                      <Divider />
                      <Menu.Item onPress={() => handleTimeRangeSelect('Custom')} title="Custom Range" />
                    </Menu>
                  </View>
                  
                  {selectedTimeRange === 'Custom' && (
                    <View style={styles.customDateRange}>
                      <Button 
                        mode="outlined" 
                        onPress={() => {
                          setDatePickerMode('start');
                          setShowDatePicker(true);
                        }}
                        icon="calendar"
                        style={styles.dateButton}
                      >
                        {startDate.toLocaleDateString()}
                      </Button>
                      <Text style={styles.toText}>to</Text>
                      <Button 
                        mode="outlined" 
                        onPress={() => {
                          setDatePickerMode('end');
                          setShowDatePicker(true);
                        }}
                        icon="calendar"
                        style={styles.dateButton}
                      >
                        {endDate.toLocaleDateString()}
                      </Button>
                    </View>
                  )}
                  
                  {showDatePicker && (
                    <DateTimePicker
                      value={datePickerMode === 'start' ? startDate : endDate}
                      mode="date"
                      display="default"
                      onChange={onDateChange}
                    />
                  )}

                  {loading ? (
                    <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
                  ) : heartRate ? (
                    <>
                      <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                          <Text style={styles.statLabel}>Average</Text>
                          <Text style={styles.statValue}>{heartRateStats.avg} BPM</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statLabel}>Min</Text>
                          <Text style={styles.statValue}>{heartRateStats.min} BPM</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statLabel}>Max</Text>
                          <Text style={styles.statValue}>{heartRateStats.max} BPM</Text>
                        </View>
                      </View>
                      
                      <Text style={styles.latestHeading}>Latest Reading:</Text>
                      <Text style={styles.heartRate}>{heartRate} BPM</Text>
                      <View style={[styles.zoneIndicator, { backgroundColor: currentZone?.color || '#ccc' }]}>
                        <Text style={styles.zoneText}>
                          {currentZone?.name || 'Unknown'} Zone
                        </Text>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.message}>
                      No heart rate data available for the selected time period.
                    </Text>
                  )}
                  
                  {error && (
                    <Text style={styles.errorText}>{error}</Text>
                  )}
                </Card.Content>
              </Card>

              {heartRateHistory.length > 0 && (
                <>
                  <Card style={styles.card}>
                    <Card.Title title="Heart Rate History" />
                    <Card.Content>
                      <HeartRateHistoryChart data={heartRateHistory} />
                    </Card.Content>
                  </Card>
                  
                  <Card style={styles.card}>
                    <Card.Title title="Zone Distribution" />
                    <Card.Content>
                      {zoneDistribution.map((zone, index) => (
                        <View key={index} style={styles.distributionRow}>
                          <View style={[styles.distributionLabel, { backgroundColor: zone.color + '40' }]}>
                            <Text style={styles.zoneName}>{zone.zoneName}</Text>
                          </View>
                          <View style={styles.distributionBarContainer}>
                            <View 
                              style={[
                                styles.distributionBar, 
                                { 
                                  width: `${zone.percentage}%`,
                                  backgroundColor: zone.color 
                                }
                              ]} 
                            />
                            <Text style={styles.distributionPercentage}>{zone.percentage}%</Text>
                          </View>
                        </View>
                      ))}
                    </Card.Content>
                  </Card>
                </>
              )}

              <Card style={styles.card}>
                <Card.Title title="Workout Monitoring" />
                <Card.Content>
                  <Text style={styles.monitoringText}>
                    {isMonitoring 
                      ? '✓ Monitoring active - you will receive notifications about your heart rate zone' 
                      : 'Start monitoring to receive notifications during your workout'}
                  </Text>
                </Card.Content>
                <Card.Actions>
                  {isMonitoring ? (
                    <Button mode="outlined" onPress={stopMonitoring} color="#B56C6C">
                      Stop Monitoring
                    </Button>
                  ) : (
                    <Button mode="contained" onPress={startMonitoring} color="#6CB56D">
                      Start Monitoring
                    </Button>
                  )}
                </Card.Actions>
              </Card>

              <Card style={styles.card}>
                <Card.Title title="Heart Rate Zones" />
                <Card.Content>
                  <ScrollView>
                    {HR_ZONES.map((zone, index) => (
                      <View key={index} style={[styles.zoneRow, { backgroundColor: zone.color + '40' }]}>
                        <Text style={styles.zoneName}>{zone.name}</Text>
                        <Text style={styles.zoneRange}>
                          {zone.min} - {zone.max === 999 ? '220+' : zone.max} BPM
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </Card.Content>
              </Card>
            </>
          ) : (
            <Card style={styles.card}>
              <Card.Title title="Welcome to Oura HR Analysis" />
              <Card.Content>
                <Text style={styles.welcomeText}>
                  To get started, you need to set up your Oura Ring API token.
                </Text>
                <Button 
                  mode="contained" 
                  onPress={() => setShowSetupDialog(true)}
                  style={styles.setupButton}
                >
                  Set Up Now
                </Button>
              </Card.Content>
            </Card>
          )}
        </View>

        <Portal>
          <Dialog
            visible={showSetupDialog}
            onDismiss={() => setShowSetupDialog(false)}
          >
            <Dialog.Title>Set Up Oura API Token</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.dialogText}>
                Enter your Oura API token to connect to your ring data.
              </Text>
              <TextInput
                label="Oura API Token"
                value={setupToken || ouraToken}
                onChangeText={setSetupToken}
                secureTextEntry
                style={styles.input}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowSetupDialog(false)}>Cancel</Button>
              <Button onPress={saveToken}>Save</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <StatusBar style="auto" />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6BB5B5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeRangeLabel: {
    marginRight: 10,
    fontSize: 16,
  },
  customDateRange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateButton: {
    flex: 1,
  },
  toText: {
    marginHorizontal: 8,
  },
  loader: {
    marginVertical: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  latestHeading: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
  },
  heartRate: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  zoneIndicator: {
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  zoneText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  monitoringText: {
    fontSize: 16,
    marginBottom: 10,
  },
  zoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  zoneName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  zoneRange: {
    fontSize: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  setupButton: {
    marginTop: 10,
  },
  dialogText: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 10,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  distributionLabel: {
    width: 100,
    padding: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  distributionBarContainer: {
    flex: 1,
    height: 30,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  distributionBar: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  distributionPercentage: {
    position: 'absolute',
    right: 8,
    top: 6,
    fontWeight: 'bold',
  },
});