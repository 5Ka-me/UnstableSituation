import React, { useState, useEffect } from 'react';
import { ConfigProvider, Layout } from 'antd';
import AppLayout from './components/layout/AppLayout';
import AppMenu from './components/layout/AppMenu';
import AppHeader from './components/layout/AppHeader';
import Dashboard from './components/Dashboard';
import { signalRService } from './services/signalRService';
import './App.css';

const { Content } = Layout;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [selectedMenuKey, setSelectedMenuKey] = useState<string>('dashboard');

  // Initialize SignalR connection on app start
  useEffect(() => {
    const initializeSignalR = async () => {
      try {
        console.log('Initializing SignalR connection...');
        const connected = await signalRService.connect();
        if (connected) {
          console.log('SignalR initialized successfully');
        } else {
          console.warn('SignalR connection failed, will retry automatically');
        }
      } catch (error) {
        console.error('Error initializing SignalR:', error);
      }
    };

    initializeSignalR();

    // Cleanup on unmount
    return () => {
      signalRService.disconnect();
    };
  }, []);

  const renderContent = () => {
    switch (selectedMenuKey) {
      case 'dashboard':
        return <Dashboard />;
      case 'metrics':
        return <div>Metrics Page (Coming Soon)</div>;
      case 'sensors':
        return <div>Sensors Page (Coming Soon)</div>;
      case 'air-quality':
        return <div>Air Quality Page (Coming Soon)</div>;
      default:
        return <Dashboard />;
    }
  };

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
        <AppLayout collapsed={collapsed} onCollapse={setCollapsed}>
          <AppMenu selectedKey={selectedMenuKey} onSelect={setSelectedMenuKey} />
        </AppLayout>
        
        <Layout>
          <AppHeader collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
          <Content className="app-content">
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
