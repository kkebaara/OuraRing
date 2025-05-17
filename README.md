# Oura Heart Rate Analysis App

A React Native application that analyzes historical heart rate data from your Oura Ring, providing insights into your heart rate patterns and zones.

## Features

- **Historical Data Analysis**: View and analyze your heart rate data over various time periods
- **Customizable Time Ranges**: Select from preset time ranges or create custom date ranges
- **Statistical Analysis**: See average, minimum, and maximum heart rates for the selected period
- **Heart Rate Zone Analysis**: Visualize time spent in different heart rate zones
- **Real-time Monitoring**: Receive notifications about your current heart rate zone during workouts
- **Secure Token Storage**: Your Oura API token is securely stored on your device

## Screenshots

(Placeholder for screenshots)

## Requirements

- React Native environment set up
- Expo CLI installed
- An Oura Ring and account with API access
- Node.js v14.0 or higher

## Installation

See the [Installation Guide](INSTALLATION.md) for detailed setup instructions.

## Technology Stack

- **React Native**: Core framework
- **Expo**: Development platform
- **TypeScript**: Type-safe code
- **React Native Paper**: UI components
- **React Native Chart Kit**: Data visualization
- **Expo Secure Store**: Secure token storage
- **Expo Notifications**: Real-time alerts
- **Axios**: API communications

## API Usage

This app uses the Oura Ring API to fetch heart rate data. You'll need to obtain your personal API token from the [Oura Developer website](https://cloud.ouraring.com/developer).

The app respects API rate limits and caches data when appropriate to minimize API calls.

## Privacy

This application:
- Stores your Oura API token securely on your device
- Does not send your data to any third-party servers
- Only communicates directly with the official Oura API
- Does not track or collect any usage analytics

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Oura for providing the API to access ring data
- The React Native and Expo communities for their excellent tools and documentation