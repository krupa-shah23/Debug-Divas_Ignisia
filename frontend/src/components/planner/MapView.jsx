import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { mockGridGeoJson } from "../../data/mockGridGeoJson";
import { mockZones } from "../../data/mockZones";
import { getZoneColor } from "./plannerUtils";

const MapView = ({ onSelectZone }) => {
  const zoneMap = Object.fromEntries(mockZones.map((z) => [z.zone_id, z]));

  const onEachFeature = (feature, layer) => {
    const zoneId = feature.properties.zone_id;
    const zone = zoneMap[zoneId];

    layer.on({
      click: () => {
        onSelectZone(zone);
      }
    });

    layer.bindTooltip(`${zone.zone_name} (${zone.impact_score}/100)`);
  };

  const styleFeature = (feature) => {
    const zoneId = feature.properties.zone_id;
    const zone = zoneMap[zoneId];

    return {
      fillColor: getZoneColor(zone.priority, zone.water_access),
      weight: 2,
      opacity: 1,
      color: zone.water_access ? "#1F2937" : "#6B7280",
      fillOpacity: 0.6
    };
  };

  return (
    <MapContainer
      center={[18.97, 72.85]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GeoJSON
        data={mockGridGeoJson}
        style={styleFeature}
        onEachFeature={onEachFeature}
      />
    </MapContainer>
  );
};

export default MapView;