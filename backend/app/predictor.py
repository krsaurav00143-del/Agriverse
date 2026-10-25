"""Loads the Keras model once and turns image bytes into predictions."""
from __future__ import annotations

import io
import threading
import time
from typing import Any

import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

from . import config
from .classes import advice_for, load_class_names, parse_label


class InvalidImageError(ValueError):
    """Raised when the uploaded bytes are not a decodable image."""


class Predictor:
    def __init__(self) -> None:
        self.model = None
        self.class_names: list[str] = []
        self._lock = threading.Lock()

    # ------------------------------------------------------------------ loading
    def load(self) -> None:
        # Imported here so that importing the app (e.g. for tests) stays cheap.
        import keras

        if not config.MODEL_PATH.is_file():
            raise FileNotFoundError(f"Model file not found: {config.MODEL_PATH}")

        self.model = keras.models.load_model(config.MODEL_PATH, compile=False)
        self.class_names = load_class_names(config.CLASS_NAMES_PATH)

        n_out = int(self.model.output_shape[-1])
        if n_out != len(self.class_names):
            raise RuntimeError(
                f"Model has {n_out} outputs but {len(self.class_names)} class names are "
                f"configured. Fix models/class_names.json."
            )

        # Warm-up so the first real request is not slow.
        size = config.IMAGE_SIZE
        self.model(np.zeros((1, size, size, 3), dtype="float32"), training=False)

    @property
    def ready(self) -> bool:
        return self.model is not None

    # ------------------------------------------------------------ preprocessing
    @staticmethod
    def preprocess(data: bytes) -> np.ndarray:
        """bytes -> float32 array of shape (1, 224, 224, 3) with raw 0-255 pixel values.

        The saved model already contains Rescaling(1/255) + Normalization(ImageNet mean/std)
        inside its EfficientNetV2 backbone, so we must NOT scale or normalise here.
        """
        try:
            img = Image.open(io.BytesIO(data))
            img = ImageOps.exif_transpose(img)  # honour phone-camera rotation
            img = img.convert("RGB")            # drops alpha / handles grayscale, palette
        except (UnidentifiedImageError, OSError, ValueError) as exc:
            raise InvalidImageError("The file is not a valid image.") from exc

        size = config.IMAGE_SIZE
        img = img.resize((size, size), Image.BILINEAR)
        return np.asarray(img, dtype="float32")[None, ...]

    # --------------------------------------------------------------- inference
    def predict(self, data: bytes) -> dict[str, Any]:
        if not self.ready:
            raise RuntimeError("Model is not loaded")

        batch = self.preprocess(data)

        start = time.perf_counter()
        with self._lock:  # one inference at a time; keeps memory use predictable
            probs = np.asarray(self.model(batch, training=False))[0]
        elapsed_ms = round((time.perf_counter() - start) * 1000, 1)

        k = min(config.TOP_K, len(probs))
        top_idx = np.argsort(probs)[::-1][:k]

        def entry(i: int) -> dict[str, Any]:
            crop, disease, healthy = parse_label(self.class_names[i])
            return {
                "label": self.class_names[i],
                "crop": crop,
                "disease": disease,
                "is_healthy": healthy,
                "confidence": round(float(probs[i]), 4),
            }

        top = [entry(int(i)) for i in top_idx]
        best = top[0]
        description, treatment = advice_for(best["label"])
        low = best["confidence"] < config.LOW_CONFIDENCE_THRESHOLD

        if low:
            message = (
                "The model is not confident about this image. Try a clear, well-lit, "
                "close-up photo of a single leaf."
            )
        elif best["is_healthy"]:
            message = f"This {best['crop']} plant looks healthy."
        else:
            message = f"{best['crop']} leaf: {best['disease']} detected."

        return {
            "prediction": best["label"],
            "crop": best["crop"],
            "disease": best["disease"],
            "is_healthy": best["is_healthy"],
            "confidence": best["confidence"],
            "low_confidence": low,
            "top_predictions": top,
            "description": description,
            "treatment": treatment,
            "message": message,
            "inference_ms": elapsed_ms,
        }


predictor = Predictor()
