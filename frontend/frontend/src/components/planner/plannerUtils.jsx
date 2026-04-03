export const getZoneColor = (priority, waterAccess) => {
  if (!waterAccess) return "#9CA3AF"; // gray if blocked due to no water

  switch (priority) {
    case "Very High":
      return "#DC2626"; // red
    case "High":
      return "#F97316"; // orange
    case "Medium":
      return "#EAB308"; // yellow
    case "Low":
      return "#22C55E"; // green
    default:
      return "#3B82F6";
  }
};

export const getPriorityBadgeClass = (priority) => {
  switch (priority) {
    case "Very High":
      return "bg-red-100 text-red-700";
    case "High":
      return "bg-orange-100 text-orange-700";
    case "Medium":
      return "bg-yellow-100 text-yellow-700";
    case "Low":
      return "bg-green-100 text-green-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
};