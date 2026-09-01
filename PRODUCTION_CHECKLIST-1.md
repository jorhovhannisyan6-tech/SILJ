# SIL Insurance Portal — Final Fixes / Verification

## Fixed in this build
- CASCO tariff adjustments now use the **exact absolute percentage-point values** from the supplied Excel `calculator` / `result 2` / `վերապ` logic.
- Corrected payment, traffic-rule, territory, warranty, loss-ratio, theft, and electric-vehicle adjustments.
- CASCO enforces the Excel rule that exactly one of Bonus-Malus or Loss Ratio must be selected.
- CASCO final premium uses the Excel rounding rule: nearest 1,000 AMD-equivalent unit (`ROUND(...,-3)`).
- CASCO minimum tariff rules remain enforced by policyholder type and insured-amount band.
- AI is kept out of deterministic pricing decisions.
- Knowledge retrieval is bounded to relevant documents / bounded document text so Gemini requests do not overflow context unnecessarily.
- Gemini API key is server-side only (`GEMINI_API_KEY`).
- Vite HMR/WebSocket is disabled for the runtime server path.
- React error boundary prevents a UI exception from producing an unrecoverable blank screen.
- Quote metadata includes rules/calculator versions.
- Quote updates are persisted locally and audited.
- Quotes can be locked after approval.
- Admin changes have version/audit metadata and a Publish action.
- Only the two supplied SIL logo assets remain in `src/assets/images`.
- PDF generation does not use `window.print()`.

## Source verification
Run:

```bash
python scripts/verify-casco-source.py
```

The verification script checks 16 extracted CASCO rule values against the supplied workbook.

## Important deployment rule
For Gemini, set `GEMINI_API_KEY` as a server/runtime secret. Do not place it in Vite client environment variables or frontend source.
