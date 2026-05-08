import pandas as pd
import numpy as np
from src.lst_utils import ensure_lst_celsius

# 🔥 NEW: ML import
from src.models.priority_model import predict


# ==========================
# LOAD DATA
# ==========================
df = pd.read_csv("../data/final_dataset.csv")
df = ensure_lst_celsius(df)


# ==========================
# DATA CLEANING (NEW)
# ==========================
df["NDVI"] = df["NDVI"].clip(-1, 1)
df["LST"] = df["LST"].clip(20, 60)


# ==========================
# NORMALIZATION
# ==========================
def normalize(series):
    min_val = series.min()
    max_val = series.max()

    if max_val - min_val == 0:
        return pd.Series([0.5] * len(series))

    return (series - min_val) / (max_val - min_val)


df["ndvi_n"] = normalize(df["NDVI"])
df["lst_n"]  = normalize(df["LST"])
df["ndbi_n"] = normalize(df["NDBI"])
df["ndwi_n"] = normalize(df["NDWI"])


# ==========================
# TREE CLASSIFICATION
# ==========================
df["tree_category"] = pd.cut(
    df["NDVI"],
    bins=[-1, 0.2, 0.4, 1],
    labels=["Low", "Medium", "High"]
)


# ==========================
# REALISTIC INCOME (FIXED)
# ==========================
# Proxy: more built-up → lower income
df["income"] = 1 - df["NDBI"]


# ==========================
# ML-BASED IMPACT SCORE 🔥
# ==========================
df["priority_score"] = predict(df)


# ==========================
# WATER CONSTRAINT (IMPROVED)
# ==========================
df["water_score"] = (
    df["NDWI"] * 0.6 +
    (1 - df["ndbi_n"]) * 0.4
)

df["water_ok"] = df["water_score"] > 0.4

df_filtered = df[df["water_ok"] == True].copy()


# ==========================
# COST MODEL (NEW)
# ==========================
df_filtered["cost"] = 80 + (df_filtered["ndbi_n"] * 70)


# ==========================
# EFFICIENCY (IMPORTANT)
# ==========================
df_filtered["efficiency"] = df_filtered["priority_score"] / df_filtered["cost"]

df_filtered = df_filtered.sort_values(by="efficiency", ascending=False)


# ==========================
# BUDGET (IMPROVED GREEDY)
# ==========================
TOTAL_TREES = user_budget

total_cost = 0
selected = []

for _, row in df_filtered.iterrows():
    if total_cost + row["cost"] <= TOTAL_BUDGET:
        selected.append(row["zone_id"])
        total_cost += row["cost"]

selected_zones = df_filtered[df_filtered["zone_id"].isin(selected)].copy()


# ==========================
# EXPLAINABILITY (UPGRADED)
# ==========================
def explain(row):
    reasons = []

    if row["NDVI"] < 0.3:
        reasons.append("Low canopy cover")

    if row["LST"] > df["LST"].mean():
        reasons.append("Urban heat hotspot")

    if row["NDBI"] > df["NDBI"].mean():
        reasons.append("Dense built-up zone")

    if row["water_ok"] == False:
        reasons.append("Water constraint")

    return ", ".join(reasons)


df_filtered["reason"] = df_filtered.apply(explain, axis=1)
selected_zones["reason"] = selected_zones.apply(explain, axis=1)

def compute_survival(zone):
    ndvi = zone["ndvi"]
    rainfall = zone["rainfall"]
    temp = zone["temperature"]

    temp_penalty = max(0, (temp - 30) * 0.02)

    survival = (
        0.5 * ndvi +
        0.3 * (rainfall / 200) -
        0.2 * temp_penalty
    )

    return round(max(0.7, min(survival, 1.0)) * 100, 2)

def compute_score(zone, survival, drought_mode):
    water_weight = 0.5 if drought_mode else 0.2
    temp_penalty = 0.3 if drought_mode else 0.1

    score = (
        survival * 0.6 +
        zone["ndvi"] * 0.3 -
        zone["temperature"] * temp_penalty +
        zone["soil_moisture"] * water_weight
    )

    return score

# ==========================
# SAVE OUTPUTS
# ==========================
df.to_csv("../data/final_scored.csv", index=False)
df_filtered.to_csv("../data/filtered_zones.csv", index=False)
selected_zones.to_csv("../data/selected_zones.csv", index=False)


print("Pipeline complete!")
print(f"Selected {len(selected_zones)} zones under budget.")
