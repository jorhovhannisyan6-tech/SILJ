# SIL Insurance Quotation Portal

Google AI Studio-ready insurance quotation portal for SIL Insurance.

## Included
- SIL-style insurance portal UI.
- Product-specific risk lists controlled from the Administration section.
- Deterministic quotation engine.
- Full CASCO calculator based on the supplied Excel workbook `casco calculator 2024 - առանց ՃՈՈ.xlsx`.
- User-supplied insurance conditions as AI knowledge base.
- User-supplied quotation template source.
- Server-side Gemini AI agent with local fallback.
- No Vite HMR/WebSocket in preview mode.
- Import/export of editable underwriting settings.

## CASCO Excel logic
The calculator reproduces the supplied `calculator` sheet logic using the extracted `result 2` values and the `վերապ`/expense assumptions:
- insurance amount band (< 7,000,000 vs >= 7,000,000)
- policyholder type
- vehicle-year band
- warranty service
- driver count
- franchise option
- Bonus-Malus OR loss ratio
- payment method
- traffic rules
- theft coverage and exclusion percentage capped at 30%
- territory
- electric vehicle adjustment
- broker commission and profit
- minimum tariff floor

The original workbook remains in the project for audit/reference.


## Official SIL logo assets

This build uses only the two official SIL Insurance logo files supplied with the project:
- `src/assets/images/sil-logo-horizontal.png` — header, navigation and quotation documents.
- `src/assets/images/sil-logo-stacked.png` — compact/footer and favicon contexts.

Generated logo variants, placeholder logos and the previous logo settings/preset UI have been removed.

## Final verification
- `node scripts/qa-static.mjs` — static QA.
- `python scripts/verify-casco-source.py` — supplied Excel rule verification (16 source values).
- TypeScript/TSX parse check — all non-declaration TS/TSX files transpile successfully in syntax-only mode.
- `Production Health Check` is available in Admin and performs runtime checks after deployment.
- Gemini is configured for `gemini-3.6-flash`; no deprecated sampling parameters are sent.

## Final security and admin implementation
See `FINAL_IMPLEMENTATION.md`. Admin login is created from `SIL_ADMIN_USERNAME` and `SIL_ADMIN_PASSWORD`; there is no hard-coded admin password.
