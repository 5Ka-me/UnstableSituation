import React from 'react';
import { Layout } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';

const { Sider } = Layout;

interface AppLayoutProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ collapsed, onCollapse, children }) => {
  return (
    <Sider 
      collapsible 
      collapsed={collapsed} 
      onCollapse={onCollapse}
      theme="light"
      className="app-sider"
    >
      <div className="logo">
        <ThunderboltOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
        {!collapsed && <span className="logo-text">IoT Dashboard</span>}
      </div>
      {children}
    </Sider>
  );
};

export default AppLayout;
