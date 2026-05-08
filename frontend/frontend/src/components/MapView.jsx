import { useEffect, useMemo } from "react";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

const DEFAULT_CENTER = [20.5937, 78.9629];

function FitToGeoJson({ geoJsonData }) {
  const map = useMap();

  useEffect(() => {
    if (!geoJsonData?.features?.length) {
      map.setView(DEFAULT_CENTER, 5);
      return;
    }

    const layer = L.geoJSON(geoJsonData);
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.08));
    }
  }, [geoJsonData, map]);

  return null;
}

function getStyle(zone, highlightedSet) {
  const ndvi = Number(zone.NDVI);
  const lst = Number(zone.LST);
  const score = Number(zone.priority_score ?? zone.impact_score ?? 0);

  if (highlightedSet.has(zone.zone_id)) {
    return {
      color: "#6C5CE7",
      weight: 3,
      fillOpacity: 0.6,
      fillColor: "#8c7ae6",
    };
  }

  if (zone.selected) {
    return {
      color: "#15803d",
      weight: 4,
      fillOpacity: 0.72,
      fillColor: "#22c55e",
      dashArray: "6 4",
    };
  }

  if (Number(zone.drought_index ?? 0) > 0.7 || lst >= 39) {
    return {
      color: "#b91c1c",
      weight: 2.4,
      fillOpacity: 0.56,
      fillColor: "#ef4444",
    };
  }

  if (Number(zone.drought_index ?? 0) > 0.5 || ndvi <= 0.25 || score >= 7.5) {
    return {
      color: "#c2410c",
      weight: 2,
      fillOpacity: 0.46,
      fillColor: "#f59e0b",
    };
  }

  return {
    color: "#1d4ed8",
    weight: 1.6,
    fillOpacity: 0.34,
    fillColor: "#3b82f6",
  };
}

function buildPopupContent(zone) {
  const ndviValue = Number.isFinite(Number(zone.NDVI)) ? Number(zone.NDVI).toFixed(3) : "N/A";
  const lstValue = Number.isFinite(Number(zone.LST)) ? Number(zone.LST).toFixed(2) : "N/A";
  const scoreValue = Number.isFinite(Number(zone.priority_score)) ? Number(zone.priority_score).toFixed(2) : "N/A";
  const droughtValue = Number.isFinite(Number(zone.drought_index)) ? Number(zone.drought_index).toFixed(2) : "N/A";

  return `
    <div style="min-width: 220px; line-height: 1.55;">
      <strong>Zone:</strong> ${zone.zone_id}<br/>
      <strong>NDVI:</strong> ${ndviValue}<br/>
      <strong>LST:</strong> ${lstValue === "N/A" ? lstValue : `${lstValue} C`}<br/>
      <strong>Score:</strong> ${scoreValue}<br/>
      <strong>Drought:</strong> ${droughtValue}<br/>
      <strong>Trees:</strong> ${Number(zone.trees ?? 0)}<br/>
      <div style="margin-top: 10px;">
        <strong>Reason:</strong><br/>
        <span>${zone.reason || "No explanation available"}</span>
      </div>
    </div>
  `;
}

export default function MapView({
  geoJsonData,
  zoneLookup,
  selectedZoneId,
  highlightedZoneIds,
  onZoneClick,
  onZoneHover,
}) {
  const highlightedSet = useMemo(() => new Set(highlightedZoneIds || []), [highlightedZoneIds]);

  const styleFeature = (feature) => {
    const zoneId = feature?.properties?.zone_id;
    const zone = zoneLookup?.[zoneId] || { zone_id: zoneId };
    const selectedByClick = selectedZoneId === zoneId;
    const style = getStyle(zone, highlightedSet);

    if (selectedByClick) {
      return {
        color: "#14532d",
        weight: 5,
        fillColor: style.fillColor,
        fillOpacity: 0.78,
        dashArray: "6 4",
      };
    }

    return style;
  };

  const handleEachFeature = (feature, layer) => {
    const zoneId = feature?.properties?.zone_id;
    const zone = zoneLookup?.[zoneId] || { zone_id: zoneId };

    layer.bindPopup(buildPopupContent(zone));
    layer.on({
      mouseover: (event) => {
        event.target.setStyle({
          weight: Math.max((styleFeature(feature)?.weight || 2) + 1, 3),
          fillOpacity: 0.82,
        });
        onZoneHover?.(zoneId);
      },
      mouseout: (event) => {
        event.target.setStyle(styleFeature(feature));
        onZoneHover?.(null);
      },
      click: () => {
        onZoneClick?.(zone);
        layer.openPopup();
      },
    });
  };

  return (
    <div className="map-container" style={{ height: 560 }}>
      <MapContainer center={DEFAULT_CENTER} zoom={5} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToGeoJson geoJsonData={geoJsonData} />
        {geoJsonData ? (
          <GeoJSON
            key={`${selectedZoneId || "none"}-${[...highlightedSet].join(",")}`}
            data={geoJsonData}
            style={styleFeature}
            onEachFeature={handleEachFeature}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
