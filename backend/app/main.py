"""AgriVerse plant-disease API.

Run (from the backend/ folder):
    uvicorn app.main:app --reload --port 8000
Docs: http://localhost:8000/docs
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from . import config
from .predictor import InvalidImageError, predictor

logger = logging.getLogger("agriverse")
logging.basicConfig(level=logging.INFO)

ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("Loading model from %s ...", config.MODEL_PATH)
    predictor.load()
    logger.info("Model ready (%d classes).", len(predictor.class_names))
    yield


app = FastAPI(title="AgriVerse API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"name": "AgriVerse API", "docs": "/docs", "health": "/health"}


@app.get("/health")
def health():
    return {
        "status": "ok" if predictor.ready else "loading",
        "model_loaded": predictor.ready,
        "num_classes": len(predictor.class_names),
    }


@app.get("/classes")
def classes():
    return {"classes": predictor.class_names}


@app.post("/predict")
def predict(image: UploadFile = File(...)):
    """Accepts multipart form data with the file in the field `image`."""
    if not predictor.ready:
        raise HTTPException(503, "Model is still loading. Try again in a moment.")

    if (image.content_type or "").lower() not in ALLOWED_TYPES:
        raise HTTPException(415, "Unsupported file type. Please upload a JPG, PNG or WebP image.")

    max_bytes = int(config.MAX_UPLOAD_MB * 1024 * 1024)
    data = image.file.read(max_bytes + 1)  # read at most limit+1 bytes
    if len(data) > max_bytes:
        raise HTTPException(413, f"Image is too large (max {config.MAX_UPLOAD_MB:g} MB).")
    if not data:
        raise HTTPException(400, "The uploaded file is empty.")

    try:
        return predictor.predict(data)
    except InvalidImageError as exc:
        raise HTTPException(400, str(exc)) from exc
    except Exception:  # noqa: BLE001 - never leak internals to the client
        logger.exception("Prediction failed")
        raise HTTPException(500, "Prediction failed. Please try again.") from None
