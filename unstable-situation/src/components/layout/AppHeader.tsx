import React from 'react';
import { Layout } from 'antd';

const { Header } = Layout;

const AppHeader: React.FC = () => {
  return (
    <Header className="app-header">
      <div className="header-left">
        <h1 className="app-title">Monitoring System</h1>
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
