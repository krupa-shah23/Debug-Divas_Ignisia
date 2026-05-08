import pandas as pd

KELVIN_TO_CELSIUS_OFFSET = 273.15
KELVIN_THRESHOLD = 100


def to_celsius(value):
    if pd.isna(value):
        return value

    numeric_value = float(value)
    if numeric_value > KELVIN_THRESHOLD:
        return numeric_value - KELVIN_TO_CELSIUS_OFFSET

    return numeric_value


def ensure_lst_celsius(df, columns=None):
    columns = columns or ["LST"]

    for column in columns:
        if column in df.columns:
            df[column] = df[column].apply(to_celsius)

    return df


def normalize_record_lst(record, columns=None):
    columns = columns or ["LST", "lst", "lst_c", "temp_before", "temp_after"]

    normalized = dict(record)
    for column in columns:
        if column in normalized:
            normalized[column] = to_celsius(normalized[column])

    return normalized
