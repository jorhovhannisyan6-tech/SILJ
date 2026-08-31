# SIL Insurance — Stage 2 Product-Specific Fix

This release is based on the complete production project and contains the full project, not a patch-only ZIP.

## Stage 2 behavior
- Property: existing property-specific Stage 2 remains separate.
- CASCO: existing CASCO calculator remains separate.
- All other products render their own Stage 2 form through ProductSpecificStep2Form.
- The generic property fields are not rendered for non-property products.
- Product-specific details are stored in `productDetails` and validated before Stage 3.
- Changing product clears prior product details and old generic values.
- Existing drafts are only restored when they belong to the selected product.

## Product-specific Stage 2 forms
Travel, Health, Cargo, Construction, Liability, Accident, Agro, Financial, Mortgage, Aviation, Bundle.

## Verification
Source checks confirm QuickQuoteView imports and renders ProductSpecificStep2Form and ProductForms contains dedicated switch cases for all 11 non-property/non-CASCO products.
