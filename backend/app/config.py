"""Settings, overridable with environment variables or a .env-style export."""
from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = Path(os.getenv("MODEL_PATH", BASE_DIR / "models" / "efficientnetv2b0_best.keras"))
CLASS_NAMES_PATH = Path(os.getenv("CLASS_NAMES_PATH", BASE_DIR / "models" / "class_names.json"))

IMAGE_SIZE = int(os.getenv("IMAGE_SIZE", "224"))          # model input is 224x224x3
MAX_UPLOAD_MB = float(os.getenv("MAX_UPLOAD_MB", "10"))
TOP_K = int(os.getenv("TOP_K", "3"))
# Below this top-1 confidence the API flags the result as uncertain.
LOW_CONFIDENCE_THRESHOLD = float(os.getenv("LOW_CONFIDENCE_THRESHOLD", "0.60"))

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173",
    ).split(",")
    if o.strip()
]
