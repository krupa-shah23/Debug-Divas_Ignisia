import React from "react";
import { Card, Row, Col } from "antd";
import { workers } from "../data/workers";
import { calculateHeatExposure, getHeatRisk } from "../utils/heatUtils";

export default function WorkerHeatBurden({ lst }) {
  return (
    <Card title="👷 Worker Heat Burden" className="eco-card">
      <Row gutter={[16, 16]}>
        {workers.map((worker) => {
          const exposure = calculateHeatExposure(lst, worker.baseHours);
          const risk = getHeatRisk(exposure);

          return (
            <Col xs={24} md={8} key={worker.id}>
              <div className="worker-card">
                <h3>{worker.icon} {worker.name}</h3>
                <p><strong>Exposure:</strong> {exposure} hrs/day</p>
                <p><strong>Risk:</strong> {risk}</p>
              </div>
            </Col>
          );
        })}
      </Row>
    </Card>
  );
}