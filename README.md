<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1lHwCm6YNLQZ6T72SdxzSXMjS0nqvO07Q

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Choose the environment you want to run against and copy the matching example file:
   - Local dev (default): `.env.development.example` → `.env.development`
   - Staging: `.env.staging.example` → `.env.staging`
   - Production build: `.env.production.example` → `.env.production`
3. Fill in the Firebase + Gemini variables in the file you just copied:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID` (optional)
   - `GEMINI_API_KEY`
4. Run the app:
   - Development (uses `.env.development`): `npm run dev`
   - Staging mode (uses `.env.staging`): `npm run dev -- --mode staging`
   - Production build (uses `.env.production`): `npm run build`

Switching between a testing and live Firebase project is now just a matter of choosing which `.env.*` file to load.

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
