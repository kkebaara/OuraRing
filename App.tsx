import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Provider as PaperProvider, Button, Card, Appbar, Dialog, Portal, TextInput } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import { HR_ZONES, determineHeartRateZone } from './constants/heartRateZones';
import HeartRateHistoryChart from './components/HeartRateHistoryChart';
import { HeartRateData, HeartRateZone } from './types';

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

  // Check for stored token on mount
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('ouraToken');
        if (storedToken) {
          setOuraToken(storedToken);
          setTokenSaved(true);
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
    } catch (err) {
      console.error('Error saving token:', err);
      Alert.alert('Error', 'Failed to save your token. Please try again.');
    }
  };

  const fetchHeartRate = async (): Promise<void> => {
    if (!ouraToken) {
      setError('Oura token is not set. Please set it up first.');
      return;
    }

    try {
      setLoading(true);
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
        
        // Update history data - keep the last 10 readings
        setHeartRateHistory(prevHistory => {
          const newHistory = [...prevHistory, sortedData[0]];
          return newHistory.slice(-10); // Keep only the most recent 10 readings
        });
        
        // Determine the zone
        const zone = determineHeartRateZone(latestHR);
        setCurrentZone(zone);
        
        // Send notification if we're monitoring
        if (isMonitoring) {
          await sendHeartRateNotification(latestHR, zone);
        }
      } else {
        console.log('No recent heart rate data available');
        setError('No recent heart rate data available from Oura. Make sure your ring is synced and worn correctly.');
      }
    } catch (err: any) {
      console.error('Error fetching heart rate:', err);
      setError(`Failed to fetch heart rate data: ${err.message}`);
    } finally {
      setLoading(false);
    }
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
      fetchHeartRate(); // Initial fetch
      
      // Set up interval to fetch every 30 seconds
      pollingInterval.current = setInterval(() => {
        fetchHeartRate();
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

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.Content title="Oura Heart Rate Zones" />
          <Appbar.Action icon="cog" onPress={() => setShowSetupDialog(true)} />
        </Appbar.Header>

        <View style={styles.content}>
          {tokenSaved ? (
            <>
              <Card style={styles.card}>
                <Card.Title title="Current Heart Rate" />
                <Card.Content>
                  {loading ? (
                    <ActivityIndicator size="large" color="#0000ff" />
                  ) : heartRate ? (
                    <>
                      <Text style={styles.heartRate}>{heartRate} BPM</Text>
                      <View style={[styles.zoneIndicator, { backgroundColor: currentZone?.color || '#ccc' }]}>
                        <Text style={styles.zoneText}>
                          {currentZone?.name || 'Unknown'} Zone
                        </Text>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.message}>
                      Tap "Check Now" to get your current heart rate
                    </Text>
                  )}
                  
                  {error && (
                    <Text style={styles.errorText}>{error}</Text>
                  )}
                </Card.Content>
                <Card.Actions>
                  <Button mode="contained" onPress={fetchHeartRate} disabled={loading}>
                    Check Now
                  </Button>
                </Card.Actions>
              </Card>

              {heartRateHistory.length > 0 && (
                <Card style={styles.card}>
                  <Card.Title title="Heart Rate History" />
                  <Card.Content>
                    <HeartRateHistoryChart data={heartRateHistory} />
                  </Card.Content>
                </Card>
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
              <Card.Title title="Welcome to Oura HR Zones" />
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
});