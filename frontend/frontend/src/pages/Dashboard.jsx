import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Slider, Radio, Typography, Spin, Tag, Statistic, Button, Divider, message } from 'antd';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { Select } from 'antd';
import { loadCityGeoJson, loadCityScoredZones } from '../utils/dataloader';
import L from 'leaflet';

const { Title, Text, Paragraph } = Typography;

function FitBounds({ geoData, fallbackCenter }) {
  const map = useMap();

  useEffect(() => {
    if (!geoData) return;

    try {
      const layer = L.geoJSON(geoData);
      const bounds = layer.getBounds();

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [30, 30] });
      } else if (fallbackCenter) {
        map.setView(fallbackCenter, 12);
      }
    } catch (err) {
      console.error("FitBounds error:", err);
      if (fallbackCenter) {
        map.setView(fallbackCenter, 12);
      }
    }
  }, [geoData, map, fallbackCenter]);

  return null;
}


function getFeatureCenter(feature) {
  try {
    const geom = feature?.geometry;
    if (!geom) return null;

    if (geom.type === "Polygon") {
      const ring = geom.coordinates?.[0];
      if (!ring?.length) return null;

      let sumLng = 0;
      let sumLat = 0;
      ring.forEach(([lng, lat]) => {
        sumLng += lng;
        sumLat += lat;
      });

      return [sumLat / ring.length, sumLng / ring.length];
    }

    if (geom.type === "MultiPolygon") {
      const ring = geom.coordinates?.[0]?.[0];
      if (!ring?.length) return null;

      let sumLng = 0;
      let sumLat = 0;
      ring.forEach(([lng, lat]) => {
        sumLng += lng;
        sumLat += lat;
      });

      return [sumLat / ring.length, sumLng / ring.length];
    }

    return null;
  } catch {
    return null;
  }
}

function IndiaViewController({ selectedCity, cityCenters }) {
  const map = useMap();

  useEffect(() => {
    if (selectedCity === "all") {
      map.setView([22.5, 79], 5);
    } else {
      map.setView(cityCenters[selectedCity] || [20.5937, 78.9629], 11);
    }
  }, [selectedCity, map, cityCenters]);

  return null;
}

function solveKnapsack(zones, budget) {
  const n = zones.length;
  const dp = Array.from({ length: n + 1 }, () => Array(budget + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const zone = zones[i - 1];
    const cost = Math.max(1, Math.round(zone.trees_needed || 10));
    const value = Number(zone.impact_score || 0);

    for (let w = 0; w <= budget; w++) {
      if (cost <= w) {
        dp[i][w] = Math.max(
          dp[i - 1][w],
          dp[i - 1][w - cost] + value
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  // backtrack selected items
  const selected = [];
  let w = budget;

  for (let i = n; i > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      const zone = zones[i - 1];
      selected.push(zone.zone_id);
      w -= Math.max(1, Math.round(zone.trees_needed || 10));
    }
  }

  selected.reverse();

  const treesUsed = zones
    .filter(z => selected.includes(z.zone_id))
    .reduce((sum, z) => sum + Math.max(1, Math.round(z.trees_needed || 10)), 0);

  return {
    selected,
    treesUsed
  };
}

export default function Dashboard() {
  const [geoData, setGeoData] = useState(null);
  const [zoneData, setZoneData] = useState({});
  const [layer, setLayer] = useState("Impact Score");
  const [budget, setBudget] = useState(100);
  const [method, setMethod] = useState("knapsack");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [allCityMapData, setAllCityMapData] = useState([]);

  // NEW STATES
  const [selectedZone, setSelectedZone] = useState(null);
  const [planZones, setPlanZones] = useState([]);
  const [compareZones, setCompareZones] = useState([]);

  const cityOptions = [
    "all",
    "ahmedabad", "bangalore", "chennai", "delhi", "hyderabad",
    "indore", "jaipur", "kanpur", "kolkata", "lucknow",
    "mumbai", "nagpur", "pune", "surat", "vadodara"
  ];

  const [selectedCity, setSelectedCity] = useState("all");



  const runOptimization = async () => {
    setLoading(true);

    try {
      if (selectedCity === "all") {
        const allMapData = [];

        for (const city of cityOptions.filter(c => c !== "all")) {
          const geo = await loadCityGeoJson(city);
          const zones = await loadCityScoredZones(city);

          const tData = {};
          zones.forEach((z, index) => {
            const zoneId = z.zone_id || z.Zone_ID || z.id || z.zone || `zone_${index + 1}`;
            tData[zoneId] = {
              ...z,
              zone_id: zoneId,
              impact_score: z.impact_score ?? z.final_score ?? z.score ?? 0,
              priority_rank: z.priority_rank ?? z.rank ?? index + 1,
              NDVI: z.NDVI ?? z.ndvi ?? 0,
              LST: z.LST ?? z.lst ?? 0,
              water_available: z.water_available ?? z.water_access ?? z.water_feasible ?? false,
              trees_needed:
                z.trees_needed ??
                z.recommended_trees ??
                Math.max(
                  8,
                  Math.min(
                    25,
                    Math.round(
                      8 +
                      ((z.LST ?? z.lst ?? 38) - 35) * 1.2 +
                      (0.4 - (z.NDVI ?? z.ndvi ?? 0.3)) * 20
                    )
                  )
                ),
              tree_coverage_ratio: z.tree_coverage_ratio ?? z.canopy_ratio ?? z.tree_canopy_pct ?? 0,
              vulnerability: z.vulnerability ?? z.vulnerability_index ?? 0,
              estimated_cooling_c: z.estimated_cooling_c ?? z.cooling ?? 0.3,
              estimated_canopy_gain_pct: z.estimated_canopy_gain_pct ?? z.canopy_gain ?? 4,
              explanation: z.explanation ?? "AI prioritized this zone due to canopy deficit, heat stress, and feasibility."
            };
          });

          const availableZones = Object.values(tData)
            .filter(z => z.water_available);

          let selected = [];
          let usedTrees = 0;

          if (method === "greedy") {
            const sortedZones = [...availableZones].sort(
              (a, b) => (b.impact_score || 0) - (a.impact_score || 0)
            );

            for (const z of sortedZones) {
              const trees = Math.max(1, Math.round(z.trees_needed || 10));
              if (usedTrees + trees <= budget) {
                selected.push(z.zone_id);
                usedTrees += trees;
              }
            }
          } else {
            const knapsackResult = solveKnapsack(availableZones, budget);
            selected = knapsackResult.selected;
            usedTrees = knapsackResult.treesUsed;
          }

          const features = geo?.features || [];
          features.forEach((feature, index) => {
            const zoneId =
              feature.properties.zone_id ||
              feature.properties.Zone_ID ||
              feature.properties.id ||
              feature.properties.zone ||
              feature.properties.zoneid ||
              `zone_${index + 1}`;

            const center = getFeatureCenter(feature);

            if (center) {
              allMapData.push({
                city,
                feature,
                zoneId,
                center,
                zone: tData[zoneId] || {},
                isSelected: selected.includes(zoneId)
              });
            }
          });
        }

        setGeoData(null);
        setZoneData({});
        setResults({ trees_used: 0, selected: [] });
        setAllCityMapData(allMapData);
        setSelectedZone(null);
        setLoading(false);
        return;
      }

      // SINGLE CITY FLOW (same as before, but method actually changes behavior)
      const geo = await loadCityGeoJson(selectedCity);
      const zones = await loadCityScoredZones(selectedCity);

      setGeoData(geo);
      setAllCityMapData([]);

      const tData = {};
      zones.forEach((z, index) => {
        const zoneId = z.zone_id || z.Zone_ID || z.id || z.zone || `zone_${index + 1}`;
        tData[zoneId] = {
          ...z,
          zone_id: zoneId,
          impact_score: z.impact_score ?? z.final_score ?? z.score ?? 0,
          priority_rank: z.priority_rank ?? z.rank ?? index + 1,
          NDVI: z.NDVI ?? z.ndvi ?? 0,
          LST: z.LST ?? z.lst ?? 0,
          water_available: z.water_available ?? z.water_access ?? z.water_feasible ?? false,
          trees_needed:
            z.trees_needed ??
            z.recommended_trees ??
            Math.max(
              8,
              Math.min(
                25,
                Math.round(
                  8 +
                  ((z.LST ?? z.lst ?? 38) - 35) * 1.2 +
                  (0.4 - (z.NDVI ?? z.ndvi ?? 0.3)) * 20
                )
              )
            ),
          tree_coverage_ratio: z.tree_coverage_ratio ?? z.canopy_ratio ?? z.tree_canopy_pct ?? 0,
          vulnerability: z.vulnerability ?? z.vulnerability_index ?? 0,
          estimated_cooling_c: z.estimated_cooling_c ?? z.cooling ?? 0.3,
          estimated_canopy_gain_pct: z.estimated_canopy_gain_pct ?? z.canopy_gain ?? 4,
          explanation: z.explanation ?? "AI prioritized this zone due to canopy deficit, heat stress, and feasibility."
        };
      });

      setZoneData(tData);

      const availableZones = Object.values(tData)
        .filter(z => z.water_available);

      let selected = [];
      let usedTrees = 0;

      if (method === "greedy") {
        const sortedZones = [...availableZones].sort(
          (a, b) => (b.impact_score || 0) - (a.impact_score || 0)
        );

        for (const z of sortedZones) {
          const trees = Math.max(1, Math.round(z.trees_needed || 10));
          if (usedTrees + trees <= budget) {
            selected.push(z.zone_id);
            usedTrees += trees;
          }
        }
      } else {
        const knapsackResult = solveKnapsack(availableZones, budget);
        selected = knapsackResult.selected;
        usedTrees = knapsackResult.treesUsed;
      }

      setResults({
        trees_used: usedTrees,
        selected
      });

      setSelectedZone(null);

    } catch (e) {
      console.error(e);
      message.error(`Failed to load data for ${selectedCity}. Check public/data files.`);
    }

    setLoading(false);
  };

  useEffect(() => {
    runOptimization();
  }, [selectedCity, budget, method]);


  const getColor = (props) => {
    const zid = props.zone_id || props.Zone_ID || props.id || props.zone || props.zoneid;
    const isSel = results?.selected?.includes(zid);

    if (isSel) return "#2b83ba";

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
    const zoneId =
      feature.properties.zone_id ||
      feature.properties.Zone_ID ||
      feature.properties.id ||
      feature.properties.zone ||
      feature.properties.zoneid;

    const isOptimizerSelected = results?.selected?.includes(zoneId);
    const isUserSelected = selectedZone?.zone_id === zoneId;


    return {
      fillColor: getColor(feature.properties),
      color: isUserSelected ? "#111827" : isOptimizerSelected ? "#000" : "#333",
      weight: isUserSelected ? 4 : isOptimizerSelected ? 3 : 2,
      fillOpacity: isUserSelected ? 0.9 : isOptimizerSelected ? 0.8 : 0.75
    };
  };



  const getMarkerRadius = (zid) => {
    const isUserSelected = selectedZone?.zone_id === zid;
    const isOptimizerSelected = results?.selected?.includes(zid);

    if (isUserSelected) return 14;
    if (isOptimizerSelected) return 11;
    return 8;
  };

  // CLICKED ZONE → DETAIL PANEL
  const handleZoneClick = (feature) => {
    const zid =
      feature.properties.zone_id ||
      feature.properties.Zone_ID ||
      feature.properties.id ||
      feature.properties.zone ||
      feature.properties.zoneid;
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

  const cityCenters = {
    ahmedabad: [23.0225, 72.5714],
    bangalore: [12.9716, 77.5946],
    chennai: [13.0827, 80.2707],
    delhi: [28.6139, 77.2090],
    hyderabad: [17.3850, 78.4867],
    indore: [22.7196, 75.8577],
    jaipur: [26.9124, 75.7873],
    kanpur: [26.4499, 80.3319],
    kolkata: [22.5726, 88.3639],
    lucknow: [26.8467, 80.9462],
    mumbai: [19.0760, 72.8777],
    nagpur: [21.1458, 79.0882],
    pune: [18.5204, 73.8567],
    surat: [21.1702, 72.8311],
    vadodara: [22.3072, 73.1812]
  };


  return (
    <Row gutter={24}>
      {/* MAP */}
      <Col xs={24} lg={14}>
        <div
          className="eco-card"
          style={{ padding: 0, overflow: 'hidden', height: '650px', position: 'relative', borderRadius: '20px' }}
        >
          {(geoData || allCityMapData.length > 0) ? (
            <MapContainer
              key={`map-${selectedCity}`}
              center={selectedCity === "all" ? [22.5, 79] : (cityCenters[selectedCity] || [20.5937, 78.9629])}
              zoom={selectedCity === "all" ? 5 : 11}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

              <IndiaViewController selectedCity={selectedCity} cityCenters={cityCenters} />

              {selectedCity !== "all" && geoData?.features?.map((feature, index) => {
                const zoneId =
                  feature.properties.zone_id ||
                  feature.properties.Zone_ID ||
                  feature.properties.id ||
                  feature.properties.zone ||
                  feature.properties.zoneid ||
                  `zone_${index + 1}`;

                const center = getFeatureCenter(feature);
                if (!center) return null;

                const zd = zoneData[zoneId] || {};
                const isSel = results?.selected?.includes(zoneId);

                const zoneLikeFeature = {
                  ...feature,
                  properties: {
                    ...feature.properties,
                    zone_id: zoneId,
                  }
                };

                return (
                  <CircleMarker
                    key={`${selectedCity}-${zoneId}-${layer}-${selectedZone?.zone_id || "none"}`}
                    center={center}
                    radius={getMarkerRadius(zoneId)}
                    pathOptions={{
                      fillColor: getColor({ zone_id: zoneId }),
                      color: selectedZone?.zone_id === zoneId ? "#111827" : isSel ? "#000" : "#ffffff",
                      weight: selectedZone?.zone_id === zoneId ? 4 : isSel ? 3 : 2,
                      fillOpacity: selectedZone?.zone_id === zoneId ? 0.95 : isSel ? 0.85 : 0.8,
                    }}
                    eventHandlers={{
                      click: () => handleZoneClick(zoneLikeFeature)
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                      <div style={{ fontFamily: 'Inter', minWidth: 180 }}>
                        <strong>{feature.properties.zone_name || feature.properties.Zone_Name || feature.properties.name || `Zone ${zoneId}`}</strong><br />
                        NDVI: {zd.NDVI ?? 'N/A'} | LST: {zd.LST ?? 'N/A'}°C<br />
                        Impact Score: <b>{zd.impact_score ?? 'N/A'}</b><br />
                        Rank: #{zd.priority_rank ?? 'N/A'}<br />
                        Water: {zd.water_available ? '✅ Active' : '❌ Low'}<br />
                        <b>Optimizer Selected: {isSel ? '✅ YES' : '❌ NO'}</b><br />
                        <span style={{ color: '#2563eb', fontWeight: 600 }}>Click for full details</span>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}

              {selectedCity === "all" && allCityMapData.map((item) => {
                const { city, zoneId, center, zone, isSelected, feature } = item;

                const zoneLikeFeature = {
                  ...feature,
                  properties: {
                    ...feature.properties,
                    zone_id: zoneId,
                    zone_name: `${city.charAt(0).toUpperCase() + city.slice(1)} • ${zoneId}`
                  }
                };

                return (
                  <CircleMarker
                    key={`all-${city}-${zoneId}-${layer}`}
                    center={center}
                    radius={isSelected ? 8 : 6}
                    pathOptions={{
                      fillColor: (() => {
                        if (isSelected) return "#2b83ba";
                        if (layer === "Impact Score") {
                          const v = zone.impact_score || 0;
                          return v > 0.7 ? "#d73027" : v > 0.5 ? "#fc8d59" : v > 0.3 ? "#fee090" : "#91cf60";
                        } else if (layer === "NDVI") {
                          const v = zone.NDVI || 0.3;
                          return v < 0.15 ? "#d73027" : v < 0.25 ? "#fc8d59" : v < 0.35 ? "#fee090" : "#1a9850";
                        } else {
                          const v = zone.LST || 38;
                          return v > 45 ? "#d73027" : v > 42 ? "#fc8d59" : v > 39 ? "#fee090" : "#91cf60";
                        }
                      })(),
                      color: "#ffffff",
                      weight: 1.5,
                      fillOpacity: 0.85,
                    }}
                    eventHandlers={{
                      click: () => handleZoneClick(zoneLikeFeature)
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                      <div style={{ fontFamily: 'Inter', minWidth: 190 }}>
                        <strong>{city.charAt(0).toUpperCase() + city.slice(1)} • {zoneId}</strong><br />
                        NDVI: {zone.NDVI ?? 'N/A'} | LST: {zone.LST ?? 'N/A'}°C<br />
                        Impact Score: <b>{zone.impact_score ?? 'N/A'}</b><br />
                        Rank: #{zone.priority_rank ?? 'N/A'}<br />
                        Water: {zone.water_available ? '✅ Active' : '❌ Low'}<br />
                        <b>Optimizer Selected: {isSelected ? '✅ YES' : '❌ NO'}</b><br />
                        <span style={{ color: '#2563eb', fontWeight: 600 }}>Click for full details</span>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
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
              <Text strong>Select City</Text><br />
              <Select
                showSearch
                value={selectedCity}
                style={{ width: '100%', marginTop: 8 }}
                onChange={(value) => setSelectedCity(value)}
                options={cityOptions.map(city => ({
                  value: city,
                  label: city === "all" ? "All Cities" : city.charAt(0).toUpperCase() + city.slice(1)
                }))}
                placeholder="Select a city"
                optionFilterProp="label"
              />
            </div>
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
              {results && selectedCity !== "all" && (
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



