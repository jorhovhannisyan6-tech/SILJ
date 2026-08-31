# SIL Insurance — Production Build

This package is prepared for Google AI Studio / Cloud Run deployment.

### Commands
```bash
npm ci
npm run build
npm start
```

### Important
Production must use the server process, not the Vite development server.
Set secrets through the deployment environment; never put credentials in the frontend.

For a true multi-instance production deployment, connect PostgreSQL and Redis/shared session storage before storing real customer data.
