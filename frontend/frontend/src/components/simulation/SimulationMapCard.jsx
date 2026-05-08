import React, { useEffect, useMemo, useState } from 'react';
import { Card, Typography, Button, Modal, message } from 'antd';
import { PlayCircleOutlined, AimOutlined } from '@ant-design/icons';
import { MapContainer, TileLayer, Polygon, CircleMarker, Popup, useMap } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import {
  findFeatureForZone,
  getFeatureBounds,
  getFeatureCenter,
  generatePlantingPoints
} from './geoSimulationUtils';

const { Title } = Typography;

function getColor(zone) {
  if (zone?.selected) return '#22c55e';
  if (Number(zone?.drought_index ?? 0) > 0.7) return '#ef4444';
  if (Number(zone?.drought_index ?? 0) > 0.5) return '#f59e0b';
  return '#3b82f6';
}

function buildZonePopup(zone) {
  if (!zone) return null;

  return (
    <div style={{ minWidth: 220, lineHeight: 1.55 }}>
      <div><strong>Zone:</strong> {zone.zone_id}</div>
      <div><strong>NDVI:</strong> {zone.NDVI != null ? Number(zone.NDVI).toFixed(3) : 'N/A'}</div>
      <div><strong>LST:</strong> {zone.LST != null ? `${Number(zone.LST).toFixed(2)} C` : 'N/A'}</div>
      <div><strong>Score:</strong> {Number(zone.priority_score ?? 0).toFixed(2)}</div>
      <div><strong>Drought:</strong> {Number(zone.drought_index ?? 0).toFixed(2)}</div>
      <div><strong>Trees:</strong> {Number(zone.trees ?? 0)}</div>
      <div style={{ marginTop: 10 }}>
        <strong>Reason:</strong>
        <div>{zone.reason || 'No explanation available'}</div>
      </div>
    </div>
  );
}

function FitBounds({ bounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [bounds, map]);

  return null;
}

export default function SimulationMapCard({
  selectedZone,
  projection,
  geoData,
  usedMockGeo,
  simulated,
  isSimulating,
  timeHorizon,
  onRunSimulation
}) {
  const [showCoordinatesModal, setShowCoordinatesModal] = useState(false);

  const handleCopyCoordinates = async () => {
    if (!plantingPoints.length) {
      message.warning('No coordinates available to copy');
      return;
    }

    const text = plantingPoints
      .map((point, index) => `Tree ${index + 1}: ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      message.success('Coordinates copied!');
    } catch (err) {
      message.error('Failed to copy coordinates');
    }
  };

  const selectedFeature = useMemo(() => {
    if (!geoData || !selectedZone) return null;
    return findFeatureForZone(geoData, selectedZone);
  }, [geoData, selectedZone]);

  const bounds = useMemo(() => {
    return selectedFeature ? getFeatureBounds(selectedFeature) : null;
  }, [selectedFeature]);

  const center = useMemo(() => {
    return selectedFeature ? getFeatureCenter(selectedFeature) : [18.5204, 73.8567];
  }, [selectedFeature]);

  const polygonCoords = useMemo(() => {
    if (!selectedFeature?.geometry) return [];

    const geom = selectedFeature.geometry;

    if (geom.type === 'Polygon') {
      return geom.coordinates[0].map(([lng, lat]) => [lat, lng]);
    }

    if (geom.type === 'MultiPolygon') {
      return geom.coordinates[0][0].map(([lng, lat]) => [lat, lng]);
    }

    return [];
  }, [selectedFeature]);

  const plantingPoints = useMemo(() => {
    if (!simulated || !projection || !selectedFeature) return [];
    return generatePlantingPoints(selectedFeature, projection.candidateSpots || 12);
  }, [simulated, projection, selectedFeature]);

  const zoneColor = useMemo(() => getColor(selectedZone), [selectedZone]);

  return (
    <>
      <Card
        style={{
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          border: '1px solid #f1f5f9',
          height: '100%'
        }}
        bodyStyle={{ padding: 20 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
              ROI Intervention Maps
            </Title>
            <div
              style={{
                display: 'inline-block',
                marginTop: 8,
                fontSize: 12,
                padding: '4px 10px',
                borderRadius: 999,
                background: '#ccfbf1',
                color: '#0f766e'
              }}
            >
              GIS Boundary Bound
            </div>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={onRunSimulation}
            loading={isSimulating}
            style={{
              borderRadius: 999,
              height: 48,
              paddingInline: 24,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              boxShadow: '0 8px 20px rgba(16,185,129,0.22)'
            }}
          >
            Run Simulation
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: simulated ? '1fr 1fr' : '1fr', gap: 20 }}>
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>BEFORE SIMULATION</div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: '#f3f4f6',
                  color: '#111827'
                }}
              >
                Baseline State
              </div>
            </div>

            <div
              style={{
                height: 430,
                borderRadius: 16,
                overflow: 'hidden',
                border: '1px solid #cbd5e1'
              }}
            >
              <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                {bounds && <FitBounds bounds={bounds} />}
                  {polygonCoords.length > 0 && (
                    <Polygon
                      positions={polygonCoords}
                      pathOptions={{
                        color: zoneColor,
                        fillColor: zoneColor,
                        fillOpacity: selectedZone?.selected ? 0.28 : 0.18,
                        weight: selectedZone?.selected ? 4 : 2.5,
                        dashArray: selectedZone?.selected ? '8 5' : undefined
                      }}
                    >
                      <Popup>{buildZonePopup(selectedZone)}</Popup>
                    </Polygon>
                  )}
              </MapContainer>
            </div>
          </div>

          {simulated && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: '#047857' }}>AFTER SIMULATION</div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: '#ecfccb',
                    color: '#65a30d'
                  }}
                >
                  {projection?.candidateSpots ?? 0} Trees Planted
                </div>
              </div>

              <div
                style={{
                  height: 430,
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '2px solid #34d399',
                  position: 'relative'
                }}
              >
                <MapContainer
                  center={center}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  {bounds && <FitBounds bounds={bounds} />}
                  {polygonCoords.length > 0 && (
                    <Polygon
                      positions={polygonCoords}
                      pathOptions={{
                        color: zoneColor,
                        fillColor: zoneColor,
                        fillOpacity: 0.24,
                        weight: 4,
                        dashArray: '8 5'
                      }}
                    >
                      <Popup>{buildZonePopup(selectedZone)}</Popup>
                    </Polygon>
                  )}

                  {plantingPoints.map((point) => (
                    <CircleMarker
                      key={point.id}
                      center={[point.lat, point.lng]}
                      radius={6}
                      pathOptions={{
                        color: '#047857',
                        fillColor: '#10b981',
                        fillOpacity: 0.95,
                        weight: 2
                      }}
                    >
                      <Popup>
                        <div>
                          <strong>Planting Spot</strong>
                          <div>Zone: {selectedZone?.zone_id}</div>
                          <div>Latitude: {point.lat.toFixed(6)}</div>
                          <div>Longitude: {point.lng.toFixed(6)}</div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>

                <button
                  type="button"
                  onClick={() => setShowCoordinatesModal(true)}
                  style={{
                    position: 'absolute',
                    right: 16,
                    bottom: 16,
                    zIndex: 1000,
                    border: 'none',
                    borderRadius: 999,
                    padding: '10px 18px',
                    background: '#10b981',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 8px 20px rgba(16,185,129,0.22)',
                    cursor: 'pointer'
                  }}
                >
                  <AimOutlined />
                  Coordinates
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Modal
        title="Tree Planting Coordinates"
        open={showCoordinatesModal}
        onCancel={() => setShowCoordinatesModal(false)}
        footer={[
          <Button key="copy" type="primary" onClick={handleCopyCoordinates}>
            Copy Coordinates
          </Button>
        ]}
        width={700}
      >
        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          {plantingPoints.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Spot</th>
                  <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Latitude</th>
                  <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Longitude</th>
                </tr>
              </thead>
              <tbody>
                {plantingPoints.map((point, index) => (
                  <tr key={point.id}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>
                      Tree {index + 1}
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                      {point.lat.toFixed(6)}
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                      {point.lng.toFixed(6)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '20px 0', color: '#64748b', fontWeight: 500 }}>
              No planting coordinates available. Run simulation first.
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
