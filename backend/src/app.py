import json
import logging
import sys
from inspect import signature
from typing import Any, Optional

from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from src.pipeline import run_pipeline

LOGGER = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class OptimizeRequest(BaseModel):
    city: str
    budget: int | str
    droughtMode: Optional[str] = None
    drought_mode: Optional[str] = None


def _normalize_drought_mode(drought_mode: Optional[str]) -> str:
    return (drought_mode or "normal").strip().lower()


def _build_error_response(exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=500, content={"error": str(exc)})


def _invoke_pipeline(city: str, budget: int | str, drought_mode: Optional[str] = None) -> dict[str, Any]:

    city = city.strip().lower()
    normalized_drought_mode = _normalize_drought_mode(drought_mode)
    parameters = signature(run_pipeline).parameters

    try:
        if "budget" in parameters and "drought_mode" in parameters:
            result = run_pipeline(city, budget, normalized_drought_mode)
        elif "drought_mode" in parameters:
            result = run_pipeline(city, drought_mode=normalized_drought_mode)
        elif "budget" in parameters:
            result = run_pipeline(city, budget)
        else:
            result = run_pipeline(city)
    except TypeError:
        # Gracefully fall back for older pipeline signatures that don't accept
        # drought mode and/or budget.
        if "budget" in parameters:
            result = run_pipeline(city, budget)
        else:
            result = run_pipeline(city)

    return jsonable_encoder(result)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/optimize")
def optimize(city: str, budget: int | str, drought_mode: Optional[str] = None) -> Any:
    try:
        return _invoke_pipeline(city, budget, drought_mode)
    except Exception as exc:
        LOGGER.exception("Optimization failed for city=%s budget=%s", city, budget)
        return _build_error_response(exc)


@app.post("/optimize")
def optimize_post(payload: OptimizeRequest) -> Any:
    drought_mode = payload.drought_mode or payload.droughtMode
    try:
        return _invoke_pipeline(payload.city, payload.budget, drought_mode)
    except Exception as exc:
        LOGGER.exception(
            "Optimization failed for city=%s budget=%s",
            payload.city,
            payload.budget,
        )
        return _build_error_response(exc)


def main() -> None:
    if len(sys.argv) < 3:
        raise SystemExit("Usage: python -m src.app <city> <budget> [drought_mode]")

    city = sys.argv[1]
    budget = int(sys.argv[2])
    drought_mode = sys.argv[3] if len(sys.argv) > 3 else "normal"
    print(json.dumps(_invoke_pipeline(city, budget, drought_mode)))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()
