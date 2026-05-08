import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  InputNumber,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
} from "antd";

import Chatbot from "../components/Chatbot";
import MapView from "../components/MapView";
import { fetchCityGeoJson, runZoneOptimization } from "../utils/api";

const { Paragraph, Text, Title } = Typography;

const CITY_OPTIONS = [
  "ahmedabad",
  "bangalore",
  "chennai",
  "delhi",
  "hyderabad",
  "indore",
  "jaipur",
  "kanpur",
  "kolkata",
  "lucknow",
  "mumbai",
  "nagpur",
  "pune",
  "surat",
  "vadodara",
];

function buildReason(zone) {
  const reasons = [];

  if (Number(zone.LST) >= 37) {
    reasons.push("surface temperatures are elevated");
  }

  if (Number(zone.NDVI) <= 0.3) {
    reasons.push("vegetation cover is thin");
  }

  if (!zone.water_feasible) {
    reasons.push("water access is constrained");
  }

  if (zone.selected) {
    reasons.push("the optimizer selected this zone for intervention");
  }

  if (!reasons.length) {
    reasons.push("conditions are comparatively stable");
  }

  return reasons.join(", ");
}

function buildReasonTags(zone) {
  const tags = [];

  if (Number(zone.LST) > 35) {
    tags.push({ label: "Heat hotspot", color: "volcano" });
  }

  if (Number(zone.NDVI) < 0.3) {
    tags.push({ label: "Low canopy", color: "gold" });
  }

  if (!zone.water_ok) {
    tags.push({ label: "Water constrained", color: "red" });
  }

  return tags;
}

function enrichZone(zone) {
  return {
    ...zone,
    reason: zone.reason || buildReason(zone),
    water_ok: Boolean(zone.water_ok ?? zone.water_feasible),
  };
}

function buildZoneLookup(zones) {
  return zones.reduce((lookup, zone) => {
    lookup[zone.zone_id] = enrichZone(zone);
    return lookup;
  }, {});
}

export default function Dashboard() {
  const [city, setCity] = useState("pune");
  const [budget, setBudget] = useState(500);
  const [zonesData, setZonesData] = useState([]);
  const [simulationData, setSimulationData] = useState(null);
  const [totalTrees, setTotalTrees] = useState(0);
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [highlightedZones, setHighlightedZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [hoveredZoneId, setHoveredZoneId] = useState(null);
  const [loadingMap, setLoadingMap] = useState(false);
  const [loadingRun, setLoadingRun] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadGeoJson() {
      setLoadingMap(true);
      setError("");

      try {
        const geoJson = await fetchCityGeoJson(city);
        if (!active) {
          return;
        }
        setGeoJsonData(geoJson);
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Failed to load zone map.");
        setGeoJsonData(null);
      } finally {
        if (active) {
          setLoadingMap(false);
        }
      }
    }

    loadGeoJson();

    return () => {
      active = false;
    };
  }, [city]);

  const runDashboard = async () => {
    setLoadingRun(true);
    setError("");

    try {
      const result = await runZoneOptimization({ city, budget });
      const zones = Array.isArray(result?.zones) ? result.zones.map(enrichZone) : [];

      setZonesData(zones);
      setSimulationData(result?.simulation || null);
      setTotalTrees(Number(result?.total_trees || 0));
      setSelectedZone((current) =>
        current ? zones.find((zone) => zone.zone_id === current.zone_id) || null : null
      );
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Failed to run zone optimization.");
      setZonesData([]);
      setSimulationData(null);
      setTotalTrees(0);
      setSelectedZone(null);
    } finally {
      setLoadingRun(false);
    }
  };

  useEffect(() => {
    runDashboard();
  }, [city]);

  const zoneLookup = useMemo(() => buildZoneLookup(zonesData), [zonesData]);
  const selectedZones = useMemo(
    () => zonesData.filter((zone) => zone.selected),
    [zonesData]
  );
  const hoveredZone = hoveredZoneId ? zoneLookup[hoveredZoneId] : null;
  const simulationZones = simulationData?.zones || [];
  const simulationPoints = simulationData?.points || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Card className="eco-card">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8} lg={6}>
            <Text strong>City</Text>
            <Select
              value={city}
              onChange={(value) => {
                setCity(value);
                setHighlightedZones([]);
                setSelectedZone(null);
              }}
              options={CITY_OPTIONS.map((option) => ({
                value: option,
                label: option.charAt(0).toUpperCase() + option.slice(1),
              }))}
              style={{ width: "100%", marginTop: 8 }}
            />
          </Col>
          <Col xs={24} md={8} lg={5}>
            <Text strong>Budget</Text>
            <div style={{ marginTop: 8 }}>
              <InputNumber
                min={0}
                step={50}
                value={budget}
                onChange={(value) => setBudget(Number(value || 0))}
                style={{ width: "100%" }}
              />
            </div>
          </Col>
          <Col xs={24} md={8} lg={5}>
            <Button
              type="primary"
              className="eco-btn"
              loading={loadingRun}
              onClick={runDashboard}
              style={{ width: "100%", marginTop: 30 }}
            >
              Run Optimization
            </Button>
          </Col>
          <Col xs={12} md={8} lg={4}>
            <Statistic title="Zones Loaded" value={zonesData.length} />
          </Col>
          <Col xs={12} md={8} lg={4}>
            <Statistic title="Selected Zones" value={selectedZones.length} />
          </Col>
        </Row>
        {error ? <Alert type="error" showIcon message={error} style={{ marginTop: 16 }} /> : null}
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={15}>
          <Card
            className="eco-card"
            title={<Title level={4} style={{ margin: 0 }}>Priority Zone Map</Title>}
            extra={
              <Space wrap>
                {hoveredZone ? <Tag color="processing">Hovering {hoveredZone.zone_id}</Tag> : null}
                {highlightedZones.length ? (
                  <Tag color="purple">{highlightedZones.length} chatbot highlight(s)</Tag>
                ) : null}
              </Space>
            }
          >
            {loadingMap ? (
              <div style={{ height: 560, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Spin size="large" />
              </div>
            ) : geoJsonData ? (
              <MapView
                geoJsonData={geoJsonData}
                zoneLookup={zoneLookup}
                selectedZoneId={selectedZone?.zone_id || null}
                highlightedZoneIds={highlightedZones}
                onZoneClick={setSelectedZone}
                onZoneHover={setHoveredZoneId}
              />
            ) : (
              <Empty description="No GeoJSON available for this city." />
            )}
          </Card>
        </Col>

        <Col xs={24} xl={9}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Card className="eco-card" title="Zone Insights">
              {selectedZone ? (
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <div>
                    <Title level={4} style={{ marginBottom: 4 }}>
                      {selectedZone.zone_id}
                    </Title>
                    <Space wrap>
                      <Tag color={selectedZone.selected ? "blue" : "default"}>
                        {selectedZone.selected ? "Selected" : "Not selected"}
                      </Tag>
                      <Tag color={selectedZone.water_ok ? "green" : "red"}>
                        {selectedZone.water_ok ? "Water feasible" : "Water constrained"}
                      </Tag>
                      {buildReasonTags(selectedZone).map((tag) => (
                        <Tag key={tag.label} color={tag.color}>
                          {tag.label}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                  <Row gutter={[12, 12]}>
                    <Col span={12}>
                      <Statistic title="NDVI" value={selectedZone.NDVI != null ? Number(selectedZone.NDVI).toFixed(3) : "N/A"} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="LST" value={selectedZone.LST != null ? Number(selectedZone.LST).toFixed(2) : "N/A"} suffix={selectedZone.LST != null ? "C" : ""} />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Drought Score"
                        value={selectedZone.drought_index != null ? Number(selectedZone.drought_index).toFixed(2) : "N/A"}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Tree Allocation"
                        value={Number(selectedZone.trees ?? 0)}
                      />
                    </Col>
                    <Col span={24}>
                      <Statistic
                        title="Priority Score"
                        value={selectedZone.priority_score != null ? Number(selectedZone.priority_score).toFixed(3) : "N/A"}
                      />
                    </Col>
                  </Row>
                  <Paragraph style={{ marginBottom: 0 }}>
                    <Text strong>Reason:</Text> {selectedZone.reason}
                  </Paragraph>
                </Space>
              ) : (
                <Empty description="Click a zone to inspect its NDVI, LST, priority score, and reason." />
              )}
            </Card>

            <Card className="eco-card" title="Simulation Summary">
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <Statistic title="Simulated Zones" value={simulationZones.length} />
                </Col>
                <Col span={12}>
                  <Statistic title="Planting Points" value={simulationPoints.length} />
                </Col>
                <Col span={24}>
                  <Statistic
                    title="Total Trees"
                    value={totalTrees}
                  />
                </Col>
              </Row>
            </Card>

            <Chatbot
              city={city}
              data={zonesData}
              selectedZones={selectedZones}
              simulation={{ ...(simulationData || {}), total_trees: totalTrees }}
              onZonesHighlighted={setHighlightedZones}
              onError={(message) => setError(message)}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
}
