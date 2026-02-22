# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev server (Vite, proxies /api to localhost:8080)
npm run dev

# Build (TypeScript check + Vite build)
npm run build

# Run all tests
npm test

# Run a single test file
NODE_OPTIONS=--require=./scripts/webcrypto-polyfill.cjs npx vitest run src/pages/SeatSelectionPage.test.tsx

# Run the integration flow test
npm run test:flow
```

Note: Tests require `NODE_OPTIONS=--require=./scripts/webcrypto-polyfill.cjs` for webcrypto support (already set in the `test` script).

## Architecture

React 18 SPA for a ticket booking platform with queue-based access control. Vite for dev/build, React Router v6 for routing, Zod for API response validation.

### API Layer (`src/api/`)

- **client.ts**: `TicketClient` class — HTTP GET/POST with Zod schema validation. All responses follow an envelope: `{ code, status, message, data }`.
- **contracts.ts**: Zod schemas and TypeScript types for all API models.
- **openTicketApi.ts**: Domain functions (`fetchEvents`, `enterQueue`, `fetchEventSeats`, `submitBooking`, etc.). Each creates a `TicketClient` with optional auth/queue tokens.
- Request headers: `Authorization: Bearer {token}`, `X-Queue-Token: {token}`, `X-Event-Id: {id}`.
- In dev, Vite proxies `/api` to `http://localhost:8080`. In tests, `VITE_API_BASE_URL` is set to `http://localhost:8080`.

### Auth (`src/auth/`)

- **storage.ts**: Auth token in localStorage (`open-ticket:auth-token`). Exports `getAuthToken`, `setAuthToken`, `clearAuthToken`, `isAuthenticated`.
- **queueStorage.ts**: Per-event queue tokens in localStorage (`open-ticket:queue-token:{eventId}`). Exports `getQueueToken`, `setQueueToken`, `clearQueueToken`.

### Routing (`src/router.tsx`)

- `/` — HomePage (public)
- `/login` — LoginPage (public)
- `/events/:eventId` — EventDetailPage (public)
- `/events/:eventId/seats` — SeatSelectionPage (protected via `RequireAuth`)
- `/events/:eventId/seats/queue` — QueuePage (protected via `RequireAuth`)

`RequireAuth` checks `isAuthenticated()` and redirects to `/login` if false.

### Booking Queue Flow

1. EventDetailPage: user clicks "예매하기" → `enterQueue()` → stores queue token
2. If phase is `WAITING` → QueuePage (polls every 2s until `ALLOWED`)
3. If phase is `ALLOWED` → SeatSelectionPage (fetches seats with queue token)
4. On expired/invalid queue token → redirect back to EventDetailPage with notice

### Mock Fallback

Pages fall back to mock data (`src/mocks/mockData.ts`) when the live API is unreachable, showing a "목 데이터 모드" badge.

## Testing

- **Vitest** with jsdom environment, setup in `src/test/setup.ts`
- **MSW** (Mock Service Worker) for HTTP mocking — `server` exported from `src/test/setup.ts`
- **React Testing Library** + `userEvent` for interactions
- Tests co-located with source files (e.g., `SeatSelectionPage.test.tsx` next to `SeatSelectionPage.tsx`)
- `afterEach`: cleanup, `localStorage.clear()`, `server.resetHandlers()`
- Test pattern: create `createMemoryRouter` with routes, render via `RouterProvider`, use MSW handlers for API responses

## UI Conventions

- All user-facing text is in Korean
- CSS custom properties defined in `src/styles/tokens.css`
- Font: Manrope (Google Fonts)
- Component classes: `page-shell`, `card`, `fade-in`, `mode-pill`, `button-primary`, `button-secondary`
