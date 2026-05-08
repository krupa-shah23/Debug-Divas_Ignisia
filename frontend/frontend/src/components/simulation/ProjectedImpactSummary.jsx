// import React from 'react';
// import { Card, Row, Col, Typography, Select, Segmented, Statistic } from 'antd';

// const { Title, Text } = Typography;

// export default function ProjectedImpactSummary({
//   selectedCity,
//   setSelectedCity,
//   cityOptions,
//   zones,
//   selectedZoneId,
//   setSelectedZoneId,
//   selectedZone,
//   projection,
//   timeHorizon,
//   setTimeHorizon,
//   isSimulating,
//   simulated
// }) {
//   const showProjected = simulated && projection;

//   return (
//     <Card
//       style={{
//         borderRadius: 16,
//         boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
//         border: '1px solid #f1f5f9',
//         height: '100%'
//       }}
//       bodyStyle={{ padding: 24 }}
//     >
//       <Row gutter={[16, 16]}>
//         <Col span={8}>
//           <Select
//             value={selectedCity}
//             onChange={setSelectedCity}
//             style={{ width: '100%' }}
//             options={cityOptions.map((city) => ({
//               label: String(city).toUpperCase(),
//               value: city
//             }))}
//           />
//         </Col>

//         <Col span={16}>
//           <Select
//             value={selectedZoneId}
//             onChange={setSelectedZoneId}
//             style={{ width: '100%' }}
//             options={zones.map((z) => ({
//               label: z.zone_name || `Zone ${z.zone_id}`,
//               value: String(z.zone_id)
//             }))}
//           />
//         </Col>
//       </Row>

//       <Row gutter={[16, 20]} style={{ marginTop: 20 }}>
//         <Col span={6}>
//           <Statistic
//             title="Baseline Canopy"
//             value={selectedZone?.canopy ?? selectedZone?.tree_canopy_pct ?? 0}
//             precision={1}
//             suffix="%"
//           />
//         </Col>

//         <Col span={6}>
//           <Statistic
//             title="Baseline NDVI"
//             value={selectedZone?.ndvi ?? 0}
//             precision={2}
//           />
//         </Col>

//         <Col span={6}>
//           <Statistic
//             title="Telemetry LST"
//             value={selectedZone?.lst ?? selectedZone?.lst_c ?? 0}
//             precision={1}
//             suffix="°C"
//           />
//         </Col>

//         <Col span={6}>
//           <Statistic
//             title="Impact Score"
//             value={selectedZone?.impact ?? selectedZone?.impact_score ?? 0}
//             precision={3}
//           />
//         </Col>
//       </Row>

//       <Card
//         size="small"
//         style={{
//           marginTop: 20,
//           borderRadius: 14,
//           background: '#f8fafc',
//           border: '1px solid #e2e8f0'
//         }}
//       >
//         <div
//           style={{
//             fontSize: 12,
//             fontWeight: 700,
//             color: '#64748b',
//             marginBottom: 14,
//             letterSpacing: 0.5
//           }}
//         >
//           FORECAST TIMELINE
//         </div>

//         <Segmented
//           block
//           value={timeHorizon}
//           onChange={setTimeHorizon}
//           options={[
//             { label: '6 Months', value: 6 },
//             { label: '1 Year', value: 12 },
//             { label: '5 Years', value: 60 },
//             { label: '10 Years', value: 120 }
//           ]}
//         />
//       </Card>

//       {showProjected ? (
//         <Card
//           style={{
//             marginTop: 24,
//             borderRadius: 16,
//             border: '1px solid #dcfce7',
//             background: '#f0fdf4'
//           }}
//           bodyStyle={{ padding: 18 }}
//         >
//           <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
//             <Text strong style={{ color: '#166534' }}>Projected Improvements</Text>
//             <Text style={{ fontSize: 12, color: '#16a34a' }}>• Live View</Text>
//           </div>

//           <Row gutter={[12, 12]}>
//             <Col span={8}>
//               <Card
//                 size="small"
//                 style={{
//                   borderRadius: 12,
//                   border: '1px solid #bbf7d0',
//                   background: '#f0fdf4'
//                 }}
//               >
//                 <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', marginBottom: 6 }}>
//                   CANOPY GAIN
//                 </div>
//                 <div style={{ fontSize: 22, fontWeight: 800, color: '#15803d' }}>
//                   +{projection.canopyGain.toFixed(1)}%
//                 </div>
//               </Card>
//             </Col>

//             <Col span={8}>
//               <Card
//                 size="small"
//                 style={{
//                   borderRadius: 12,
//                   border: '1px solid #bbf7d0',
//                   background: '#f0fdf4'
//                 }}
//               >
//                 <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', marginBottom: 6 }}>
//                   NDVI INCREASE
//                 </div>
//                 <div style={{ fontSize: 22, fontWeight: 800, color: '#15803d' }}>
//                   +{projection.ndviGain.toFixed(2)}
//                 </div>
//               </Card>
//             </Col>

//             <Col span={8}>
//               <Card
//                 size="small"
//                 style={{
//                   borderRadius: 12,
//                   border: '1px solid #bfdbfe',
//                   background: '#eff6ff'
//                 }}
//               >
//                 <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', marginBottom: 6 }}>
//                   COOLING RELIEF
//                 </div>
//                 <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb' }}>
//                   -{projection.coolingBenefit.toFixed(1)}°C
//                 </div>
//               </Card>
//             </Col>
//           </Row>
//         </Card>
//       ) : (
//         <Card
//           style={{
//             marginTop: 24,
//             borderRadius: 16,
//             border: '1px dashed #bbf7d0',
//             background: '#f0fdf4'
//           }}
//           bodyStyle={{ padding: 18 }}
//         >
//           <Text strong style={{ color: '#166534' }}>
//             Click "Run Simulation" to reveal projected improvements.
//           </Text>
//         </Card>
//       )}
//     </Card>
//   );
// }



import React from 'react';
import { Card, Row, Col, Typography, Select, Segmented, Statistic } from 'antd';

const { Text } = Typography;

export default function ProjectedImpactSummary({
  selectedCity,
  setSelectedCity,
  cityOptions,
  zones,
  selectedZoneId,
  setSelectedZoneId,
  droughtMode,
  setDroughtMode,
  droughtOptions,
  selectedZone,
  projection,
  timeHorizon,
  setTimeHorizon,
  isSimulating,
  simulated
}) {
  const showProjected = simulated && projection;

  return (
    <Card
      style={{
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
        border: '1px solid #f1f5f9',
        height: '100%'
      }}
      bodyStyle={{
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Select
            value={selectedCity}
            onChange={setSelectedCity}
            style={{ width: '100%' }}
            options={cityOptions.map((city) => ({
              label: String(city).toUpperCase(),
              value: city
            }))}
          />
        </Col>

        <Col span={16}>
          <Select
            value={selectedZoneId}
            onChange={setSelectedZoneId}
            style={{ width: '100%' }}
            options={zones.map((z) => ({
              label: z.zone_name || `Zone ${z.zone_id}`,
              value: String(z.zone_id)
            }))}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Select
            value={droughtMode}
            onChange={setDroughtMode}
            style={{ width: '100%' }}
            options={droughtOptions}
          />
        </Col>
      </Row>

      <Row gutter={[16, 20]} style={{ marginTop: 20 }}>
        <Col span={6}>
          <Statistic
            title="Baseline Canopy"
            value={selectedZone?.canopy ?? selectedZone?.tree_canopy_pct ?? 0}
            precision={1}
            suffix="%"
          />
        </Col>

        <Col span={6}>
          <Statistic
            title="Baseline NDVI"
            value={selectedZone?.ndvi ?? 0}
            precision={2}
          />
        </Col>

        <Col span={6}>
          <Statistic
            title="Telemetry LST"
            value={selectedZone?.lst ?? selectedZone?.lst_c ?? 0}
            precision={1}
            suffix="°C"
          />
        </Col>

        <Col span={6}>
          <Statistic
            title="Impact Score"
            value={selectedZone?.impact ?? selectedZone?.impact_score ?? 0}
            precision={3}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
        <Col span={12}>
          <Statistic
            title="Tree Allocation"
            value={selectedZone?.trees ?? selectedZone?.required_trees ?? 0}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Climate Stress"
            value={selectedZone?.climate_stress_level || 'N/A'}
          />
        </Col>
      </Row>

      <Card
        size="small"
        style={{
          marginTop: 20,
          borderRadius: 14,
          background: '#f8fafc',
          border: '1px solid #e2e8f0'
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#64748b',
            marginBottom: 14,
            letterSpacing: 0.5
          }}
        >
          FORECAST TIMELINE
        </div>

        <Segmented
          block
          value={timeHorizon}
          onChange={setTimeHorizon}
          options={[
            { label: '6 Months', value: 6 },
            { label: '1 Year', value: 12 },
            { label: '5 Years', value: 60 },
            { label: '10 Years', value: 120 }
          ]}
        />
      </Card>

      <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', marginTop: 24 }}>
        {showProjected ? (
          <Card
            style={{
              width: '100%',
              borderRadius: 16,
              border: '1px solid #dcfce7',
              background: '#f0fdf4',
              height: '100%'
            }}
            bodyStyle={{
              padding: 18,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Text strong style={{ color: '#166534' }}>Projected Improvements</Text>
              <Text style={{ fontSize: 12, color: '#16a34a' }}>• Live View</Text>
            </div>

            <Row gutter={[12, 12]}>
              <Col span={8}>
                <Card
                  size="small"
                  style={{
                    borderRadius: 12,
                    border: '1px solid #bbf7d0',
                    background: '#f0fdf4'
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', marginBottom: 6 }}>
                    CANOPY GAIN
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#15803d' }}>
                    +{projection.canopyGain.toFixed(1)}%
                  </div>
                </Card>
              </Col>

              <Col span={8}>
                <Card
                  size="small"
                  style={{
                    borderRadius: 12,
                    border: '1px solid #bbf7d0',
                    background: '#f0fdf4'
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', marginBottom: 6 }}>
                    NDVI INCREASE
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#15803d' }}>
                    +{projection.ndviGain.toFixed(2)}
                  </div>
                </Card>
              </Col>

              <Col span={8}>
                <Card
                  size="small"
                  style={{
                    borderRadius: 12,
                    border: '1px solid #bfdbfe',
                    background: '#eff6ff'
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', marginBottom: 6 }}>
                    COOLING RELIEF
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb' }}>
                    -{projection.coolingBenefit.toFixed(1)}°C
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        ) : (
          <Card
            style={{
              width: '100%',
              borderRadius: 16,
              border: '1px dashed #bbf7d0',
              background: '#f0fdf4',
              height: '100%'
            }}
            bodyStyle={{
              padding: 18,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Text strong style={{ color: '#166534' }}>
              Click "Run Simulation" to reveal projected improvements.
            </Text>
          </Card>
        )}
      </div>
    </Card>
  );
}
