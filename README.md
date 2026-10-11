# SignBridge AI

Browser-based hand tracking and static-sign recognition, with an optional FastAPI backend.

## Run the frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev        # http://localhost:5173
```
Needs internet on first load (MediaPipe WASM from jsDelivr, hand model from Google storage). Use `localhost` or HTTPS for camera access.

## Run the backend (optional)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Train a vocabulary
1. Live Recognition > Start camera > "Teach a sign". Name a static hand shape, press Record, repeat per sign.
2. Samples are stored in your browser. "Export model" downloads `signs.json`; put it in `frontend/public/models/signs.json` to ship it (and `backend/app/models/` for the API).

## What is real vs. not
- Real: webcam, MediaPipe landmarks, overlay, k-NN recognition of signs YOU trained, debouncing, copy/TXT download, browser speech, in-browser video processing.
- Not included: any pretrained sign vocabulary, motion signs (Hello, Thank You), two-handed or facial grammar, accuracy numbers. The "mode" badge says "Tracking only" until signs are trained. Nothing is simulated.
- Not yet tested: this was written without network access, so `npm install`/build were not run. Run `npm run typecheck` first and fix any small errors.

## Next step toward a real model
Collect landmark sequences (30 frames) per sign, train an LSTM/GRU in Keras, convert to TF.js or serve from the backend, and replace `predict()` in `src/services/recognizer.ts`.

## Deploy
Frontend: `npm run build`, deploy `frontend/dist` to Netlify/Vercel/GitHub Pages (HTTPS required for camera). Backend: any host that runs uvicorn (Render, Railway); set `ALLOWED_ORIGIN` and `VITE_API_URL`.
