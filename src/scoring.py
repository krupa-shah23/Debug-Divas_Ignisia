import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import datetime


# -------------------------------
# 1. LOAD DATA
# -------------------------------
def load_data(csv_path="data/zones_features.csv"):
    df = pd.read_csv(csv_path)
    return df

np.random.seed(42)


# -------------------------------
# 2. FEATURE ENGINEERING
# -------------------------------
def compute_ndvi_lst_mock(df):
    np.random.seed(42)
    if "NDVI" not in df.columns:
        df["NDVI"] = np.random.uniform(0.1, 0.8, size=len(df))
    if "LST" not in df.columns:
        df["LST"] = np.random.uniform(25, 45, size=len(df))
    return df

def add_mock_features(df):
    df = compute_ndvi_lst_mock(df)
    
    np.random.seed(42)
    # Mocking population and income_index if missing
    if "population_density" not in df.columns:
        df["population_density"] = np.random.randint(1000, 10000, size=len(df))
    if "income_index" not in df.columns:
        df["income_index"] = np.random.uniform(0, 1, size=len(df))
    
    # Vulnerability
    df["vulnerability"] = df["population_density"] * (1 - df["income_index"])
    
    # 3. TREE CANOPY CLASSIFICATION
    if "NDVI" in df.columns:
        df["tree_cover"] = df["NDVI"] > 0.4
        df["tree_coverage_ratio"] = df["NDVI"].apply(lambda x: max(0.0, min(1.0, x / 0.8)))
    else:
        df["tree_cover"] = False
        df["tree_coverage_ratio"] = 0.0
        
    df["deficit"] = 1.0 - df["tree_coverage_ratio"]
    # assume trees_per_zone = proportional to deficit
    df["trees_needed"] = (
    (df["deficit"] * np.random.randint(30, 100, size=len(df)))
).astype(int)

    # Water availability
    if "water_available" not in df.columns:
        df["water_available"] = np.random.choice([True, False], size=len(df), p=[0.8, 0.2])

    # Worker Heat Burden (Bonus)
    if "LST" in df.columns:
        df["worker_heat_burden"] = df["LST"] * 1.2
        # Season Tag
        df["season_tag"] = df["LST"].apply(lambda x: "Summer Priority" if x > 40 else "Standard")

    # Season tagging
    month = datetime.datetime.now().month
    season = "monsoon" if 6 <= month <= 9 else "summer"
    df["season"] = season

    return df, season


# -------------------------------
# 3. NORMALIZATION (SAFE + SCALABLE)
# -------------------------------
def normalize_features(df):
    scaler = MinMaxScaler()

    cols = ["NDVI", "LST", "vulnerability"]
    
    if "NDBI" in df.columns:
        cols.append("NDBI")
        
    # Provide fallbacks if missing
    for c in cols:
        if c not in df.columns:
            df[c] = 0.5
            
    # Handle missing values
    df[cols] = df[cols].fillna(df[cols].median())

    df[[f"{c}_norm" for c in cols]] = scaler.fit_transform(df[cols])

    return df


# -------------------------------
# 4. IMPACT SCORING ENGINE
# -------------------------------
def compute_impact_score(df):
    w1, w2, w3 = 0.4, 0.3, 0.3

    df["impact_score"] = (
        w1 * (1 - df["NDVI_norm"]) +
        w2 * df["LST_norm"] +
        w3 * df["vulnerability_norm"]
    ).round(3)

    return df


# -------------------------------
# 5. EXPLAINABILITY ENGINE
# -------------------------------
def generate_explanations(df):
    def explain(row):
        reasons = []

        if row.get("NDVI_norm", 0.5) < 0.4:
            reasons.append("low NDVI")

        if row.get("LST_norm", 0.5) > 0.6:
            reasons.append("high temperature")

        if row.get("vulnerability_norm", 0.5) > 0.6:
            reasons.append("high vulnerability")

        reason_str = ", ".join(reasons) if reasons else "moderate conditions"
        return f"Selected because: {reason_str}"

    df["explanation"] = df.apply(explain, axis=1)

    return df


# -------------------------------
# 6. RANKING ENGINE
# -------------------------------
def rank_zones(df):
    df = df.sort_values("impact_score", ascending=False).reset_index(drop=True)
    df["priority_rank"] = df.index + 1
    return df


# -------------------------------
# 7. FULL PIPELINE
# -------------------------------
def run_scoring_pipeline(csv_path="data/zones_features.csv"):
    df = load_data(csv_path)
    df, season = add_mock_features(df)
    df = normalize_features(df)
    df = compute_impact_score(df)
    df = generate_explanations(df)
    df = rank_zones(df)

    return df, season


# -------------------------------
# 8. TEST RUN
# -------------------------------
if __name__ == "__main__":
    df, season = run_scoring_pipeline()

    print("\n=== SCORING OUTPUT ===\n")
    print(df[[
        "zone_id",
        "impact_score",
        "priority_rank",
        "water_available",
        "explanation"
    ]])

    print(f"\nSeason detected: {season}")