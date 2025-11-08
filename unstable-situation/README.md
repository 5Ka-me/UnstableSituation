# IoT Sensor Dashboard Frontend

A React-based web application for monitoring IoT sensor data with real-time updates and visualizations.

## Overview

The frontend provides an interactive dashboard for visualizing sensor data, including energy consumption, air quality metrics, and motion detection. It receives real-time updates via SignalR and displays notifications.

## Features

- Real-time dashboard with metrics cards
- Interactive time-series charts
- Data distribution visualizations
- Real-time notifications panel
- Automatic data refresh (every 5 seconds)
- Responsive design

## Technology

- React 19.2.0
- TypeScript
- Ant Design
- Recharts
- Apollo Client (GraphQL)
- SignalR

## Running

```bash
# Local development
npm start

# Production build
npm run build

# Docker
docker-compose up frontend
```

## Features

- **Dashboard**: Metrics cards, charts, and sensor readings list
- **Notifications**: Real-time alerts and notification management
- **Charts**: Time-series, distribution, and overview visualizations
- **Real-time Updates**: SignalR integration for live data

## Configuration

The frontend connects to:
- GraphQL Gateway: `http://localhost:5284/graphql`
- SignalR Hub: `http://localhost:5284/notificationsHub`
