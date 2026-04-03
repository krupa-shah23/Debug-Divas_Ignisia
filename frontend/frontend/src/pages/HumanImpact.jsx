import React from "react";
import { Typography } from "antd";
import WorkerHeatBurden from "../components/WorkerHeatBurden";
import SeasonPlanner from "../components/SeasonPlanner";

const { Title } = Typography;

export default function HumanImpact() {
  const sampleLST = 41; // later connect dynamically

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>Human Impact Analysis</Title>

      <WorkerHeatBurden lst={sampleLST} />
      <SeasonPlanner
  zones={[
    { name: "Zone A", lst: 42, ndvi: 0.2, water: 0.3 },
    { name: "Zone B", lst: 38, ndvi: 0.4, water: 0.6 }
  ]}
/>
    </div>
  );
}