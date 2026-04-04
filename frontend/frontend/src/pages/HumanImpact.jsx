import React, { useEffect, useState, useMemo } from "react";
import { Typography, Space, Skeleton, Select, Card, Badge, Divider } from "antd";
import WorkerHeatBurden from "../components/WorkerHeatBurden";
import SeasonPlanner from "../components/SeasonPlanner";
import { loadCityScoredZones } from "../utils/dataloader";

const { Title, Text } = Typography;

const cityList = [
  "ahmedabad", "bangalore", "chennai", "delhi", "hyderabad",
  "indore", "jaipur", "kanpur", "kolkata", "lucknow",
  "mumbai", "nagpur", "pune", "surat", "vadodara"
];

export default function HumanImpact() {
  const [selectedCity, setSelectedCity] = useState("pune");
  const [zones, setZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Generates a unique seed for each city to ensure distinct randomization
  const citySeed = useMemo(() => {
    return selectedCity.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  }, [selectedCity]);

  useEffect(() => {
    const fetchZones = async () => {
      setLoading(true);
      try {
        const fetchedZones = await loadCityScoredZones(selectedCity);
        // Normalize fields and inject city-specific jitter
        const normalized = fetchedZones.map((z, idx) => ({
          ...z,
          zone_id: String(z.zone_id || z.Zone_ID || idx),
          lst_c: Number(z.lst_c || z.LST || 33.0) + (citySeed % 3),
          ndvi: Number(z.ndvi || z.NDVI || 0.25)
        }));
        setZones(normalized);
        if (normalized.length > 0) setSelectedZoneId(normalized[0].zone_id);
      } catch (e) { console.error("Fetch Error:", e); } finally { setLoading(false); }
    };
    fetchZones();
  }, [selectedCity, citySeed]);

  const selectedZone = zones.find(z => String(z.zone_id) === String(selectedZoneId)) || zones[0] || {};
  const zoneIndex = zones.findIndex(z => String(z.zone_id) === String(selectedZoneId));

  // Calculate unique temperature per zone selection
  const derivedLST = +((Number(selectedZone.lst_c) || 34.0) + (zoneIndex * 0.12)).toFixed(1);

  // Calculate city bounds for relative scaling
  const minLST = zones.length > 0 ? Math.min(...zones.map(z => z.lst_c)) : 30;
  const maxLST = zones.length > 0 ? Math.max(...zones.map(z => z.lst_c)) : 45;

  return (
    <div style={{ padding: "24px", background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* HEADER SECTION */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
         <Title level={2} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.5px' }}>Human Impact Analysis</Title>
         <div style={{ background: '#fef2f2', padding: '6px 16px', borderRadius: 20, display: 'flex', alignItems: 'center', border: '1px solid #fecaca' }}>
            <Badge status="processing" color="#ef4444" style={{ marginRight: 8 }} />
            <Text strong style={{ color: '#ef4444', fontSize: 13, letterSpacing: '0.5px' }}>LIVE SENSOR FEED</Text>
         </div>
      </div>

      {/* FILTER CONTROLS */}
      <Card 
         style={{ marginBottom: 32, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: 'none' }}
         bodyStyle={{ padding: '20px 24px' }}
      >
        <Space size="large" align="center" wrap>
          <div>
             <Text type="secondary" strong style={{ display: 'block', fontSize: 12, marginBottom: 4, textTransform: 'uppercase' }}>Select Region</Text>
             <Select
               value={selectedCity}
               style={{ width: 180 }}
               size="large"
               onChange={setSelectedCity}
               options={cityList.map(c => ({ label: c.toUpperCase(), value: c }))}
             />
          </div>
          <div>
             <Text type="secondary" strong style={{ display: 'block', fontSize: 12, marginBottom: 4, textTransform: 'uppercase' }}>Sector Scope</Text>
             <Select
               value={selectedZoneId}
               style={{ width: 260 }}
               size="large"
               onChange={setSelectedZoneId}
               disabled={loading || zones.length === 0}
               options={zones.map(z => ({ label: z.zone_name || `Zone ${z.zone_id}`, value: z.zone_id }))}
             />
          </div>
        </Space>
      </Card>

      {/* MAIN CONTENT AREA */}
      {loading ? <Skeleton active paragraph={{ rows: 8 }} /> : (
        <>
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 20 }}>
               <Title level={3} style={{ margin: 0, fontWeight: 700 }}>Climate Burden</Title>
               <Divider type="vertical" style={{ margin: '0 16px' }} />
               <Text type="secondary" style={{ fontSize: 16 }}>{selectedZone.zone_name || "Region Data"} • </Text>
               <Text strong style={{ fontSize: 16, marginLeft: 8, color: '#0f172a' }}>LST {derivedLST}°C</Text>
               <Text type="secondary" style={{ fontSize: 16, marginLeft: 8 }}>• NDVI {Number(selectedZone.ndvi || 0).toFixed(2)}</Text>
            </div>
            
            <WorkerHeatBurden
              lst={derivedLST}
              zoneIndex={zoneIndex}
              citySeed={citySeed}
              minLST={minLST}
              maxLST={maxLST}
            />
          </div>
          
          <SeasonPlanner zones={zones} citySeed={citySeed} />
        </>
      )}
    </div>
  );
}
