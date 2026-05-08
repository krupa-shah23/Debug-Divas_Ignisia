import numpy as np


def estimate_soil_moisture(rainfall, ndvi):
    return np.minimum(1.0, (rainfall / 50) * 0.5 + ndvi * 0.5)
