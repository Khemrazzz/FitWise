from __future__ import annotations

import json
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Literal

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "artifacts" / "workout_pipeline.joblib"
METADATA_PATH = BASE_DIR / "artifacts" / "model_metadata.json"

model: Any = None
metadata: dict[str, Any] = {}


class PredictionRequest(BaseModel):
    age: int = Field(ge=16, le=100)
    gender: Literal["Male", "Female"]
    weight_kg: float = Field(gt=25, le=300)
    height_m: float = Field(gt=1.2, le=2.3)
    fat_percentage: float = Field(ge=3, le=60)
    workout_frequency: int = Field(ge=1, le=7)
    experience_level: int = Field(ge=1, le=3)
    bmi: float = Field(gt=10, le=70)


@asynccontextmanager
async def lifespan(_: FastAPI):
    global model, metadata
    if not MODEL_PATH.exists() or not METADATA_PATH.exists():
        raise RuntimeError(
            "Model artefacts are missing. Run `python train.py` before starting the API."
        )
    model = joblib.load(MODEL_PATH)
    metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
    yield
    model = None


app = FastAPI(
    title="FitWise ML Prototype API",
    version="0.1.0",
    description="Prototype workout-category classifier for the FitWise FYP.",
    lifespan=lifespan,
)


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_version": metadata.get("model_version"),
        "feature_profile": metadata.get("feature_profile"),
    }


@app.post("/predict")
def predict(payload: PredictionRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded")

    frame = pd.DataFrame(
        [
            {
                "Age": payload.age,
                "Gender": payload.gender,
                "Weight (kg)": payload.weight_kg,
                "Height (m)": payload.height_m,
                "Fat_Percentage": payload.fat_percentage,
                "Workout_Frequency (days/week)": payload.workout_frequency,
                "Experience_Level": payload.experience_level,
                "BMI": payload.bmi,
            }
        ]
    )

    prediction = str(model.predict(frame)[0])

    probabilities = None
    confidence = None
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(frame)[0]
        classes = [str(c) for c in model.classes_]
        probabilities = {
            c: round(float(p), 4) for c, p in zip(classes, probs)
        }
        confidence = round(max(probabilities.values()), 4)

    return {
        "predictedWorkoutType": prediction,
        "confidence": confidence,
        "probabilities": probabilities,
        "modelName": metadata.get("model_name"),
        "modelVersion": metadata.get("model_version"),
        "featureProfile": metadata.get("feature_profile"),
        "disclaimer": (
            "This prototype predicts the workout category observed in the dataset. "
            "It is not medical advice and must not be represented as a clinically validated prescription."
        ),
    }
