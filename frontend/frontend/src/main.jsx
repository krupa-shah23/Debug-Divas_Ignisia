import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import 'leaflet/dist/leaflet.css';
import { ConfigProvider } from 'antd';   // ✅ added

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider>   {/* ✅ added */}
      <App />
    </ConfigProvider>
  </StrictMode>,
)


