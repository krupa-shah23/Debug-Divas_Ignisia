import React, { useEffect, useState } from 'react';
import { Spin, Alert } from 'antd';
import { MapContainer, TileLayer, GeoJSON, Popup, Marker, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function GeoSimulationMap({ apiResponse }) {
  const [geojsonData, setGeojsonData] = useState(null);
  const [loadingGeo, setLoadingGeo] = useState(true);

  useEffect(() => {
    fetch('/data/zones.geojson')
      .then(res => {
          if (!res.ok) throw new Error("Fallback required");
          return res.json();
      })
      .catch(() => {
          return fetch('/zones.geojson').then(r => r.json());
      })
      .then(data => {
        setGeojsonData(data);
        setLoadingGeo(false);
      })
      .catch(err => {
        console.error('GeoJSON load error:', err);
        setLoadingGeo(false);
      });
  }, []);

  if (loadingGeo) return <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>;
  if (!geojsonData) return <Alert type="warning" description="No map data available. Please ensure zones.geojson exists in public folder." />;

  // Dynamic styling based on impact score or selection
  const styleFeature = (feature) => {
    const zid = feature.properties.zone_id;
    let color = '#fb923c';
    let fillOpacity = 0.5;

    if (apiResponse) {
      const isSelected = apiResponse.selected_zones.includes(zid);
      if (isSelected) {
        color = '#22c55e'; // Green for selected
        fillOpacity = 0.7;
      } else {
        const zdata = apiResponse.zones.find(x => x.zone_id === zid);
        if (zdata && zdata.impact_score > 0.6) {
          color = '#ef4444'; // Red for high impact unselected
        } else if (zdata && zdata.impact_score > 0.4) {
          color = '#f59e0b'; // Orange
        } else {
          color = '#3b82f6'; // Low impact
        }
      }
    }

    return { color: '#ffffff', weight: 1, fillColor: color, fillOpacity };
  };

  const onEachFeature = (feature, layer) => {
    const zid = feature.properties.zone_id;
    
    layer.on({
      click: (e) => {
        // Additional map click if necessary
      }
    });

    if (apiResponse && apiResponse.zones) {
      const zdata = apiResponse.zones.find(x => x.zone_id === zid);
      if (zdata) {
        const isSelected = apiResponse.selected_zones.includes(zid);
        const popupContent = `
          <div style="font-family: inherit;">
            <strong style="font-size: 16px;">Zone ${zid}</strong><br/>
            <b>NDVI:</b> ${zdata.NDVI ? zdata.NDVI.toFixed(2) : 'N/A'}<br/>
            <b>LST:</b> ${zdata.LST ? zdata.LST.toFixed(1) + '°C' : 'N/A'}<br/>
            <b>Impact Score:</b> <span style="color:red">${zdata.impact_score}</span><br/>
            <b>Rank:</b> #${zdata.priority_rank}<br/>
            <b>Water:</b> ${zdata.water_available ? '✅ Available' : '❌ None'}<br/>
            <hr style="margin: 4px 0" />
            <i>${zdata.explanation || ''}</i><br/><br/>
            <b>Status:</b> ${isSelected ? '🌱 SELECTED FOR PLANTING' : 'Unselected'}
          </div>
        `;
        layer.bindPopup(popupContent);
      } else {
          layer.bindPopup(`Zone: ${zid}`);
      }
    } else {
      layer.bindPopup(`Zone: ${zid} (Run simulation for insights)`);
    }
  };

  return (
    <div style={{ height: 500, borderRadius: 12, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
      <MapContainer center={[18.5204, 73.8567]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <GeoJSON 
            data={geojsonData} 
            key={apiResponse ? Math.random() : 'base'} 
            style={styleFeature} 
            onEachFeature={onEachFeature} 
        />
      </MapContainer>
      <div style={{ marginTop: 10 }}>
        <strong>Legend: </strong>
        <span style={{ color: '#22c55e', fontWeight: 'bold', marginRight: 10 }}>■ Selected</span>
        <span style={{ color: '#ef4444', fontWeight: 'bold', marginRight: 10 }}>■ High Impact</span>
        <span style={{ color: '#f59e0b', fontWeight: 'bold', marginRight: 10 }}>■ Med Impact</span>
        <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>■ Low Impact</span>
      </div>
    </div>
  );
}
