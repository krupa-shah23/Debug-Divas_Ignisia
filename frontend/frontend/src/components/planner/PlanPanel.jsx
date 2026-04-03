const PlanPanel = ({ selectedZones, budget, onRemoveZone }) => {
  const totalTrees = selectedZones.reduce((sum, z) => sum + z.recommended_trees, 0);
  const remaining = budget - totalTrees;
  const totalCooling = selectedZones.reduce((sum, z) => sum + z.estimated_cooling_c, 0);

  return (
    <div className="p-5 space-y-4">
      <div>
        <h2 className="text-xl font-bold">Intervention Plan</h2>
        <p className="text-sm text-gray-600">Selected high-impact zones</p>
      </div>

      <div className="space-y-3">
        {selectedZones.length === 0 ? (
          <div className="text-gray-500">No zones added yet.</div>
        ) : (
          selectedZones.map((zone) => (
            <div key={zone.zone_id} className="bg-white rounded-2xl shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{zone.zone_name}</p>
                  <p className="text-sm text-gray-600">
                    {zone.recommended_trees} trees • {zone.priority}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveZone(zone.zone_id)}
                  className="text-red-600 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-slate-50 rounded-2xl p-4 border">
        <p><span className="font-semibold">Budget:</span> {budget} trees</p>
        <p><span className="font-semibold">Used:</span> {totalTrees} trees</p>
        <p><span className="font-semibold">Remaining:</span> {remaining} trees</p>
        <p><span className="font-semibold">Projected Cooling:</span> -{totalCooling.toFixed(1)}°C</p>
      </div>
    </div>
  );
};

export default PlanPanel;