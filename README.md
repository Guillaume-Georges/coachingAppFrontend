Coach Training Frontend

Stack
- React + TypeScript + Vite
- Tailwind CSS
- React Router
- TanStack Query
- Zod, Zustand
- Auth0 SPA (optional for local mocks)

Getting Started
- Copy .env.example to .env.local and adjust values. For local mocks, keep VITE_MOCK_API=true.
- Install dependencies: npm install
- Run dev server: npm run dev

Auth0
- When VITE_AUTH0_* are not set, guards are bypassed for local development.

MSW mocks
- Enabled when VITE_MOCK_API=true. Flip to false to call a live API.

Project Structure
- src/app: AppShell and routes
- src/auth: Auth0 provider and guards
- src/api: fetch client, zod models, query hooks
- src/features: pages per domain
- src/components: UI building blocks and Cloudinary video

Exercises Library
- Routes: `/exercises` (library), `/exercises/:id` (detail), `/admin` (CMS)
- URL query is the source of truth for filters: `search, modality, category, equipment (multi), bodyPartFocus, musclesPrimary (multi), musclesSecondary (multi), page, limit, sort`.
- React Query caches list/detail and revalidates on focus (disabled in config) with 30s stale time.
- Cloudinary: player uses plain `<video>` with provided `videoUrl`. For uploads in admin, optional Cloudinary Upload Widget is used when both `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` are set; otherwise, paste URLs.

Env vars
- `VITE_API_BASE_URL` API base (e.g. http://localhost:4000)
- `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, `VITE_AUTH0_AUDIENCE`
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET` (optional, enables widget on Admin)
- `VITE_MOCK_API` set `true` to use MSW mocks

API assumptions (exercises)
- GET `/api/exercises?search=&modality=&category=&equipment=...&bodyPartFocus=&musclesPrimary=...&musclesSecondary=...&page=&limit=&sort=`
- GET `/api/exercises/:id`
- POST `/api/exercises` (admin)
- PUT `/api/exercises/:id` (admin)
- DELETE `/api/exercises/:id` (admin)

Run locally
1. `cp .env.example .env` and set values (keep `VITE_MOCK_API=true` initially).
2. `npm i`
3. `npm run dev`

Auth (local JWT)
- Login route: `/login`; Sign up route: `/signup`.
- Frontend hits backend endpoints:
  - POST `/api/auth/register` with `{ email, password, role?, adminSecret? }`
  - POST `/api/auth/login` with `{ email, password }` → returns `{ accessToken, user, expiresIn }` and sets refresh cookie
  - POST `/api/auth/refresh` with `credentials: 'include'` → rotates cookie
  - POST `/api/auth/logout` with `credentials: 'include'`
  - GET `/api/me` with `Authorization: Bearer <accessToken>`
