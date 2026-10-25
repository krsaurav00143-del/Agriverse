# AgriVerse – Plant Disease Detection

```
agriverse/
├─ frontend/   React + Vite (port 5173)
└─ backend/    FastAPI + Keras EfficientNetV2-B0 (port 8000)
   └─ models/efficientnetv2b0_best.keras
```

## Dependencies

- Backend Python packages are listed in `backend/requirements.txt`.
- Frontend Node.js packages (React, Vite, and the React Vite plugin) are listed in
  `frontend/package.json` and installed with `npm install` from `frontend/`.

## 1. Start the backend (Terminal 1)

Use **Python 3.10 – 3.12** (TensorFlow does not support newer versions yet).

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows   (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Check it: <http://localhost:8000/health> should show `"model_loaded": true`.
Interactive docs / test upload: <http://localhost:8000/docs>.

## 2. Start the frontend (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173> → **Predict** → upload a leaf photo → **Predict Disease**.
The badge at the top right shows **AI READY** when the backend is reachable.

## API

| Method | Path       | Description |
|--------|------------|-------------|
| GET    | `/health`  | Backend and model status |
| GET    | `/classes` | The 38 class names |
| POST   | `/predict` | multipart form, field `image` (JPG/PNG/WebP, max 10 MB) |

Example response:

```json
{
  "prediction": "Tomato___Late_blight",
  "crop": "Tomato", "disease": "Late blight", "is_healthy": false,
  "confidence": 0.9731, "low_confidence": false,
  "top_predictions": [{"label": "...", "crop": "...", "disease": "...", "is_healthy": false, "confidence": 0.97}],
  "description": "...", "treatment": ["..."], "message": "Tomato leaf: Late blight detected.",
  "inference_ms": 85.2
}
```

## Settings (environment variables, all optional)

`MODEL_PATH`, `CLASS_NAMES_PATH`, `MAX_UPLOAD_MB` (10), `LOW_CONFIDENCE_THRESHOLD` (0.60),
`ALLOWED_ORIGINS` (comma-separated; default is the Vite dev server). Frontend: `VITE_API_URL` in `frontend/.env`.

## ⚠️ Check the class order

A `.keras` file does not store class names. `backend/app/classes.py` uses the standard
alphabetical PlantVillage 38-class order, which is what Keras produces from class folders.
If your training folders were different, create `backend/models/class_names.json` with your
exact list **in training order** (JSON array of 38 strings) – it overrides the default.
Quick sanity test: upload a clearly healthy tomato leaf; if you get a wrong crop, the order is wrong.

## Preprocessing note

The model already contains rescaling and ImageNet normalisation, so the backend feeds raw
0–255 pixels resized to 224×224. Do not divide by 255 yourself.
