import React, { useState } from "react";
import { Typography, Select, Slider, Card, Row, Col } from "antd";
import WorkerHeatBurden from "../components/WorkerHeatBurden";
import SeasonPlanner from "../components/SeasonPlanner";

const { Title, Text } = Typography;
const { Option } = Select;

export default function HumanImpact() {
  const [workerType, setWorkerType] = useState("Street Vendor");
  const [timeOfDay, setTimeOfDay] = useState(12);

  const baseLST = 41;

  // 🔥 Dynamic temperature simulation
  const getDynamicLST = () => {
    if (timeOfDay < 9) return baseLST - 4;
    if (timeOfDay < 12) return baseLST - 1;
    if (timeOfDay < 15) return baseLST + 3; // peak heat
    if (timeOfDay < 18) return baseLST + 1;
    return baseLST - 2;
  };

  const dynamicLST = getDynamicLST();

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2}>Human Impact Analysis</Title>

      {/* 🎛️ CONTROL PANEL */}
      <Card
        style={{
          marginBottom: "24px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
        }}
      >
        <Row gutter={24}>
          <Col span={12}>
            <Text strong>Select Worker Type</Text>
            <br />
            <Select
              value={workerType}
              onChange={setWorkerType}
              style={{ width: "100%", marginTop: 8 }}
              size="large"
            >
              <Option value="Street Vendor">🛒 Street Vendor</Option>
              <Option value="Delivery Worker">🚴 Delivery Worker</Option>
              <Option value="Construction Worker">🏗️ Construction Worker</Option>
            </Select>
          </Col>

          <Col span={12}>
            <Text strong>Time of Day: {timeOfDay}:00 hrs</Text>
            <Slider
              min={6}
              max={20}
              value={timeOfDay}
              onChange={setTimeOfDay}
              tooltip={{ formatter: (val) => `${val}:00` }}
            />
          </Col>
        </Row>

        <div style={{ marginTop: 16 }}>
          <Text type="secondary">
            🌡️ Simulated Land Surface Temperature:{" "}
            <strong>{dynamicLST}°C</strong>
          </Text>
        </div>
      </Card>

      {/* 🔥 WORKER SIMULATION */}
      <WorkerHeatBurden
        lst={dynamicLST}
        workerType={workerType}
        time={timeOfDay}
      />

      {/* 🌳 TREE PLANNING */}
      <SeasonPlanner
        zones={[
          { name: "Zone A", lst: 42, ndvi: 0.2, water: 0.3 },
          { name: "Zone B", lst: 38, ndvi: 0.4, water: 0.6 }
        ]}
      />
    </div>
  );
}