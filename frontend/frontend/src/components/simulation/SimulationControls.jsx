import React from 'react';
import { Card, Typography, Select, Slider, Button, Tag, Radio, Progress } from 'antd';

const { Text } = Typography;
const { Option } = Select;

export default function SimulationControls({
  mockZones,
  selectedZoneId,
  handleZoneChange,
  treeType,
  setTreeType,
  timeHorizon,
  setTimeHorizon,
  treeCount,
  setTreeCount,
  selectedZone,
  profile,
  runSimulation,
  isSimulating,
  progress,
  setProgress,
  setSimulated
}) {
  return (
    <Card className="eco-card" title="Simulation Controls" style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 18 }}>
        <Text strong>Select Zone</Text>
        <Select
          value={selectedZoneId}
          onChange={handleZoneChange}
          style={{ width: '100%', marginTop: 8 }}
        >
          {mockZones.map((zone) => (
            <Option key={zone.zone_id} value={zone.zone_id}>
              {zone.zone_name}
            </Option>
          ))}
        </Select>
      </div>

      <div style={{ marginBottom: 18 }}>
        <Text strong>Tree Type</Text>
        <Radio.Group
          value={treeType}
          onChange={(e) => {
            setTreeType(e.target.value);
            setProgress(0);
            setSimulated(false);
          }}
          style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <Radio value="native">Native Shade Tree</Radio>
          <Radio value="fast">Fast-Growth Urban Tree</Radio>
          <Radio value="drought">Drought-Resilient Species</Radio>
        </Radio.Group>
      </div>

      <div style={{ marginBottom: 18 }}>
        <Text strong>Time Horizon: {timeHorizon} months</Text>
        <Slider
          min={6}
          max={24}
          step={6}
          marks={{ 6: '6', 12: '12', 18: '18', 24: '24' }}
          value={timeHorizon}
          onChange={(value) => {
            setTimeHorizon(value);
            setProgress(0);
            setSimulated(false);
          }}
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <Text strong>Tree Count: {treeCount}</Text>
        <Slider
          min={10}
          max={80}
          step={5}
          value={treeCount}
          onChange={(value) => {
            setTreeCount(value);
            setProgress(0);
            setSimulated(false);
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <Tag color={selectedZone.water_access ? 'green' : 'red'}>
          {selectedZone.water_access ? 'Water Access Available' : 'Water Constrained Zone'}
        </Tag>
        <Tag color={profile.color}>{profile.label}</Tag>
        <Tag color="purple">Water Need: {profile.waterNeed}</Tag>
      </div>

      <Button type="primary" size="large" block onClick={runSimulation} loading={isSimulating}>
        {isSimulating ? 'Running Simulation...' : 'Run Simulation'}
      </Button>

      <div style={{ marginTop: 16 }}>
        <Progress
          percent={progress}
          status={isSimulating ? 'active' : progress === 100 ? 'success' : 'normal'}
        />
      </div>
    </Card>
  );
}

