# Frontend Auth Extension (Non-Invasive)

These files add auth/session/protected-route capabilities without touching current routes.

## Optional wiring example

```jsx
import { AuthContextExtensionProvider } from "@/extensions/auth/AuthContextExtension";

<AuthContextExtensionProvider>
  <App />
</AuthContextExtensionProvider>
```

## Protected wrapper example

```jsx
import ProtectedRouteExtension from "@/extensions/auth/ProtectedRouteExtension";

<ProtectedRouteExtension roles={["customer", "user"]}>
  <ProfilePage />
</ProtectedRouteExtension>
```

## Redirect-back flow

- `ProtectedRouteExtension` stores attempted URL in local storage.
- Successful login page consumes it and redirects back.

## New pages

- `pages/LoginExtension.jsx`
- `pages/RegisterExtension.jsx`
- `pages/ForgotPasswordExtension.jsx`
