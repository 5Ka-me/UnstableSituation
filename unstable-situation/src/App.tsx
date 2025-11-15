import React, { useEffect } from 'react';
import { ConfigProvider, Layout } from 'antd';
import AppHeader from './components/layout/AppHeader';
import Dashboard from './components/Dashboard';
import { signalRService } from './services/signalRService';
import './App.css';

const { Content } = Layout;

const App: React.FC = () => {
  // Initialize SignalR connection on app start
  useEffect(() => {
    const initializeSignalR = async () => {
      try {
        const connected = await signalRService.connect();
        if (!connected) {
          // Connection failed, will retry automatically
        }
      } catch (error) {
        // Error during initialization
      }
    };

    initializeSignalR();

    // Cleanup on unmount
    return () => {
      signalRService.disconnect();
    };
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Layout>
          <AppHeader />
          <Content className="app-content">
            <Dashboard />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
