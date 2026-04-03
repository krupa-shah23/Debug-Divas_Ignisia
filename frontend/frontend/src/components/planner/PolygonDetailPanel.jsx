import { getPriorityBadgeClass } from "./plannerUtils";

const PolygonDetailPanel = ({ zone, onAddToPlan, onCompare }) => {
  if (!zone) {
    return (
      <div className="p-6 text-gray-500">
        Click a zone on the map to view details.
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5 overflow-y-auto h-full">
      {/* 1. Area Header */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{zone.zone_name}</h2>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityBadgeClass(
              zone.priority
            )}`}
          >
            {zone.priority}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Impact Score: <span className="font-semibold">{zone.impact_score}/100</span>
        </p>
      </div>

      {/* 2. Core Metrics */}
      <div className="bg-white rounded-2xl shadow p-4 space-y-2">
        <h3 className="font-semibold text-gray-800">Core Metrics</h3>
        <p>🌳 Tree Canopy: {zone.tree_canopy_pct}%</p>
        <p>📉 NDVI: {zone.ndvi}</p>
        <p>🌡️ Surface Temp (LST): {zone.lst_c}°C</p>
        <p>👥 Vulnerability Index: {zone.vulnerability_index}</p>
        <p>🚰 Water Access: {zone.water_access ? "Available" : "Not Available"}</p>
      </div>

      {/* 3. Top Drivers */}
      <div className="bg-white rounded-2xl shadow p-4">
        <h3 className="font-semibold text-gray-800 mb-2">Top Drivers</h3>
        <ul className="list-disc pl-5 space-y-1">
          {zone.top_drivers.map((driver, idx) => (
            <li key={idx}>{driver}</li>
          ))}
        </ul>
      </div>

      {/* 4. AI Explanation */}
      <div className="bg-white rounded-2xl shadow p-4">
        <h3 className="font-semibold text-gray-800 mb-2">Why Selected</h3>
        <p className="text-gray-700">{zone.why_selected}</p>
      </div>

      {/* 5. Recommendation Card */}
      <div className="bg-white rounded-2xl shadow p-4 space-y-2">
        <h3 className="font-semibold text-gray-800">Recommendation</h3>
        <p>Suggested Trees: {zone.recommended_trees}</p>
        <p>Estimated Cooling: -{zone.estimated_cooling_c}°C</p>
        <p>Estimated Canopy Gain: +{zone.estimated_canopy_gain_pct}%</p>
        <p>
          Feasibility:{" "}
          <span
            className={`font-semibold ${
              zone.feasibility === "Blocked" ? "text-red-600" : "text-green-600"
            }`}
          >
            {zone.feasibility}
          </span>
        </p>
      </div>

      {/* 6. Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onAddToPlan(zone)}
          className="bg-emerald-600 text-white py-2 rounded-xl font-medium hover:bg-emerald-700"
        >
          Add to Plan
        </button>
        <button
          onClick={() => onCompare(zone)}
          className="bg-blue-600 text-white py-2 rounded-xl font-medium hover:bg-blue-700"
        >
          Compare
        </button>
        <button className="bg-gray-900 text-white py-2 rounded-xl font-medium hover:bg-black col-span-2">
          View Full Dashboard
        </button>
      </div>
    </div>
  );
};

export default PolygonDetailPanel;
