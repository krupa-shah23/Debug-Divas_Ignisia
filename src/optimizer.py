from src.scoring import run_scoring_pipeline


# -------------------------------
# 1. APPLY CONSTRAINTS
# -------------------------------
def apply_constraints(df):
    return df[df["water_available"] == True].copy()


# -------------------------------
# 2. GREEDY SELECTION
# -------------------------------
def greedy_selection(df, budget):
    selected = []
    total = 0

    for _, row in df.iterrows():
        if total + row["trees_needed"] <= budget:
            selected.append(row["zone_id"])
            total += row["trees_needed"]

    return selected, total


# -------------------------------
# 3. KNAPSACK (REAL IMPLEMENTATION)
# -------------------------------
def knapsack_selection(df, budget):
    n = len(df)

    weights = df["trees_needed"].tolist()
    values = df["impact_score"].tolist()
    zones = df["zone_id"].tolist()

    dp = [[0]*(budget+1) for _ in range(n+1)]

    for i in range(1, n+1):
        for w in range(budget+1):
            if weights[i-1] <= w:
                dp[i][w] = max(
                    values[i-1] + dp[i-1][w - weights[i-1]],
                    dp[i-1][w]
                )
            else:
                dp[i][w] = dp[i-1][w]

    # Backtrack
    selected = []
    w = budget

    for i in range(n, 0, -1):
        if dp[i][w] != dp[i-1][w]:
            selected.append(zones[i-1])
            w -= weights[i-1]

    selected_zones = selected[::-1]

    total_trees = sum(
        df[df["zone_id"].isin(selected_zones)]["trees_needed"]
    )

    return selected_zones, int(total_trees)


# -------------------------------
# 4. MAIN OPTIMIZATION PIPELINE
# -------------------------------
def run_optimization(budget=100, method="greedy"):
    df, season = run_scoring_pipeline()

    # Apply constraint
    feasible = apply_constraints(df)

    # Sort by priority
    feasible = feasible.sort_values("impact_score", ascending=False)

    if method == "greedy":
        selected, total = greedy_selection(feasible, budget)

    elif method == "knapsack":
        selected, total = knapsack_selection(feasible, budget)

    else:
        raise ValueError("Invalid method")

    # Mark results
    df["selected"] = df["zone_id"].isin(selected)
    df["trees_allocated"] = df.apply(
        lambda r: r["trees_needed"] if r["zone_id"] in selected else 0,
        axis=1
    )

    return df, selected, total, season


# -------------------------------
# 5. TEST RUN
# -------------------------------
if __name__ == "__main__":
    df, selected, total, season = run_optimization(budget=100, method="knapsack")

    print("\n=== OPTIMIZATION OUTPUT ===\n")
    print(df[[
        "zone_id",
        "impact_score",
        "trees_needed",
        "water_available",
        "selected"
    ]])

    print(f"\nSelected Zones: {selected}")
    print(f"Total Trees Used: {total}")
    print(f"Season: {season}")