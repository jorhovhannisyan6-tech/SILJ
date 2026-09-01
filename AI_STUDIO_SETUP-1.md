# Google AI Studio setup — SIL Insurance Portal

1. Import the ZIP with `package.json` at the project root.
2. Install dependencies with the platform's normal package manager.
3. Set `GEMINI_API_KEY` as a **server-side secret/environment variable**.
4. Start the project with `npm run dev` (or the platform's normal start command).
5. The Express runtime serves the built frontend and does not require Vite HMR/WebSocket for the application runtime.
6. Do not expose `GEMINI_API_KEY` to client-side code.

The deterministic CASCO calculator is independent of Gemini and is based on the supplied `casco calculator 2024 - առանց ՃՈՈ.xlsx` source.
