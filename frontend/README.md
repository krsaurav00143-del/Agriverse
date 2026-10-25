# AgriVerse Frontend

React + Vite frontend for the AgriVerse smart farming platform.

## Included
- Login and registration UI
- AgriVerse logo as authentication background
- Registration: name, contact number, optional Gmail, password
- Login: contact number or username + password
- Homepage with browser-based automatic location detection
- Live weather using Open-Meteo
- Top-left AgriVerse branding
- Top-right profile, Predict navigation and search
- Profile menu with photo/avatar, Farmer ID, name, contact, field, edit, settings, help and logout
- Plant disease prediction upload/take-photo UI
- Plant disease prediction wired to the FastAPI backend (`POST /predict`)
- Responsive mobile navigation

## Run
```bash
npm install
npm run dev
```

Run the backend separately from the `backend/` directory:
```bash
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Open the frontend URL printed by Vite. The frontend defaults to `http://localhost:8000`
for the API; set `VITE_API_URL` in `frontend/.env` if the backend uses another URL.
The backend allows local frontend origins on any port, which also works when Vite
selects a different port because its default port is already in use.

## Backend endpoints
The prediction page sends the image to `POST /predict` as multipart form data in the
`image` field. Confirm the backend is running at `http://localhost:8000/health` and
reports `"model_loaded": true` before submitting an image.

## Notes
Until backend URLs are added, login/registration run in frontend demo mode using localStorage. The weather panel uses the browser's geolocation permission and Open-Meteo's public forecast service.
