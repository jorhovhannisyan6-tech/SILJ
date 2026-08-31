# Final implementation scope

## Quotation
- quotation number, date, validity
- client / individual / legal entity information
- product, object and insurance period
- risks, limits, deductible and special conditions
- deterministic calculation breakdown
- payment terms, discounts/adjustments and final premium
- required documents
- conditions version / source reference
- legal note that quotation is not the insurance contract
- SIL contact and signature blocks
- PDF and Word-compatible export

## Workflow
Customer → Product → Rules → Underwriting checks → Calculator → Scenario/quote → AI review → Human approval → PDF → Policy draft.

## Quote management
- autosave draft/current quote
- local quote history
- search
- open
- duplicate/version
- compare up to 3 quotes
- delete local record
- PDF from history

## Underwriting
- approved / manual review / rejected states
- deterministic validation before quote creation
- editable product/risk/tariff/document rules in Administration
- AI cannot alter deterministic pricing or acceptance

## AI
- product-specific knowledge retrieval
- coverage / exclusion / conditions Q&A grounded in supplied documents
- source document names in answers
- proposal underwriting analysis endpoint
- uncertainty/manual-review instruction when source evidence is insufficient

## CASCO
The supplied Excel workbook is preserved as the source workbook. The calculator uses the extracted workbook rules and supports the supplied policyholder, vehicle year, warranty, driver, franchise, Bonus-Malus/loss-ratio, payment, traffic-rule, theft, territory, EV, commission/profit and minimum-tariff logic.

## Reliability
- no conditional hook structure in the generic/CASCO switch
- no Vite HMR runtime dependency
- server-side Gemini key handling
- PDF generation through html2canvas + jsPDF
- source documents preserved under `knowledge-base/source-documents`

## Final enterprise additions
- Registration is pending until Manager/Admin approval.
- User lifecycle: activate/deactivate, role changes, password reset, forced session invalidation at the API layer.
- Auditor role is read-only for audit/security views.
- Audit events include actor identity when available.
- Smart Operations includes duplicate detection, next-action guidance, renewal center and document center.
- Calculator changes remain Draft until explicit Publish.
- CASCO regression tests remain available from Admin.
- AI is authenticated, product-scoped and source-constrained.
