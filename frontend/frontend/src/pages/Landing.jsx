import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Card } from 'antd';
import { EnvironmentOutlined, GlobalOutlined, RightOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import WalkingPeople from "../components/WalkingPeople"; // 👈 ADD THIS AT TOP

const { Title, Paragraph } = Typography;


export default function Landing() {
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowContent(true), 1200); // after title
    setTimeout(() => setShowButton(true), 2000); // after paragraph
}, []);
  return (
    <div className="home-page" style={{ padding: '40px 0' }}>
      <div style={{
        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
        borderRadius: '24px',
        padding: '60px 40px',
        color: 'white',
        textAlign: 'center',
        marginBottom: '40px',
        boxShadow: '0 10px 30px rgba(27, 67, 50, 0.3)'
      }}>
        <EnvironmentOutlined style={{ fontSize: '4rem', marginBottom: '20px', color: 'var(--accent)' }} />
        <Title style={{ color: 'white', margin: 0, fontSize: '3rem' }}>
  <span className="typing-text">
    Build Climate-Resilient Cities with Smart Tree Planning
  </span>
</Title>
        {showContent && (
  <Paragraph
    className="fade-in-up"
    style={{
      color: '#d8e2dc',
      fontSize: '1.2rem',
      maxWidth: '800px',
      margin: '20px auto 30px'
    }}
  >
    An AI-powered geospatial decision-support tool to identify vulnerable neighborhoods and optimize tree allocation to combat extreme urban heat and improve ecological equity.
  </Paragraph>
)}
        {showButton && (
  <Link to="/dashboard" className="eco-btn light-btn fade-in-up">
    Launch Dashboard <RightOutlined style={{ marginLeft: '10px' }} />
  </Link>
)}
      </div>

      <Row align="middle" gutter={[32, 32]}>

  {/* PROBLEM */}
  <Col xs={24} md={10}>
    <div className="eco-card" style={{ height: '100%', cursor: 'pointer' }}>
      <Title level={3}>
        <GlobalOutlined style={{ color: '#d73027' }} /> The Problem
      </Title>
      <Paragraph style={{ fontSize: '1.1rem' }}>
        Urban heat islands and unequal tree canopy coverage disproportionately affect vulnerable populations. 
        Rising temperatures and dropping vegetative indices directly impact health, biodiversity, and quality of life across our cities.
      </Paragraph>
    </div>
  </Col>

  {/* 🔥 ANIMATION */}
  <Col xs={24} md={4}>
    <div className="walking-people" style={{ transform: 'scale(1.8)', transformOrigin: 'center' }}>
      <WalkingPeople />
    </div>
  </Col>

  {/* SOLUTION */}
  <Col xs={24} md={10}>
    <div className="eco-card" style={{ height: '100%', cursor: 'pointer' }}>
      <Title level={3}>
        <EnvironmentOutlined style={{ color: 'var(--secondary)' }} /> The Solution
      </Title>
      <Paragraph style={{ fontSize: '1.1rem' }}>
        Our geospatial optimization engine allocates limited resources (trees) to maximize environmental impact. 
        By focusing on high Land Surface Temperature (LST) and low vegetative cover, we maximize return on climate investments.
      </Paragraph>
    </div>
  </Col>

</Row>
    </div>
  );
}
