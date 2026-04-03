import React, { useState } from "react";
import { Card, Select, Row, Col } from "antd";

export default function SeasonPlanner({ zones }) {
  const [season, setSeason] = useState("summer");

  const getRecommendation = (zone) => {
    if (season === "summer") {
      return "🌡️ High priority for cooling. Dense canopy trees recommended.";
    }
    if (season === "monsoon") {
      return "🌧️ Best planting window. Optimize for water absorption.";
    }
    return "🌱 Maintenance phase. Ensure survival of planted trees.";
  };

  const getScore = (zone) => {
    if (season === "summer") return zone.lst * 0.7 - zone.ndvi * 0.3;
    if (season === "monsoon") return zone.water * 0.6 + zone.ndvi * 0.2;
    return zone.ndvi * 0.5;
  };

  return (
    <Card title="🌳 Season-Aware Tree Planning Engine" className="eco-card" style={{ marginTop: 24 }}>
      
      <Select
        value={season}
        onChange={setSeason}
        style={{ marginBottom: 20, width: 220 }}
        options={[
          { value: "summer", label: "Summer" },
          { value: "monsoon", label: "Monsoon" },
          { value: "winter", label: "Winter" }
        ]}
      />

      <Row gutter={[16, 16]}>
        {zones.map((zone, i) => (
          <Col xs={24} md={12} key={i}>
            <div className="season-card">
              <h3>{zone.name}</h3>
              <p><strong>Priority Score:</strong> {getScore(zone).toFixed(2)}</p>
              <p>{getRecommendation(zone)}</p>
            </div>
          </Col>
        ))}
      </Row>

      {/* 🔥 IMPACT LINE */}
      <div style={{ marginTop: 16, fontWeight: 500 }}>
        🌍 Smart Insight: Zones with high summer heat should prioritize cooling, 
        but planting must align with monsoon for long-term survival.
      </div>
    </Card>
  );
}