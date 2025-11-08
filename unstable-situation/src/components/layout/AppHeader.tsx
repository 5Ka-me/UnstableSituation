import React from 'react';
import { Layout, Button } from 'antd';
import { MenuOutlined } from '@ant-design/icons';

const { Header } = Layout;

interface AppHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ collapsed, onToggleCollapse }) => {
  return (
    <Header className="app-header">
      <div className="header-left">
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={onToggleCollapse}
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
  );
};

export default AppHeader;
