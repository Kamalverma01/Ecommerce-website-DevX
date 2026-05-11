# Auth Extension Layer (Non-Breaking)

This module extends authentication and protection without replacing current routes.

## Mount example

```js
const authExtensionRoutes = require("./extensions/auth/routes/auth-extension-routes");
app.use("/api/auth-ext", authExtensionRoutes);
```

## What it adds

- Email/phone/password login with one identifier field
- OTP generation + verification with resend limits
- Access token (15m) + refresh token (7d)
- Cookie-first auth, body refresh fallback
- Session tracking, logout-all-devices support
- Google token login wrapper

## Middleware examples

```js
const { authMiddleware } = require("./extensions/auth/middleware/authMiddleware");
const { adminOnly, sellerOnly, userOnly } = require("./extensions/auth/middleware/roleMiddleware");

router.get("/api/user/profile", authMiddleware, userOnly, handler);
router.get("/api/admin/metrics", authMiddleware, adminOnly, handler);
router.get("/api/seller/orders", authMiddleware, sellerOnly, handler);
```

## User schema contract (normalized API response)

```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "password": "hashed-string",
  "role": "customer|seller|admin",
  "avatar": "string-url",
  "isVerified": true,
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```
