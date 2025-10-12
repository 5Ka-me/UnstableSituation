# IoT Sensor Dashboard Frontend

A React-based frontend application for monitoring IoT sensor data with real-time updates, metrics, and visualizations.

## Features

### 📊 Dashboard
- **Real-time Metrics**: Total readings, average energy consumption, CO₂ levels, and motion detection
- **Interactive Charts**: Time series charts for energy and air quality data
- **Data Distribution**: Bar charts showing readings by sensor type and location
- **Pie Charts**: Visual overview of sensor type distribution
- **Latest Readings**: Real-time list of recent sensor data

### 🔔 Notifications
- **Real-time Alerts**: System notifications via SignalR
- **Notification Management**: Mark as read, remove notifications
- **Unread Counter**: Badge showing number of unread notifications
- **Drawer Interface**: Slide-out notifications panel

### 📱 Responsive Design
- **Mobile-First**: Optimized for all screen sizes
- **Collapsible Sidebar**: Space-efficient navigation
- **Touch-Friendly**: Mobile-optimized interactions

### ⚡ Real-time Features
- **SignalR Integration**: Live data updates
- **Connection Status**: Visual indicator of real-time connection
- **Auto-refresh**: Automatic data updates every 5 seconds

## Technology Stack

- **React 19.2.0**: Modern React with hooks
- **Ant Design 5.12.8**: UI component library
- **Recharts 2.8.0**: Chart library for data visualization
- **SignalR**: Real-time communication
- **Axios**: HTTP client for API calls
- **Date-fns**: Date manipulation utilities

## Project Structure

```
src/
├── components/
│   ├── Dashboard.js          # Main dashboard component
│   ├── Dashboard.css         # Dashboard styles
│   ├── Notifications.js      # Notifications component
│   └── Notifications.css     # Notifications styles
├── services/
│   ├── mockApiService.js     # Mock API service
│   └── signalRService.js     # SignalR service
├── App.js                    # Main app component
├── App.css                   # App styles
└── index.js                  # App entry point
```

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd unstable-situation
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view the app

### Available Scripts

- `npm start`: Runs the app in development mode
- `npm build`: Builds the app for production
- `npm test`: Launches the test runner
- `npm eject`: Ejects from Create React App

## Features Overview

### Dashboard Components

#### Metrics Cards
- **Total Readings**: Count of all sensor readings
- **Average Energy**: Average energy consumption in watts
- **Average CO₂**: Average CO₂ levels in ppm
- **Motion Detected**: Count of motion detection events

#### Charts
- **Time Series**: Energy consumption and air quality over time
- **Distribution**: Readings by sensor type and location
- **Overview**: Pie charts and latest readings list

#### Controls
- **Location Filter**: Filter data by specific locations
- **Time Range**: Select different time periods (1h, 24h, 7d, 30d)

### Real-time Updates

The application uses SignalR for real-time communication:

- **Sensor Data Updates**: New sensor readings appear automatically
- **Metrics Updates**: Dashboard metrics refresh in real-time
- **Notifications**: System alerts and notifications
- **Connection Status**: Visual indicator of connection state

### Mock Data

Currently using mock data that simulates:
- Energy consumption sensors
- Air quality sensors (CO₂, PM2.5, humidity)
- Motion detection sensors
- Various locations (Office, Living Room, Kitchen, etc.)

## Integration Points

### GraphQL API
The app is designed to integrate with a GraphQL API gateway:
- Endpoint: `http://localhost:5000` (GraphQL Gateway)
- Queries for sensor readings, metrics, and aggregated data
- Real-time subscriptions for live updates

### SignalR Hub
Real-time communication via SignalR:
- Hub URL: `http://localhost:5000/notificationsHub`
- Methods: `SendSensorUpdate`, `SendMetricsUpdate`, `SendNotification`

### Microservices Architecture
The frontend integrates with:
- **Data Ingestor**: Fetches data from external API
- **Data Processor**: Processes and stores sensor data
- **GraphQL Gateway**: Provides API access to data
- **Notification Service**: Sends real-time updates

## Customization

### Themes
The app uses Ant Design's theming system:
- Primary color: `#1890ff`
- Border radius: `6px`
- Customizable via ConfigProvider

### Charts
Charts are built with Recharts and can be customized:
- Colors: Configurable color palette
- Data sources: Easy to modify data structure
- Chart types: Line, Bar, Pie charts available

### Styling
- CSS modules for component-specific styles
- Responsive design with mobile-first approach
- Custom scrollbars and animations

## Future Enhancements

- [ ] GraphQL integration with Apollo Client
- [ ] Real SignalR hub connection
- [ ] Advanced filtering and search
- [ ] Export functionality
- [ ] User authentication
- [ ] Dark mode theme
- [ ] PWA capabilities
- [ ] Unit and integration tests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the IoT Sensor Monitoring System microservices architecture.