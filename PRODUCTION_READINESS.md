# SIL Insurance — Production Readiness / QA Notes

Implemented hardening in this build:

- CASCO calculator retains the supplied Excel-derived deterministic rules and fixed regression vectors.
- Quote creation is blocked when required core data is invalid.
- Locked quotes cannot be edited; locking is audited.
- Rule changes are now TEST/DRAFT first; only Publish changes active production rules.
- Quote scenarios can be saved without mutating the main quote.
- AI knowledge retrieval no longer falls back to every product document for an ambiguous question; it uses the active product context or requires a product match.
- AI fallback explicitly refuses to make coverage decisions when Gemini is unavailable.
- AI never calculates the CASCO premium.
- Static QA checks package structure, legacy Gemini model references, logo count, knowledge fallback, and quotation validation.

Known environment limitation: dependency installation may be unavailable in this execution environment. Run `npm install`, then `npm run lint`, `npm run qa`, and `npm run build` in the target Google AI Studio runtime before production deployment.

## Quotation template update
- Customer-facing quotation output is now driven by `src/utils/quotationTemplate.ts`.
- The supplied reference template is preserved in `templates/SIL_Quotation_Template_Source.doc` and `.docx`.
- PDF export captures each A4 `.quote-page` separately to avoid accidental page slicing.
- AI underwriting text is intentionally excluded from the customer-facing quotation document.
