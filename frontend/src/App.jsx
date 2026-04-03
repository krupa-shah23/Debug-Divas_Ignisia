import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import Navigation from './components/Navigation';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Optimization from './pages/Optimization';
import Explainability from './pages/Explainability';
import Simulation from './pages/Simulation';
import Methodology from './pages/Methodology';
import Architecture from './pages/Architecture';

const { Content } = Layout;

function App() {
  return (
    <BrowserRouter>
      <Layout style={{ minHeight: '100vh', background: 'var(--background)' }}>
        <Navigation />
        <Content style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/optimization" element={<Optimization />} />
            <Route path="/explainability" element={<Explainability />} />
            <Route path="/simulation" element={<Simulation />} />
            <Route path="/methodology" element={<Methodology />} />
            <Route path="/architecture" element={<Architecture />} />
          </Routes>
        </Content>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
