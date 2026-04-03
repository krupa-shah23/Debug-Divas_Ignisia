import React from 'react';
import { Menu, Layout } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeOutlined, 
  DashboardOutlined, 
  TableOutlined, 
  ExperimentOutlined, 
  BulbOutlined, 
  LineChartOutlined, 
  ReadOutlined,
  BlockOutlined
} from '@ant-design/icons';

const { Header } = Layout;

export default function Navigation() {
  const location = useLocation();
  
  const items = [
    { key: '/', icon: <HomeOutlined />, label: <Link to="/">Home</Link> },
    { key: '/dashboard', icon: <DashboardOutlined />, label: <Link to="/dashboard">Dashboard</Link> },
    { key: '/analytics', icon: <TableOutlined />, label: <Link to="/analytics">Analytics</Link> },
    { key: '/optimization', icon: <ExperimentOutlined />, label: <Link to="/optimization">Optimization</Link> },
    { key: '/simulation', icon: <LineChartOutlined />, label: <Link to="/simulation">Simulation</Link> },

    // ✅ ADDED CORRECTLY INSIDE items
    { key: '/human-impact', icon: <BulbOutlined />, label: <Link to="/human-impact">Human Impact</Link> }
  ];

  return (
    <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
      <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem', marginRight: '40px' }}>
        🌲 Tree Planner
      </div>
      <Menu 
        mode="horizontal" 
        selectedKeys={[location.pathname]} 
        items={items} 
        style={{ flex: 1, minWidth: 0 }}
      />
    </Header>
  );
}