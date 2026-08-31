# Cloud Run / Google AI Studio production deployment

## Build / start contract
- Build: `npm run build`
- Start: `npm start`
- Production server must listen on `0.0.0.0:$PORT`.
- Do not use `vite`, `vite --host`, or HMR/WebSocket in production.
- The frontend is served from the built `dist/` directory.

## Required secrets / variables
- `SIL_ADMIN_USERNAME`
- `SIL_ADMIN_PASSWORD`
- `GEMINI_API_KEY`
- `APP_URL`

Never commit these values to source control.

## Health
The application should expose `/api/health` and return HTTP 200 when the process is ready.

## Production data
Use a managed PostgreSQL database and shared session/queue storage (e.g. Redis) for multi-instance Cloud Run deployments. Do not rely on process memory for durable users, sessions, quotes, approvals, or audit history.
