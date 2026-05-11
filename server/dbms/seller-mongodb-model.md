# Seller MongoDB Model

This is the DBMS model for the `sellers` MongoDB collection. It matches the
real Mongoose model used by the app in `server/models/Seller.js`.

## Collection

`sellers`

## Document Structure

```js
{
  _id: ObjectId,
  userId: ObjectId,
  businessName: String,
  phone: String,
  address: String,
  businessType: String,
  supportEmail: String,
  gstNumber: String,
  pickupPincode: String,
  productCategories: [String],
  status: "pending" | "approved" | "rejected",
  commissionOverride: Number | null,
  approvedAt: Date | null,
  rejectedAt: Date | null,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Fields

| Field | MongoDB Type | Required | Description |
| --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Primary document id. |
| `userId` | ObjectId | Yes, unique | References the user applying as seller. |
| `businessName` | String | Yes | Seller business/shop name. |
| `phone` | String | Yes | Seller contact number. |
| `address` | String | Yes | Business address. |
| `businessType` | String | No | Type of business, such as retailer or distributor. |
| `supportEmail` | String | No | Seller support email. |
| `gstNumber` | String | No | GST/tax registration number. |
| `pickupPincode` | String | No | Pickup/shipping pincode. |
| `productCategories` | Array of String | No | Categories the seller wants to sell in. |
| `status` | String | Yes | Seller application status. |
| `commissionOverride` | Number or null | No | Optional custom commission percentage for this seller. |
| `approvedAt` | Date or null | No | Set when admin approves seller. |
| `rejectedAt` | Date or null | No | Set when admin rejects seller. |
| `notes` | String | No | Admin notes. |
| `createdAt` | Date | Yes | Created automatically by Mongoose. |
| `updatedAt` | Date | Yes | Updated automatically by Mongoose. |

## Relationships

- `sellers.userId` references `users._id`.
- One user can have only one seller application because `userId` is unique.
- Approved sellers can create products through `products.sellerId`.
- Seller order data is read through `orders.sellerOrders.sellerId`.

## Example Document

```json
{
  "_id": { "$oid": "6638f39a3b9f1b3210a12345" },
  "userId": { "$oid": "6638f1e23b9f1b3210a11111" },
  "businessName": "Panjab Sports Supplier",
  "phone": "9876543210",
  "address": "Sector 17, Chandigarh",
  "businessType": "Retailer",
  "supportEmail": "seller@example.com",
  "gstNumber": "03ABCDE1234F1Z5",
  "pickupPincode": "160017",
  "productCategories": ["Cricket", "Football", "Fitness"],
  "status": "pending",
  "commissionOverride": null,
  "approvedAt": null,
  "rejectedAt": null,
  "notes": "",
  "createdAt": { "$date": "2026-05-03T06:45:00.000Z" },
  "updatedAt": { "$date": "2026-05-03T06:45:00.000Z" }
}
```

## Mongo Shell Setup

```js
db.sellers.createIndex({ userId: 1 }, { unique: true });
db.sellers.createIndex({ status: 1 });
```
