// import React, { useState, useEffect } from 'react';
// import { Row, Col, Card, Slider, Radio, Typography, Spin, Badge, Tag, Statistic } from 'antd';
// import { MapContainer, TileLayer, GeoJSON, Tooltip } from 'react-leaflet';
// import axios from 'axios';

// const { Title, Text } = Typography;

// export default function Dashboard() {
//   const [geoData, setGeoData] = useState(null);
//   const [zoneData, setZoneData] = useState({});
//   const [layer, setLayer] = useState("Impact Score");
//   const [budget, setBudget] = useState(100);
//   const [method, setMethod] = useState("knapsack");
//   const [loading, setLoading] = useState(false);
//   const [results, setResults] = useState(null);

//   useEffect(() => {
//     fetch('/zones.geojson')
//       .then(r => r.json())
//       .then(data => setGeoData(data));
//   }, []);

//   const runOptimization = async () => {
//     setLoading(true);
//     try {
//       const res = await axios.post('http://localhost:8000/api/optimize', { budget, method });
//       const tData = {};
//       res.data.zones.forEach(z => {
//         tData[z.zone_id] = z;
//       });
//       setZoneData(tData);
//       setResults(res.data);
//     } catch(e) {
//       console.error(e);
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     runOptimization();
//   }, [budget, method]);

//   const getColor = (props) => {
//     const zid = props.zone_id;
//     const isSel = results?.selected?.includes(zid);
//     if (isSel) return "#2b83ba"; // Blue for selected zones

//     const d = zoneData[zid] || {};
//     if (layer === "Impact Score") {
//       const v = d.impact_score || 0;
//       return v > 0.7 ? "#d73027" : v > 0.5 ? "#fc8d59" : v > 0.3 ? "#fee090" : "#91cf60";
//     } else if (layer === "NDVI") {
//       const v = d.NDVI || 0.3;
//       return v < 0.15 ? "#d73027" : v < 0.25 ? "#fc8d59" : v < 0.35 ? "#fee090" : "#1a9850";
//     } else {
//       const v = d.LST || 38;
//       return v > 45 ? "#d73027" : v > 42 ? "#fc8d59" : v > 39 ? "#fee090" : "#91cf60";
//     }
//   };

//   const styleGeoJson = (feature) => {
//     const isSel = results?.selected?.includes(feature.properties.zone_id);
//     return {
//       fillColor: getColor(feature.properties),
//       color: isSel ? "#000" : "#555",
//       weight: isSel ? 3 : 1,
//       fillOpacity: isSel ? 0.7 : 0.6
//     };
//   };

//   return (
//     <Row gutter={24}>
//       <Col xs={24} lg={16}>
//         <div className="eco-card" style={{ padding: 0, overflow: 'hidden', height: '600px', position: 'relative' }}>
//           {geoData ? (
//              <MapContainer center={[18.515, 73.865]} zoom={13} style={{ height: '100%', width: '100%' }}>
//                 <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
//                 <GeoJSON 
//                   key={`${layer}-${results?.trees_used}`}
//                   data={geoData} 
//                   style={styleGeoJson}
//                   onEachFeature={(feature, layer) => {
//                     const zd = zoneData[feature.properties.zone_id] || {};
//                     const isSel = results?.selected?.includes(feature.properties.zone_id);
//                     const tooltipContent = `
//                       <div style="font-family:Inter">
//                         <strong>Zone ${feature.properties.zone_id}</strong><br/>
//                         NDVI: ${zd.NDVI || 'N/A'} | LST: ${zd.LST || 'N/A'}°C<br/>
//                         Impact Score: <b>${zd.impact_score || 'N/A'}</b><br/>
//                         Rank: #${zd.priority_rank || 'N/A'}<br/>
//                         Water: ${zd.water_available ? '✅ Active' : '❌ Low'}<br/>
//                         <b>Selected: ${isSel ? '✅ YES' : '❌ NO'}</b><br/>
//                         <i style="font-size:0.85em">${zd.explanation || ''}</i>
//                       </div>
//                     `;
//                     layer.bindTooltip(tooltipContent);
//                   }}
//                 />
//              </MapContainer>
//           ) : <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}><Spin /></div>}
//         </div>
//       </Col>
//       <Col xs={24} lg={8}>
//         <Card className="eco-card" title="Control Panel">
//           <div style={{ marginBottom: 20 }}>
//             <Text strong>Map Layer</Text><br/>
//             <Radio.Group value={layer} onChange={e => setLayer(e.target.value)} style={{ marginTop: 8 }}>
//               <Radio.Button value="Impact Score">Impact Score</Radio.Button>
//               <Radio.Button value="NDVI">NDVI</Radio.Button>
//               <Radio.Button value="LST">LST</Radio.Button>
//             </Radio.Group>
//           </div>

//           <div style={{ marginBottom: 20 }}>
//             <Text strong>Tree Budget: {budget}</Text>
//             <Slider min={20} max={200} step={10} value={budget} onChange={setBudget} />
//           </div>

//           <div style={{ marginBottom: 30 }}>
//             <Text strong>Optimization Profile</Text><br/>
//             <Radio.Group value={method} onChange={e => setMethod(e.target.value)} style={{ marginTop: 8 }}>
//               <Radio.Button value="knapsack">Knapsack (AI)</Radio.Button>
//               <Radio.Button value="greedy">Greedy</Radio.Button>
//             </Radio.Group>
//           </div>

//           <Spin spinning={loading}>
//             {results && (
//               <Card size="small" style={{ background: '#f6fff8', borderColor: 'var(--accent)' }}>
//                 <Row gutter={16}>
//                   <Col span={12}>
//                     <Statistic title="Trees Used" value={results.trees_used} />
//                   </Col>
//                   <Col span={12}>
//                     <Statistic title="Zones Selected" value={results.selected.length} />
//                   </Col>
//                 </Row>
//                 <div style={{ marginTop: 15 }}>
//                   <Text strong>Priority Targets:</Text>
//                   <div style={{ marginTop: 8 }}>
//                     {results.selected.map(s => (
//                       <Tag color="green" key={s} style={{ marginBottom: 5 }}>{s}</Tag>
//                     ))}
//                   </div>
//                 </div>
//               </Card>
//             )}
//           </Spin>
//         </Card>
//       </Col>
//     </Row>
//   );
// }

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Slider, Radio, Typography, Spin, Tag, Statistic, Button, Divider, message } from 'antd';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import axios from 'axios';


const { Title, Text, Paragraph } = Typography;


export default function Dashboard() {
  const [geoData, setGeoData] = useState(null);
  const [zoneData, setZoneData] = useState({});
  const [layer, setLayer] = useState("Impact Score");
  const [budget, setBudget] = useState(100);
  const [method, setMethod] = useState("knapsack");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);


  // NEW STATES
  const [selectedZone, setSelectedZone] = useState(null);
  const [planZones, setPlanZones] = useState([]);
  const [compareZones, setCompareZones] = useState([]);


  useEffect(() => {
    fetch('/zones.geojson')
      .then(r => r.json())
      .then(data => setGeoData(data));
  }, []);


  const runOptimization = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/api/optimize', { budget, method });
      const tData = {};
      res.data.zones.forEach(z => {
        tData[z.zone_id] = z;
      });
      setZoneData(tData);
      setResults(res.data);
    } catch (e) {
      console.error(e);
      message.error("Failed to fetch optimization results.");
    }
    setLoading(false);
  };


  useEffect(() => {
    runOptimization();
  }, [budget, method]);


  const getColor = (props) => {
    const zid = props.zone_id;
    const isSel = results?.selected?.includes(zid);


    if (isSel) return "#2b83ba"; // blue for selected by optimizer


    const d = zoneData[zid] || {};


    if (layer === "Impact Score") {
      const v = d.impact_score || 0;
      return v > 0.7 ? "#d73027" : v > 0.5 ? "#fc8d59" : v > 0.3 ? "#fee090" : "#91cf60";
    } else if (layer === "NDVI") {
      const v = d.NDVI || 0.3;
      return v < 0.15 ? "#d73027" : v < 0.25 ? "#fc8d59" : v < 0.35 ? "#fee090" : "#1a9850";
    } else {
      const v = d.LST || 38;
      return v > 45 ? "#d73027" : v > 42 ? "#fc8d59" : v > 39 ? "#fee090" : "#91cf60";
    }
  };


  const styleGeoJson = (feature) => {
    const zoneId = feature.properties.zone_id;
    const isOptimizerSelected = results?.selected?.includes(zoneId);
    const isUserSelected = selectedZone?.zone_id === zoneId;


    return {
      fillColor: getColor(feature.properties),
      color: isUserSelected ? "#111827" : isOptimizerSelected ? "#000" : "#555",
      weight: isUserSelected ? 4 : isOptimizerSelected ? 3 : 1,
      fillOpacity: isUserSelected ? 0.85 : isOptimizerSelected ? 0.7 : 0.6
    };
  };


  // CLICKED ZONE → DETAIL PANEL
  const handleZoneClick = (feature) => {
    const zid = feature.properties.zone_id;
    const zd = zoneData[zid] || {};


    const zone = {
      zone_id: zid,
      zone_name: feature.properties.zone_name || `Zone ${zid}`,
      priority: zd.priority_rank ? `#${zd.priority_rank}` : "Unranked",
      impact_score: zd.impact_score ?? "N/A",
      tree_canopy_pct: zd.tree_coverage_ratio
        ? Math.round(zd.tree_coverage_ratio * 100)
        : "N/A",

      vulnerability_index: zd.vulnerability ?? "N/A",
      ndvi: zd.NDVI ?? "N/A",
      lst_c: zd.LST ?? "N/A",
      water_access: zd.water_available ?? false,
      top_drivers: [
        (zd.NDVI !== undefined && zd.NDVI < 0.25) ? "Low canopy cover" : "Moderate canopy",
        (zd.LST !== undefined && zd.LST > 40) ? "Heat hotspot" : "Moderate heat",
        zd.water_available ? "Feasible for irrigation" : "Water constraint"
      ],
      why_selected: zd.explanation || "This zone is being evaluated based on canopy deficit, heat stress, and feasibility constraints.",
      recommended_trees: zd.trees_needed ?? Math.max(10, Math.round(budget / 10)),
      estimated_cooling_c: zd.estimated_cooling_c ?? (zd.trees_needed || 10) * 0.03,
      estimated_canopy_gain_pct: zd.estimated_canopy_gain_pct ?? 4,
      feasibility: zd.water_available ? "High" : "Blocked"
    };


    setSelectedZone(zone);
  };


  // ADD TO PLAN
  const handleAddToPlan = () => {
    if (!selectedZone) return;


    if (!selectedZone.water_access) {
      message.warning("This zone is blocked due to lack of water access.");
      return;
    }


    if (planZones.find((z) => z.zone_id === selectedZone.zone_id)) {
      message.info("This zone is already in your plan.");
      return;
    }


    const totalTrees = planZones.reduce((sum, z) => sum + (z.recommended_trees || 0), 0);


    if (totalTrees + (selectedZone.recommended_trees || 0) > budget) {
      message.error("Adding this zone exceeds the current tree budget.");
      return;
    }


    setPlanZones((prev) => [...prev, selectedZone]);
    message.success(`${selectedZone.zone_name} added to intervention plan.`);
  };


  // REMOVE FROM PLAN
  const handleRemoveZone = (zoneId) => {
    setPlanZones((prev) => prev.filter((z) => z.zone_id !== zoneId));
  };


  // COMPARE
  const handleCompare = () => {
    if (!selectedZone) return;


    if (compareZones.find((z) => z.zone_id === selectedZone.zone_id)) {
      message.info("This zone is already selected for comparison.");
      return;
    }


    if (compareZones.length >= 2) {
      message.warning("You can compare up to 2 zones only.");
      return;
    }


    setCompareZones((prev) => [...prev, selectedZone]);
    message.success(`${selectedZone.zone_name} added to compare list.`);
  };


  const totalPlanTrees = planZones.reduce((sum, z) => sum + (z.recommended_trees || 0), 0);
  const remainingBudget = budget - totalPlanTrees;
  const totalCooling = planZones.reduce((sum, z) => sum + (z.estimated_cooling_c || 0), 0);

  const betterZone = compareZones.length === 2
    ? [...compareZones].sort((a, b) => b.impact_score - a.impact_score)[0]
    : null;

  useEffect(() => {
    localStorage.setItem("planZones", JSON.stringify(planZones));
  }, [planZones]);

  useEffect(() => {
    const saved = localStorage.getItem("planZones");
    if (saved) setPlanZones(JSON.parse(saved));
  }, []);

  return (
    <Row gutter={24}>
      {/* MAP */}
      <Col xs={24} lg={14}>
        <div
          className="eco-card"
          style={{ padding: 0, overflow: 'hidden', height: '650px', position: 'relative', borderRadius: '20px' }}
        >
          {geoData ? (
            <MapContainer center={[18.515, 73.865]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
              <GeoJSON
                key={`${layer}-${results?.trees_used}-${selectedZone?.zone_id || "none"}`}
                data={geoData}
                style={styleGeoJson}
                onEachFeature={(feature, layerInstance) => {
                  const zd = zoneData[feature.properties.zone_id] || {};
                  const isSel = results?.selected?.includes(feature.properties.zone_id);


                  const tooltipContent = `
                    <div style="font-family:Inter">
                      <strong>${feature.properties.zone_name || `Zone ${feature.properties.zone_id}`}</strong><br/>
                      NDVI: ${zd.NDVI ?? 'N/A'} | LST: ${zd.LST ?? 'N/A'}°C<br/>
                      Impact Score: <b>${zd.impact_score ?? 'N/A'}</b><br/>
                      Rank: #${zd.priority_rank ?? 'N/A'}<br/>
                      Water: ${zd.water_available ? '✅ Active' : '❌ Low'}<br/>
                      <b>Optimizer Selected: ${isSel ? '✅ YES' : '❌ NO'}</b><br/>
                      <i style="font-size:0.85em">${zd.explanation || ''}</i><br/>
                      <span style="color:#2563eb;font-weight:600">Click for full details</span>
                    </div>
                  `;


                  layerInstance.bindTooltip(tooltipContent);
                  layerInstance.on({
                    click: () => handleZoneClick(feature)
                  });
                }}
              />
            </MapContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Spin />
            </div>
          )}
        </div>
      </Col>



      {/* RIGHT PANEL */}
      <Col xs={24} lg={10}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>


          {/* CONTROL PANEL */}
          <Card className="eco-card" title="Control Panel">
            <div style={{ marginBottom: 20 }}>
              <Text strong>Map Layer</Text><br />
              <Radio.Group value={layer} onChange={e => setLayer(e.target.value)} style={{ marginTop: 8 }}>
                <Radio.Button value="Impact Score">Impact Score</Radio.Button>
                <Radio.Button value="NDVI">NDVI</Radio.Button>
                <Radio.Button value="LST">LST</Radio.Button>
              </Radio.Group>
            </div>


            <div style={{ marginBottom: 20 }}>
              <Text strong>Tree Budget: {budget}</Text>
              <Slider min={20} max={200} step={10} value={budget} onChange={setBudget} />
            </div>


            <div style={{ marginBottom: 20 }}>
              <Text strong>Optimization Profile</Text><br />
              <Radio.Group value={method} onChange={e => setMethod(e.target.value)} style={{ marginTop: 8 }}>
                <Radio.Button value="knapsack">Knapsack (AI)</Radio.Button>
                <Radio.Button value="greedy">Greedy</Radio.Button>
              </Radio.Group>
            </div>


            <Spin spinning={loading}>
              {results && (
                <Card size="small" style={{ background: '#f6fff8', borderColor: '#52c41a' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic title="Trees Used" value={results.trees_used} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Zones Selected" value={results.selected.length} />
                    </Col>
                  </Row>
                  <div style={{ marginTop: 15 }}>
                    <Text strong>Priority Targets:</Text>
                    <div style={{ marginTop: 8 }}>
                      {results.selected.map(s => (
                        <Tag color="green" key={s} style={{ marginBottom: 5 }}>{s}</Tag>
                      ))}
                    </div>
                  </div>
                </Card>
              )}
            </Spin>
          </Card>


          {/* CLICKED ZONE DETAIL PANEL */}
          <Card className="eco-card" title="Zone Intelligence">
            {!selectedZone ? (
              <Text type="secondary">Click a zone on the map to view full details.</Text>
            ) : (
              <>
                {/* 1. Area Header */}
                <div style={{ marginBottom: 16 }}>
                  <Title level={4} style={{ marginBottom: 4 }}>{selectedZone.zone_name}</Title>
                  <Tag color={selectedZone.water_access ? "blue" : "red"}>
                    {selectedZone.water_access ? "Feasible" : "Blocked"}
                  </Tag>
                  <Tag color="purple">Impact: {selectedZone.impact_score}</Tag>
                  <Tag color="gold">{selectedZone.priority}</Tag>
                </div>


                {/* 2. Core Metrics */}
                <Card size="small" style={{ marginBottom: 12 }}>
                  <Text strong>Core Metrics</Text>
                  <div style={{ marginTop: 8 }}>
                    <p>🌳 Tree Canopy: {selectedZone.tree_canopy_pct}%</p>
                    <p>📉 NDVI: {selectedZone.ndvi}</p>
                    <p>🌡️ Surface Temp (LST): {selectedZone.lst_c}°C</p>
                    <p>👥 Vulnerability Index: {selectedZone.vulnerability_index}</p>
                    <p>🚰 Water Access: {selectedZone.water_access ? "Available" : "Not Available"}</p>
                  </div>
                </Card>


                {/* 3. Top Drivers */}
                <Card size="small" style={{ marginBottom: 12 }}>
                  <Text strong>Top Drivers</Text>
                  <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                    {selectedZone.top_drivers.map((driver, idx) => (
                      <li key={idx}>{driver}</li>
                    ))}
                  </ul>
                </Card>


                {/* 4. AI Explanation */}
                <Card size="small" style={{ marginBottom: 12 }}>
                  <Text strong>Why Selected</Text>
                  <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                    {selectedZone.why_selected}
                  </Paragraph>
                </Card>


                {/* 5. Recommendation Card */}
                <Card size="small" style={{ marginBottom: 12 }}>
                  <Text strong>Recommendation</Text>
                  <div style={{ marginTop: 8 }}>
                    <p>Suggested Trees: {selectedZone.recommended_trees}</p>
                    <p>Estimated Cooling: -{selectedZone.estimated_cooling_c}°C</p>
                    <p>Estimated Canopy Gain: +{selectedZone.estimated_canopy_gain_pct}%</p>
                    <p>
                      Feasibility:{" "}
                      <Text strong type={selectedZone.feasibility === "Blocked" ? "danger" : "success"}>
                        {selectedZone.feasibility}
                      </Text>
                    </p>
                  </div>
                </Card>


                {/* 6. Action Buttons */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button type="primary" onClick={handleAddToPlan}>
                    Add to Plan
                  </Button>
                  <Button onClick={handleCompare}>
                    Compare
                  </Button>
                  <Button type="dashed">
                    View Full Dashboard
                  </Button>
                </div>
              </>
            )}
          </Card>


          {/* INTERVENTION PLAN PANEL */}
          <Card className="eco-card" title="Intervention Plan">
            {planZones.length === 0 ? (
              <Text type="secondary">No zones added yet.</Text>
            ) : (
              <>
                {planZones.map((zone) => (
                  <Card key={zone.zone_id} size="small" style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Text strong>{zone.zone_name}</Text><br />
                        <Text type="secondary">{zone.recommended_trees} trees • {zone.feasibility}</Text>
                      </div>
                      <Button danger size="small" onClick={() => handleRemoveZone(zone.zone_id)}>
                        Remove
                      </Button>
                    </div>
                  </Card>
                ))}
              </>
            )}


            <Divider />


            <Row gutter={12}>
              <Col span={12}>
                <Statistic title="Budget" value={budget} suffix="trees" />
              </Col>
              <Col span={12}>
                <Statistic title="Used" value={totalPlanTrees} suffix="trees" />
              </Col>
              <Col span={12}>
                <Statistic title="Remaining" value={remainingBudget} suffix="trees" />
              </Col>
              <Col span={12}>
                <Statistic title="Cooling" value={totalCooling.toFixed(1)} suffix="°C" />
              </Col>
            </Row>
          </Card>


          {/* COMPARE PANEL */}
          <Card className="eco-card" title="Compare Zones">
            {compareZones.length === 0 ? (
              <Text type="secondary">Add up to 2 zones for comparison.</Text>
            ) : (
              <>
                {compareZones.map((zone) => (
                  <Card key={zone.zone_id} size="small" style={{ marginBottom: 8 }}>
                    <Text strong>{zone.zone_name}</Text><br />
                    <Text>Impact: {zone.impact_score} | Trees: {zone.recommended_trees}</Text><br />
                    <Text>Cooling: -{zone.estimated_cooling_c}°C</Text>
                  </Card>
                ))}

                {compareZones.length === 2 && betterZone && (
                  <Tag color="purple">
                    Recommended First: {betterZone.zone_name}
                  </Tag>
                )}
              </>
            )}
          </Card>


        </div>
      </Col>
    </Row>
  );
}



