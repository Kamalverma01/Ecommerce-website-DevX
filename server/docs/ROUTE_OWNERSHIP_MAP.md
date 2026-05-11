# Route Ownership Map (Backward Compatibility)

This map defines which stack is authoritative for each domain so new work does not break existing clients.

## Source-of-Truth Rule

- Primary for production traffic: `server/routes/**` + `server/controllers/**` + `server/models/**`
- Secondary/internal-only extension layer: `server/modules/marketplace/**`
- Existing route paths must remain stable.

## Domain Ownership

- Auth and session: legacy `server/routes/auth/auth-routes.js`
- Shop browsing/search/cart/address/order/review/chat/wishlist/coupon/alerts: legacy `server/routes/shop/**`
- Seller and admin panels: legacy `server/routes/seller/**`, `server/routes/admin/**`
- Catalog categories/brands: legacy `server/routes/catalog/**`
- Marketplace analytics/fraud/commission/recommendation/subscription modules: `server/modules/marketplace/**` (reused as services when needed)

## Overlap Guardrails

- Do not expose duplicate public endpoints for the same business action.
- If marketplace service logic is reused, wrap it from legacy controllers to keep response shape stable.
- Preserve cookie-based auth contract on `/api/auth/*` as canonical.
- Keep role checks centralized through one middleware implementation to avoid drift.

## Migration Safety

- Schema changes must be additive with defaults.
- New response fields are allowed; existing fields must not be removed or renamed.
- Any new module endpoint should be additive and namespaced, never replacing existing paths.
