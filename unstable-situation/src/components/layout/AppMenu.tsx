import React from 'react';
import { Menu } from 'antd';
import { 
  DashboardOutlined, 
  ThunderboltOutlined,
  CloudOutlined,
  EyeOutlined
} from '@ant-design/icons';

interface AppMenuProps {
  selectedKey?: string;
  onSelect?: (key: string) => void;
}

const AppMenu: React.FC<AppMenuProps> = ({ selectedKey = 'dashboard', onSelect }) => {
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
    <Menu
      mode="inline"
      selectedKeys={[selectedKey]}
      items={menuItems}
      className="app-menu"
      onClick={({ key }) => onSelect?.(key)}
    />
  );
};

export default AppMenu;
