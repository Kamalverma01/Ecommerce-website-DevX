# Marketplace Module

This is a non-breaking MERN backend extension for a production-style multi-vendor ecommerce marketplace. It does not modify the existing application files. Mount it from `server.js` when you are ready to activate it:

```js
const marketplace = require("./modules/marketplace");
app.use(marketplace.mountPath, marketplace.router);
```

Default mount path: `/api/marketplace`

## Architecture

- MVC controllers live in `controllers/`.
- Business logic lives in `services/`.
- MongoDB schemas live in `models/`.
- Auth, upload, validation, logging, and rate-limit middleware live in `middleware/`.
- Event hooks live in `events/registerMarketplaceEvents.js`.
- Domain events are declared in `core/eventBus.js`.

Events implemented:

- `orderPlaced`
- `orderDelivered`
- `orderReturned`
- `paymentCaptured`
- `paymentRefunded`
- `fraudAlert`
- `lowStock`

Order event behavior:

- `orderPlaced`: fraud scoring, `under_review` marking, in-app notification.
- `orderDelivered`: commission becomes `earned`, seller wallet is credited, invoice is generated.
- `orderReturned`: commission is reversed, stock is restored, notification is sent.

## Major APIs

All protected endpoints use `Authorization: Bearer <accessToken>`.

### Auth

`POST /api/marketplace/auth/register`

```json
{
  "success": true,
  "message": "Customer registered. OTP verification queued.",
  "data": { "userId": "6630f1..." }
}
```

`POST /api/marketplace/auth/login`

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": { "id": "6630f1...", "email": "buyer@example.com", "role": "customer" },
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

### Seller KYC

`POST /api/marketplace/sellers/register`

Creates a seller user, KYC profile, wallet, and Basic subscription.

`POST /api/marketplace/admin/sellers/:sellerId/approve`

```json
{
  "success": true,
  "message": "Seller approved.",
  "data": { "seller": { "status": "approved", "verifiedAt": "2026-05-04T..." } }
}
```

### Catalog, Brands, Products

`POST /api/marketplace/admin/categories`

Admin-only category creation.

`POST /api/marketplace/seller/category-requests`

Seller category request workflow.

`POST /api/marketplace/seller/brands`

Seller brand creation with Multer + Cloudinary logo upload.

`POST /api/marketplace/seller/products`

Seller product creation with 3-4 images, stock, commission rate, category, and brand.

```json
{
  "success": true,
  "message": "Product created.",
  "data": {
    "product": {
      "name": "Cotton Shirt",
      "sellerBusinessName": "Acme Textiles",
      "status": "active",
      "stock": 100
    }
  }
}
```

### Orders

`POST /api/marketplace/orders`

Places an order, prevents overselling, assigns seller IDs, calculates GST, creates pending commission records, generates a tracking ID, creates delivery OTP, and marks high-risk orders as `under_review`.

```json
{
  "success": true,
  "message": "Order placed.",
  "data": {
    "order": {
      "trackingId": "ORD-1777890000000-A1B2C3",
      "status": "placed",
      "riskScore": 25,
      "paymentMethod": "cod"
    }
  }
}
```

`PATCH /api/marketplace/orders/:orderId/status`

Supports lifecycle: `placed -> confirmed -> packed -> shipped -> out_for_delivery -> delivered -> returned`.

`POST /api/marketplace/orders/:orderId/delivery-otp`

Verifies delivery OTP and emits `orderDelivered`.

### Commission and Wallet

Commission formula:

```txt
commission = price * quantity * rate / 100
```

`GET /api/marketplace/admin/commission`

```json
{
  "success": true,
  "message": "Commission summary fetched.",
  "data": {
    "summary": {
      "pending": { "total": 500, "count": 4 },
      "earned": { "total": 1500, "count": 12 },
      "reversed": { "total": 100, "count": 1 },
      "paid": { "total": 0, "count": 0 }
    }
  }
}
```

`GET /api/marketplace/seller/wallet`

Returns `totalEarnings`, `commissionDeducted`, `availableBalance`, and freeze status.

### Fraud

Rules included:

- COD limit: 5 per day.
- COD + new user risk scoring.
- High-value order risk scoring.
- Return rate above 50% risk scoring.
- Seller fraud flagging and wallet freeze.
- High-risk orders become `under_review`.

`GET /api/marketplace/admin/fraud`

`POST /api/marketplace/admin/fraud/sellers/:sellerId/flag`

### Inventory

`POST /api/marketplace/seller/inventory/bulk`

Accepts either:

```json
{
  "rows": [
    { "productId": "6630f1...", "stock": 120, "lowStockThreshold": 8 }
  ]
}
```

or CSV text:

```json
{
  "csv": "productId,stock,lowStockThreshold\n6630f1...,120,8"
}
```

### Payments, Coupons, Reviews, Returns, Invoices

- `POST /api/marketplace/payments/:orderId/intent`
- `POST /api/marketplace/payments/capture`
- `POST /api/marketplace/payments/refund`
- `POST /api/marketplace/coupons`
- `POST /api/marketplace/coupons/apply`
- `POST /api/marketplace/reviews`
- `POST /api/marketplace/returns`
- `POST /api/marketplace/admin/returns/:returnId/approve`
- `POST /api/marketplace/invoices/:orderId`

### Analytics, Search, AI Recommendations, Chat

- `GET /api/marketplace/admin/analytics`
- `GET /api/marketplace/seller/analytics`
- `GET /api/marketplace/products?q=shirt&category=<id>&minPrice=500&maxPrice=2000&rating=4&sort=popularity`
- `GET /api/marketplace/recommendations/trending`
- `GET /api/marketplace/recommendations/also-bought/:productId`
- `POST /api/marketplace/chat/messages`

## Feature Status

The module-load verification passes, and every listed feature has a concrete REST endpoint, schema, controller, service, or event hook in this module. Runtime behavior still depends on mounting the router and providing production environment variables for MongoDB, JWT secrets, Cloudinary, SMTP/SMS, and payment providers.
