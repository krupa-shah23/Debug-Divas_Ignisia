import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def generate_features(city, budget):

    print(f"\n===== SCORING: {city.upper()} | Budget: {budget} =====")

    # ==========================
    # LOAD REAL FEATURES
    # ==========================
    features_path = os.path.join(BASE_DIR, "data", "processed_csv", f"{city}_features.csv")

    if not os.path.exists(features_path):
        print(f"[ERROR] Missing features for {city}")
        return None

    df = pd.read_csv(features_path)

    if df.empty:
        print(f"[ERROR] Empty features file for {city}")
        return None

    print(f"[DEBUG] Loaded {len(df)} feature rows")

    # ==========================
    # NORMALIZATION FUNCTION
    # ==========================
    def normalize(series):
        min_val = series.min()
        max_val = series.max()

        if max_val - min_val == 0:
            return pd.Series([0.5] * len(series))  # neutral fallback

        return (series - min_val) / (max_val - min_val)

    # ==========================
    # ENSURE REQUIRED COLUMNS
    # ==========================
    required_cols = ["NDVI", "LST", "NDBI", "NDWI"]
    for col in required_cols:
        if col not in df.columns:
            print(f"[ERROR] Missing column: {col}")
            return None

    # ==========================
    # HANDLE INCOME (NEW)
    # ==========================
    if "income" not in df.columns:
        print("[WARNING] Income data missing → using neutral values")
        df["income"] = df["NDVI"].mean()  # dummy fallback (replace later with real data)

    # ==========================
    # NORMALIZE FEATURES
    # ==========================
    df["ndvi_n"] = normalize(df["NDVI"])
    df["lst_n"]  = normalize(df["LST"])
    df["ndbi_n"] = normalize(df["NDBI"])
    df["ndwi_n"] = normalize(df["NDWI"])
    df["income_n"] = normalize(df["income"])

    # ==========================
    # WATER CONSTRAINT
    # ==========================
    df["water_available"] = df["NDWI"] > df["NDWI"].median()

    df_filtered = df[df["water_available"] == True].copy()

    if df_filtered.empty:
        print("[WARNING] Water filter removed all → fallback to full dataset")
        df_filtered = df.copy()

    # ==========================
    # IMPACT SCORE (UPDATED)
    # ==========================
    df_filtered["impact_score"] = (
        (1 - df_filtered["ndvi_n"]) * 0.30 +   # low tree cover priority
        df_filtered["lst_n"] * 0.20 +          # heat intensity
        df_filtered["ndbi_n"] * 0.15 +         # built-up density
        (1 - df_filtered["ndwi_n"]) * 0.10 +   # low water access
        (1 - df_filtered["income_n"]) * 0.25   # low income priority
    )

    # ==========================
    # COST (SYNTHETIC)
    # ==========================
    df_filtered["cost"] = 80 + (df_filtered["ndbi_n"] * 70)

    # ==========================
    # EFFICIENCY SORT
    # ==========================
    df_filtered["efficiency"] = df_filtered["impact_score"] / df_filtered["cost"]
    df_filtered = df_filtered.sort_values(by="efficiency", ascending=False)

    # ==========================
    # BUDGET SELECTION (GREEDY)
    # ==========================
    total_cost = 0
    selected = []

    for _, row in df_filtered.iterrows():
        if total_cost + row["cost"] <= budget:
            selected.append(row["zone_id"])
            total_cost += row["cost"]

    df_filtered["selected"] = df_filtered["zone_id"].isin(selected)

    print(f"[DEBUG] Selected zones: {len(selected)} | Cost used: {round(total_cost, 2)}")

    # ==========================
    # SAVE OUTPUT
    # ==========================
    output_path = os.path.join(BASE_DIR, "data", "processed", f"scored_zones_{city}.csv")
    df_filtered.to_csv(output_path, index=False)

    print(f"[SUCCESS] Saved: {output_path}")

    return df_filtered


if __name__ == "__main__":

    USER_BUDGET = int(input("Enter budget: "))

    cities = [
        "delhi", "mumbai", "kolkata", "bangalore", "chennai",
        "hyderabad", "ahmedabad", "pune", "surat", "jaipur",
        "lucknow", "kanpur", "nagpur", "indore", "vadodara"
    ]

    for city in cities:
        generate_features(city, USER_BUDGET)

    print("\nSCORING COMPLETE")