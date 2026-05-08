from src.explain import get_zone_reason
from src.generate_scored_data import DROUGHT_MULTIPLIERS, MIN_SCORE, generate_features
from src.simulate import simulate_city


def _serialize_zone(row):
    zone = {
        "zone_id": str(row["zone_id"]),
        "priority_score": round(float(row["priority_score"]), 4),
        "water_feasible": bool(row["water_feasible"]),
        "water_ok": bool(row.get("water_ok", row["water_feasible"])),
        "LST": round(float(row["LST"]), 2),
        "NDVI": round(float(row["NDVI"]), 4),
        "soil_moisture": round(float(row.get("soil_moisture", 0.0)), 2),
        "drought_index": round(float(row.get("drought_index", 0.3)), 2),
        "risk_level": str(row.get("risk_level", "Low")),
        "trees": int(row.get("trees", 0)),
        "selected": bool(row.get("selected", False)),
    }
    zone["reason"] = get_zone_reason(zone)
    return zone


def allocate_trees(zone, drought_mode="normal"):
    if zone["priority_score"] < MIN_SCORE:
        return 0

    drought_multiplier = DROUGHT_MULTIPLIERS.get(drought_mode, 0.0)
    base = 100
    factor = (
        zone["priority_score"] * 10
        + zone["NDVI"] * 50
        - zone["LST"]
        + zone["soil_moisture"] * 40
    )
    tree_count = max(20, int(base + factor))
    tree_count = max(0, int(tree_count * (1 - zone.get("drought_index", 0.3) * 0.5)))
    tree_count = max(0, int(tree_count * (1 - drought_multiplier * 0.15)))
    return tree_count


def select_zones(zones, drought_mode):
    soil_penalty = {
        "normal": 0.0,
        "moderate": 1.0,
        "severe": 2.0,
    }.get(drought_mode, 0.0)

    for zone in zones:
        zone["selected"] = False

        if soil_penalty and zone.get("soil_moisture", 0.3) < 0.25:
            zone["priority_score"] -= soil_penalty

        if not zone.get("water_feasible", True):
            zone["priority_score"] -= 2

        zone["priority_score"] = max(0, zone["priority_score"])

    valid_zones = [
        zone for zone in zones
        if zone.get("water_feasible", True) and zone["priority_score"] >= MIN_SCORE
    ]
    if len(valid_zones) >= 3:
        selected_zones = sorted(
            valid_zones,
            key=lambda x: x["priority_score"],
            reverse=True,
        )[:3]
    else:
        selected_zones = sorted(
            valid_zones,
            key=lambda x: x["priority_score"],
            reverse=True,
        )[:3]
        remaining = 3 - len(selected_zones)
        fallback_zones = sorted(
            [
                zone for zone in zones
                if (not zone.get("water_feasible", True))
                and zone["priority_score"] >= MIN_SCORE
                and zone.get("soil_moisture", 0) > 0.2
            ],
            key=lambda x: x["priority_score"],
            reverse=True,
        )[:remaining]
        selected_zones = selected_zones + fallback_zones

    for zone in selected_zones:
        zone["selected"] = True
        zone["trees"] = allocate_trees(zone, drought_mode)

    return selected_zones


def run_pipeline(city, budget=None, drought_mode="normal"):
    normalized_budget = 500 if budget is None else int(budget)
    scored_df = generate_features(city, normalized_budget, drought_mode=drought_mode)
    zones = [_serialize_zone(row) for _, row in scored_df.iterrows()]
    selected_zones = select_zones(zones, drought_mode)

    selected_by_zone = {zone["zone_id"]: zone for zone in selected_zones}
    scored_df["selected"] = scored_df["zone_id"].astype(str).isin(selected_by_zone)
    scored_df["trees"] = scored_df.apply(
        lambda row: selected_by_zone.get(str(row["zone_id"]), {}).get("trees", 0),
        axis=1,
    )
    simulation = simulate_city(city, scored_df)
    total_trees = sum(zone["trees"] for zone in selected_zones)
    count_selected = len(selected_zones)

    return {
        "city": city,
        "budget": normalized_budget,
        "drought_mode": drought_mode,
        "zones": zones,
        "selected_zones": selected_zones,
        "simulation": simulation,
        "total_trees": total_trees,
        "count_selected": count_selected,
        "summary": {
            "total_trees": total_trees,
            "count_selected": count_selected,
        },
    }
