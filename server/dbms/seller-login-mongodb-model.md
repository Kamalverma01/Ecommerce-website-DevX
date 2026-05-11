# Seller Login MongoDB Model

Seller login uses the `users` collection for authentication and the `sellers`
collection for seller approval/profile data.

## Login Collections

### `users`

Used for email/password, Google login, phone login, JWT cookie creation, and role.

```js
{
  _id: ObjectId,
  userName: String,
  email: String,
  phone: String,
  password: String,
  role: "user" | "seller" | "admin" | "super_admin",
  authProvider: "email" | "google" | "phone",
  mustChangePassword: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### `sellers`

Used to verify seller application status.

```js
{
  _id: ObjectId,
  userId: ObjectId,
  businessName: String,
  status: "pending" | "approved" | "rejected",
  approvedAt: Date,
  rejectedAt: Date
}
```

## Seller Login Rule

A user can access seller pages only when:

```js
users.role === "seller"
```

and:

```js
sellers.userId === users._id
sellers.status === "approved"
```

## Approval Flow

1. User logs in normally.
2. User submits seller application.
3. Admin approves the seller.
4. Backend updates `users.role` to `"seller"`.
5. Backend updates `sellers.status` to `"approved"`.
6. Seller logs in with the same user email/password.
7. Frontend redirects seller to `/seller/dashboard`.

## MongoDB Example

```js
db.users.findOne({
  email: "seller@example.com",
  role: "seller"
});

db.sellers.findOne({
  userId: ObjectId("USER_OBJECT_ID"),
  status: "approved"
});
```

## Important

There is no separate `seller_login` collection. Creating a second login
collection would duplicate credentials and make authentication less secure.
