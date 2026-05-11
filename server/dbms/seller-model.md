# Seller Model

This DBMS model represents seller applications and approved seller accounts.
The running application stores this data in MongoDB through `server/models/Seller.js`.

## Entity: sellers

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| id | CHAR(24) | Yes | Seller record id. Matches Mongo ObjectId style. |
| user_id | CHAR(24) | Yes, unique | User who owns the seller application. |
| business_name | VARCHAR(120) | Yes | Seller business/shop name. |
| phone | VARCHAR(20) | Yes | Seller contact phone. |
| address | VARCHAR(500) | Yes | Business address. |
| business_type | VARCHAR(100) | No | Business type, for example retailer or distributor. |
| support_email | VARCHAR(255) | No | Seller support email. |
| gst_number | VARCHAR(30) | No | GST/tax registration number. |
| pickup_pincode | VARCHAR(12) | No | Pincode for pickup/shipping origin. |
| status | VARCHAR(20) | Yes | `pending`, `approved`, or `rejected`. |
| commission_override | DECIMAL(5,2) | No | Optional seller-specific commission percentage. |
| approved_at | DATETIME | No | Date/time seller was approved. |
| rejected_at | DATETIME | No | Date/time seller was rejected. |
| notes | TEXT | No | Admin notes. |
| created_at | DATETIME | Yes | Creation timestamp. |
| updated_at | DATETIME | Yes | Last update timestamp. |

## Entity: seller_product_categories

This table stores the seller's requested product categories. It is separated
from `sellers` because relational DBMS tables should not store arrays directly.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| id | BIGINT | Yes | Category row id. |
| seller_id | CHAR(24) | Yes | References `sellers.id`. |
| category_name | VARCHAR(120) | Yes | Product category name. |

## Relationships

- One `users` record can have one `sellers` record.
- One `sellers` record can have many `seller_product_categories` records.
- Approved sellers can create many `products`.
- Seller orders are linked through product/order seller ids in the application.
