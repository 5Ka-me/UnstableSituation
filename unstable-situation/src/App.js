import React, { useState } from 'react';
import { Layout, Menu, Button, ConfigProvider } from 'antd';
import { 
  DashboardOutlined, 
  MenuOutlined,
  ThunderboltOutlined,
  CloudOutlined,
  EyeOutlined
} from '@ant-design/icons';
import Dashboard from './components/Dashboard';
import './App.css';

const { Header, Content, Sider } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'metrics',
      icon: <ThunderboltOutlined />,
      label: 'Metrics',
    },
    {
      key: 'sensors',
      icon: <EyeOutlined />,
      label: 'Sensors',
    },
    {
      key: 'air-quality',
      icon: <CloudOutlined />,
      label: 'Air Quality',
    },
  ];

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
        <Sider 
          collapsible 
          collapsed={collapsed} 
          onCollapse={setCollapsed}
          theme="light"
          className="app-sider"
        >
          <div className="logo">
            <ThunderboltOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            {!collapsed && <span className="logo-text">IoT Dashboard</span>}
          </div>
          <Menu
            mode="inline"
            defaultSelectedKeys={['dashboard']}
            items={menuItems}
            className="app-menu"
          />
        </Sider>
        
        <Layout>
          <Header className="app-header">
            <div className="header-left">
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                className="collapse-btn"
              />
              <h1 className="app-title">IoT Sensor Monitoring System</h1>
            </div>
            
            <div className="header-right">
              <div className="connection-status">
                <span className="status-indicator connected"></span>
                <span className="status-text">Connected</span>
              </div>
            </div>
          </Header>
          
          <Content className="app-content">
            <Dashboard />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;