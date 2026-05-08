import os

import joblib
import pandas as pd

MODEL_PATH = os.path.join(os.path.dirname(__file__), "priority_model.pkl")
FEATURES = [
    "NDVI",
    "LST",
    "NDBI",
    "NDWI",
    "income",
    "soil_moisture",
    "drought_index",
    "temperature",
    "humidity",
    "evapotranspiration",
    "heatwave_days",
    "soil_ph",
    "soil_clay",
    "soil_sand",
    "organic_carbon",
    "bulk_density",
]


def _prepare_features(df):
    prepared = df.copy()
    for column in FEATURES:
        if column not in prepared.columns:
            prepared[column] = 0.0
        prepared[column] = pd.to_numeric(prepared[column], errors="coerce")
        prepared[column] = prepared[column].fillna(prepared[column].median())
        if prepared[column].isna().all():
            prepared[column] = 0.0
    return prepared


def _build_target(df):

    return (
        (1 - df["NDVI"]) * 0.20
        + df["LST"] * 0.15
        + df["NDBI"] * 0.10
        + (1 - df["NDWI"]) * 0.08

        + (1 - df["income"]) * 0.10

        + (1 - df["soil_moisture"]) * 0.12
        + df["drought_index"] * 0.15

        + (df["temperature"] / 45) * 0.05
        + (1 - df["humidity"] / 100) * 0.05
    )


def train_model(df):
    from sklearn.ensemble import RandomForestRegressor

    prepared = _prepare_features(df)
    X = prepared[FEATURES]
    y = _build_target(prepared)

    model = RandomForestRegressor(
        n_estimators=150,
        max_depth=10,
        random_state=42,
    )
    model.fit(X, y)
    joblib.dump(model, MODEL_PATH)
    return model


def load_model():
    if not os.path.exists(MODEL_PATH):
        return None
    return joblib.load(MODEL_PATH)


def predict(df, model=None):
    prepared = _prepare_features(df)
    resolved_model = model or load_model() or train_model(prepared)
    return resolved_model.predict(prepared[FEATURES])
