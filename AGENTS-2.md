# SIL Insurance Quotation Portal — Google AI Studio

This project is intended for Google AI Studio Build Mode.

## Non-negotiable rules
- Keep `package.json` at project root.
- Do not re-enable Vite HMR/WebSocket for preview. `server.ts` builds the frontend and serves `dist/` through Express.
- Do not put Gemini API keys in frontend code. Use Google AI Studio Secrets / `GEMINI_API_KEY` server-side.
- The AI agent is advisory. It must ground coverage/exclusion answers in `knowledge-base/` and must not invent insurance terms.
- The CASCO premium calculation is deterministic and must not be delegated to Gemini.
- `knowledge-base/source-documents/casco calculator 2024 - առանց ՃՈՈ.xlsx` is the authoritative source Excel for CASCO calculation.
- `src/data/cascoExcelRules.ts` is an extracted, auditable representation of the Excel calculation inputs.
- The quotation template source supplied by the user is in `knowledge-base/templates/quotation-template-source.docx`.

## Gemini
Primary model: `gemini-3.5-flash-lite` (Free Tier where available).
Fallback: `gemini-3.6-flash`.
Do not reintroduce retired 2.x models.

## Run
- `npm run dev`
- `npm run build`
- `npm run lint`
