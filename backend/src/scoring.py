import pandas as pd
import numpy as np

# ==========================
# LOAD DATA
# ==========================
df = pd.read_csv("../data/final_dataset.csv")

# ==========================
# NORMALIZATION
# ==========================
def normalize(series):
    return (series - series.min()) / (series.max() - series.min())

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
# SOCIOECONOMIC FACTOR (MOCK)
# ==========================
# Lower value = worse (higher priority)
np.random.seed(42)
df["income_score"] = np.random.uniform(0, 1, len(df))
df["income_n"] = 1 - df["income_score"]  # lower income = higher priority

# ==========================
# IMPACT SCORE
# ==========================
df["priority_score"] = (
    (1 - df["ndvi_n"]) * 0.30 +   # low greenery
    df["lst_n"] * 0.25 +          # high heat
    df["ndbi_n"] * 0.15 +         # built-up
    (1 - df["ndwi_n"]) * 0.10 +   # low water
    df["income_n"] * 0.20         # socioeconomic factor
)

# ==========================
# WATER CONSTRAINT
# ==========================
# Only allow zones with enough water
df["water_ok"] = df["NDWI"] > df["NDWI"].median()

df_filtered = df[df["water_ok"] == True]

# ==========================
# PRIORITIZATION
# ==========================
df_filtered = df_filtered.sort_values(by="priority_score", ascending=False)

# ==========================
# BUDGET CONSTRAINT
# ==========================
# Assume each zone = 10 trees
TOTAL_TREES = 100
TREES_PER_ZONE = 10

max_zones = TOTAL_TREES // TREES_PER_ZONE

selected_zones = df_filtered.head(max_zones)

# ==========================
# EXPLAINABILITY
# ==========================
def explain(row):
    reasons = []
    
    if row["NDVI"] < 0.3:
        reasons.append("Low tree cover")
    if row["LST"] > df["LST"].mean():
        reasons.append("High temperature")
    if row["NDBI"] > df["NDBI"].mean():
        reasons.append("Dense urban area")
    if row["income_score"] < 0.5:
        reasons.append("Low income area")
    
    return ", ".join(reasons)

df_filtered["reason"] = df_filtered.apply(explain, axis=1)
selected_zones["reason"] = selected_zones.apply(explain, axis=1)

# ==========================
# SAVE OUTPUTS
# ==========================
df.to_csv("../data/final_scored.csv", index=False)
df_filtered.to_csv("../data/filtered_zones.csv", index=False)
selected_zones.to_csv("../data/selected_zones.csv", index=False)

print("Pipeline complete!")
print(f"Selected {len(selected_zones)} zones under budget.")