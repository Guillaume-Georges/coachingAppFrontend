Ronin's Creed Frontend

Stack
- React + TypeScript + Vite
- Tailwind CSS
- React Router
- TanStack Query
- Zod, Zustand
- Auth0 SPA (optional for local mocks)

Getting Started
- Copy `.env.example` to `.env` (or `.env.local`) and adjust values.
  - For local mocks, set `VITE_MOCK_API=true` (default in the example). This bypasses the real API and uses MSW.
  - To target a live API, set `VITE_MOCK_API=false` and point `VITE_API_BASE_URL` to your backend (e.g. `http://localhost:4000`).
- Install dependencies: `npm install`
- Run dev server: `npm run dev`

Auth
- Default: cookie-based refresh flow with a short-lived access token. On load, the client attempts `/api/auth/refresh`.
- Dev option: header/body refresh. When `VITE_USE_HEADER_REFRESH=true` (and backend `AUTH_DEV_EXPOSE_REFRESH=true`), the FE stores a refresh token in-memory (optionally localStorage in dev) and sends it via `X-Refresh-Token` on `/api/auth/refresh`. Cookie fallback remains enabled.
- UI is gated by an auth `ready` flag so admin controls do not flash during refresh.
- Auth0 can be integrated via `VITE_AUTH0_*`, but for local mocks this is not required.

MSW mocks
- Enabled when `VITE_MOCK_API=true`. Flip to `false` to call a live API.

Project Structure
- `src/app`: AppShell and routes
- `src/auth`: Auth provider and route guards
- `src/api`: API client (ETag support), models, query hooks
- `src/features`: pages per domain (exercises, home, admin, user)
- `src/components`: UI building blocks, upload helpers (Cloudinary)

Exercises Library
- Routes: `/home`, `/exercises` (library), `/exercises/:id` (detail)
- URL query is the source of truth for filters: `search, modality, category, equipment (multi), bodyPartFocus, musclesPrimary (multi), musclesSecondary (multi), page, limit, sort`.
- Lists request lean fields via `fields=id,name,thumbnailUrl,modality,bodyPartFocus,tags` for speed.
- Client automatically sends `If-None-Match` and uses cached bodies on `304` for fast reloads.
- Cloudinary: the admin form supports video upload and optional custom thumbnail upload. By default, thumbnails are generated from the video (first frame, square).
- Filter panel shows global facet counts for Modality, Category, Equipment and Body Part Focus.

Env vars
- `VITE_API_BASE_URL` API base (e.g. `http://localhost:4000`). Ignored when `VITE_MOCK_API=true`.
- `VITE_MOCK_API` (`true`/`false`) – enable local MSW mocks (default true in example).
- `VITE_CLOUDINARY_CLOUD_NAME` – Cloudinary cloud name.
- `VITE_CLOUDINARY_UPLOAD_PRESET` – unsigned preset for uploads (enables widget for admin uploads).
- Optional: `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, `VITE_AUTH0_AUDIENCE` if integrating Auth0.
- Dev-only: `VITE_USE_HEADER_REFRESH=true` to use `X-Refresh-Token` header on refresh (backend must set `AUTH_DEV_EXPOSE_REFRESH=true`).
- Dev-only: `VITE_DEV_PERSIST_REFRESH=false|true` to persist refresh token in localStorage (NOT recommended; dev only).

Backend (dev) alignment
- Set: `REFRESH_STATELESS=true`, `AUTH_DEV_EXPOSE_REFRESH=true`, `CORS_ORIGINS=http://localhost:5173,http://localhost:5174`.
- With these, backend accepts refresh via cookie, `X-Refresh-Token` header, or JSON body and returns `refreshToken` in JSON (dev only).

Production deployment
- Serve FE and BE on the same domain via nginx (no CORS needed). Keep cookie-based refresh (HttpOnly, SameSite=Lax, Path=/api/auth/refresh).
- Do NOT expose refresh token in JSON (`AUTH_DEV_EXPOSE_REFRESH=false`).
- Example nginx:
  - `location / { try_files $uri /index.html; }`
  - `location /api/ { proxy_pass http://127.0.0.1:4000; proxy_set_header Host $host; }`

API reference (selected)
- Exercises
  - GET `/api/exercises?search=&page=&limit=&fields=...` – supports `fields` to return lean objects.
  - GET `/api/exercises/:id`
  - POST `/api/exercises` (admin)
  - PUT `/api/exercises/:id` (admin)
  - DELETE `/api/exercises/:id` (admin)
  - Facets: GET `/api/meta/facets?facets=modalities,categories,equipment,bodyPartFocus[,&search=]` (client currently uses global counts)
- Auth
  - POST `/api/auth/register`
  - POST `/api/auth/login`
  - POST `/api/auth/refresh`
  - POST `/api/auth/logout`
  - GET `/api/me`
- Uploads
  - POST `/api/uploads/signature` with `{ resourceType: 'image' | 'video', folder? }`
- Home slides
  - Admin: GET `/api/home/slides`, PUT `/api/home/slides`
  - Public: GET `/api/home/slides/public` (active slides only)

Run locally
1. `cp .env.example .env` and set values (keep `VITE_MOCK_API=true` initially).
2. `npm i`
3. `npm run dev`

Caching & Persistence
- HTTP client-level ETag cache for GETs (`src/api/client.ts`). Client sends `If-None-Match` and serves cached bodies on `304 Not Modified`.
- React Query cache with tuned `staleTime`s:
  - Home hero slides: 10 minutes (`src/features/home/HomePage.tsx`).
  - Exercise Library list and prefetch: 5 minutes (`src/features/exercises/api.ts`).
- Persisted cache across reloads using `@tanstack/react-query-persist-client` in `src/main.tsx`:
  - Uses `localStorage` persister, 24h `maxAge`, and `VITE_CACHE_BUSTER` env for invalidation.
  - Excludes identity-sensitive queries like `user:profile` from persistence (see `shouldDehydrateQuery`).
  - If you add identity/security queries, consider excluding them as well.
  - On logout, we clear in-memory cache and remove the persisted cache key to avoid cross-account leakage.

Auth & user profile
- `useUserProfile` is keyed as `['user:profile', user.id]` to isolate data per account and prevent admin/member role leakage after switching users.

Auth (local JWT)
- Login route: `/login`; Sign up route: `/signup`.
- Frontend hits backend endpoints:
  - POST `/api/auth/register` with `{ email, password, role?, adminSecret? }`
  - POST `/api/auth/login` with `{ email, password }` → returns `{ accessToken, user, expiresIn }` and sets refresh cookie
  - POST `/api/auth/refresh` with `credentials: 'include'` → rotates cookie
  - POST `/api/auth/logout` with `credentials: 'include'`
  - GET `/api/me` with `Authorization: Bearer <accessToken>`
