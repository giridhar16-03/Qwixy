# Qwixy Study Planner

A React + Vite study planner app with Supabase authentication, calendar planning, analytics, and AI assistant integration.
https://qwixy.vercel.app/

<img width="1600" height="706" alt="image" src="https://github.com/user-attachments/assets/b32e1c56-3121-4c1f-8b9d-7a90d88a06c1" />
<img width="1600" height="702" alt="image" src="https://github.com/user-attachments/assets/431f4c84-0144-442e-9094-13cb12011c23" />
<img width="1600" height="700" alt="image" src="https://github.com/user-attachments/assets/aad306c8-0eff-46c6-8944-8a575e006907" />
<img width="1600" height="699" alt="image" src="https://github.com/user-attachments/assets/aa0eb4a1-f230-498b-a31e-f7e6a1a46d1e" />
<img width="1600" height="705" alt="image" src="https://github.com/user-attachments/assets/5fdd94aa-be7d-4310-ae63-62588de4f406" />
<img width="1600" height="706" alt="image" src="https://github.com/user-attachments/assets/d1f79917-0499-488b-9a23-affc7b3b1da6" />
<img width="1600" height="700" alt="image" src="https://github.com/user-attachments/assets/8b627c6e-06c3-4fe0-9620-4ce208b13297" />


## Features

- Email/password authentication with Supabase
- Google OAuth sign-in support
- User onboarding with profile persistence in Supabase
- Planner, calendar, and schedule management
- AI assistant integration through a configurable Qwixy API endpoint
- Responsive layout with Tailwind CSS

## Getting Started

### Requirements

- Node.js 18+ (or compatible)
- npm
- A Supabase project with Auth enabled
- Google OAuth credentials configured in both Google Cloud and Supabase

### Install dependencies

```bash
cd study-planner-qwixy.ai-main
npm install
```

### Configure environment variables

Copy the example environment file and update the values:

```bash
cp .env.example .env
```

Set the following values in `.env`:

- `VITE_GOOGLE_CLIENT_ID`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_QWIXY_API_URL`
- `VITE_QWIXY_API_KEY`
- `VITE_QWIXY_MODEL`

### Run locally

```bash
npm run dev
```

Open the app at `http://localhost:5173`.

### Production build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## GitHub Pages / Static Deploy

Use the GitHub Pages helper scripts:

```bash
npm run build:gh
npm run copy-docs
```

## Project Structure

- `src/` — React application source
- `src/contexts/` — auth and user state management
- `src/pages/` — page-level route components
- `src/lib/` — Supabase client and helper code
- `public/` — static assets
- `scripts/` — build and deploy utilities

## Notes

- Ensure the OAuth redirect URI is configured correctly for `/auth/callback`
- Verify Supabase project URL and anon key before running the app
- The app uses PKCE auth flow via Supabase

## License

This repository does not include a license file.
