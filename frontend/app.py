from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.optimizer import run_optimization
from pydantic import BaseModel




app = FastAPI()



class AnalyzeRequest(BaseModel):
    lat: float
    lng: float

@app.post("/analyze")
async def analyze(data: AnalyzeRequest):
    lat = data.lat
    lng = data.lng

    # 🔥 mock logic (replace later)
    score = (abs(lat) + abs(lng)) % 1

    return {
        "location": [lat, lng],
        "score": round(score, 2),
        "priority": "HIGH" if score < 0.5 else "LOW",
        "trees_needed": int((1 - score) * 100)
    }

@app.get("/zones")
def get_zones():
    return [
        {"id": 1, "score": 0.7},
        {"id": 2, "score": 0.4},
        {"id": 3, "score": 0.9}
    ]

# ✅ CORS (important for React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Tree Equity API running 🚀"}


# -------------------------------
# GET ZONES
# -------------------------------
@app.get("/api/zones")
def get_zones():
    df, selected, total, season = run_optimization()

    return {
        "zones": df.to_dict(orient="records")
    }


# -------------------------------
# OPTIMIZATION
# -------------------------------
@app.post("/api/optimize")
def optimize(payload: dict):
    budget = payload.get("budget", 100)
    method = payload.get("method", "greedy")

    df, selected, total, season = run_optimization(
        budget=budget,
        method=method
    )

    return {
        "zones": df.to_dict(orient="records"),
        "selected": selected,
        "trees_used": int(total),
        "season": season
    }