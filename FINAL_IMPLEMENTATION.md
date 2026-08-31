# SIL Insurance — Final Implementation

Implemented layers:
- Product-specific quotation routing and templates.
- CASCO Excel regression lab and fixed calculator source rules.
- Insurance conditions knowledge base with product isolation.
- Animated SIL-style service mega menu and direct product-to-quote navigation.
- Login, registration pending approval, role-based access, logout and password reset by Admin.
- Roles: Agent, Underwriter, Manager, Auditor, Admin.
- Audit Logs with user/action/entity/details search.
- Admin Control Center: users, approvals, rules, templates, security, analytics, system settings.
- Smart Operations: duplicate detection, next action, renewal center, document center.
- AI Insurance Copilot / contextual assistant; AI is not the source of tariff decisions.
- Cloud Run production server: build-time Vite build, runtime Express only, 0.0.0.0:$PORT, no production HMR/WebSocket.
- Security headers, authenticated AI endpoints, server-side Gemini key, password hashing with scrypt, session expiry.

## Production environment
Set:
- `SIL_ADMIN_USERNAME`
- `SIL_ADMIN_PASSWORD`
- `GEMINI_API_KEY`
- `PORT` (Cloud Run supplies this; defaults to 8080)

## Important production note
The bundled auth user/session store is intentionally lightweight and in-memory for Cloud Run/AI Studio portability. For a multi-instance production deployment, move users, sessions, quotes, audit logs and rule versions to a shared database/Redis and enforce the same authorization rules server-side.
