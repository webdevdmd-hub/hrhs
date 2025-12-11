# HR Nexus
Vite + React HR dashboard using Firebase Auth/Firestore for user and employment records.

## Prerequisites
- Node.js 18+

## Install
```bash
npm install
```

## Environment
Choose the env file for the mode you run:
- `.env.development` (used by `npm run dev`)
- `.env.production` (used by `npm run build` / `npm run preview`)
- `.env.local` (optional overrides on your machine)

Required keys (set these in the chosen `.env.*`):
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...      # optional
GEMINI_API_KEY=...                    # optional demo usage
```

## Run
- Dev: `npm run dev`
- Build: `npm run build`
- Preview built assets: `npm run preview`
- Alternate mode (e.g., staging): `npm run dev -- --mode staging`

## Key workflows
- **Add Team Member:** From User Management, creates a Firebase Auth user and a Firestore user record.
- Lists refresh after saves so new entries appear immediately.
- **Payroll & Compensation:** Go to `/payroll` (also linked from the sidebar). Manage salary, benefits, taxes, and incentive data with editable cards for compensation, payment details, benefit enrollments, tax documents, and bonus tracking.

## Tech stack
- Vite + React + TypeScript
- Firebase Auth + Firestore
- Tailwind (via CDN in `index.html`)
- Lucide icons, Recharts
