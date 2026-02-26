# Authentication Flow

## Overview

TicketFlow uses a **dual-token JWT strategy** with tokens stored in **httpOnly cookies**. This approach eliminates XSS-based token theft while enabling seamless token rotation.

---

## Token Types

| Token         | Lifetime   | Storage                                        | Purpose                         |
| ------------- | ---------- | ---------------------------------------------- | ------------------------------- |
| Access Token  | 15 minutes | httpOnly cookie (`access_token`)               | Authenticates every API request |
| Refresh Token | 7 days     | httpOnly cookie (`refresh_token`, path-scoped) | Issues new access tokens        |

### Why httpOnly Cookies?

A cookie with the `httpOnly` flag is completely invisible to JavaScript — `document.cookie` cannot read it. This means even if a malicious script is injected into the frontend (XSS attack), it cannot steal the tokens.

Comparison:

| Storage Method     | XSS Risk                 | CSRF Risk                       | Verdict                |
| ------------------ | ------------------------ | ------------------------------- | ---------------------- |
| `localStorage`     | ❌ High — JS can read it | ✅ None                         | Not recommended        |
| `sessionStorage`   | ❌ High — JS can read it | ✅ None                         | Not recommended        |
| JS memory variable | ✅ None                  | ✅ None                         | OK but lost on refresh |
| httpOnly cookie    | ✅ None — JS blind       | ⚠️ Mitigated by `sameSite: lax` | Recommended ✅         |

---

## Cookie Configuration

```
Access Token Cookie:
  name:     access_token
  httpOnly: true       ← JS cannot read
  secure:   true       ← HTTPS only (false in development)
  sameSite: lax        ← sent on same-origin + top-level navigation
  maxAge:   15 minutes
  path:     /          ← sent on all requests

Refresh Token Cookie:
  name:     refresh_token
  httpOnly: true
  secure:   true
  sameSite: lax
  maxAge:   7 days
  path:     /api/v1/auth/refresh  ← sent ONLY to the refresh endpoint
```

The refresh token cookie is **path-scoped** to `/api/v1/auth/refresh`. The browser will only include it when making requests to that exact path — it is never sent on regular API requests, reducing its attack surface.

---

## Registration Flow

```
Client                                    Server
  │                                          │
  │── POST /auth/register ──────────────────▶│
  │   Body: { email, username,               │
  │           firstName, lastName,           │
  │           password }                     │
  │                                          │── 1. Validate DTO (ValidationPipe)
  │                                          │── 2. Check email uniqueness
  │                                          │── 3. Check username uniqueness
  │                                          │── 4. bcrypt.hash(password, 12)
  │                                          │── 5. Create user in DB
  │                                          │── 6. Generate access + refresh tokens
  │                                          │── 7. bcrypt.hash(refreshToken, 10)
  │                                          │── 8. Store hashed refresh token in DB
  │                                          │── 9. Set httpOnly cookies on response
  │                                          │
  │◀── 201 Created ─────────────────────────│
  │    Set-Cookie: access_token (15m)        │
  │    Set-Cookie: refresh_token (7d)        │
  │    Body: { id, email, username, ... }    │
```

---

## Login Flow

```
Client                                    Server
  │                                          │
  │── POST /auth/login ─────────────────────▶│
  │   Body: { email, password }              │
  │                                          │── 1. Find user by email
  │                                          │── 2. bcrypt.compare(password, hash)
  │                                          │      (runs even if user not found
  │                                          │       to prevent timing attacks)
  │                                          │── 3. If invalid → 401 "Invalid credentials"
  │                                          │      (same message regardless of which
  │                                          │       field is wrong — prevents enumeration)
  │                                          │── 4. Check isActive
  │                                          │── 5. Generate access + refresh tokens
  │                                          │── 6. Rotate: hash + store new refresh token
  │                                          │── 7. Set httpOnly cookies
  │                                          │
  │◀── 200 OK ──────────────────────────────│
  │    Set-Cookie: access_token (15m)        │
  │    Set-Cookie: refresh_token (7d)        │
  │    Body: { id, email, username, ... }    │
```

---

## Authenticated Request Flow

```
Client                                    Server
  │                                          │
  │── GET /api/v1/projects ─────────────────▶│
  │   Cookie: access_token=<jwt>             │ ← browser sends automatically
  │                                          │
  │                                          │── JwtAuthGuard intercepts
  │                                          │── JwtAccessStrategy runs:
  │                                          │   1. Extract token from cookie
  │                                          │      (fallback: Authorization header)
  │                                          │   2. Verify JWT signature
  │                                          │   3. Check expiry
  │                                          │   4. DB lookup: user exists + isActive
  │                                          │   5. Attach safe user to request.user
  │                                          │── Controller receives request
  │                                          │── Service executes
  │                                          │
  │◀── 200 OK ──────────────────────────────│
  │    Body: [ ...projects ]                 │
```

---

## Token Refresh Flow

```
Client                                    Server
  │                                          │
  │  [Access token expires after 15m]        │
  │                                          │
  │── POST /api/v1/auth/refresh ────────────▶│
  │   Cookie: refresh_token=<jwt>            │ ← path-scoped, sent automatically
  │                                          │
  │                                          │── JwtRefreshGuard intercepts
  │                                          │── JwtRefreshStrategy runs:
  │                                          │   1. Extract token from cookie
  │                                          │   2. Verify JWT signature (refresh secret)
  │                                          │   3. Check expiry
  │                                          │   4. DB lookup: user exists + isActive
  │                                          │   5. bcrypt.compare(rawToken, storedHash)
  │                                          │      ↳ null hash = logged out → 401
  │                                          │      ↳ no match = reuse attack → 401
  │                                          │   6. Attach user to request.user
  │                                          │── AuthService.refreshTokens():
  │                                          │   7. Generate new access + refresh tokens
  │                                          │   8. Hash + store new refresh token
  │                                          │      (old hash is overwritten = rotated)
  │                                          │   9. Set new httpOnly cookies
  │                                          │
  │◀── 200 OK ──────────────────────────────│
  │    Set-Cookie: access_token (new, 15m)   │
  │    Set-Cookie: refresh_token (new, 7d)   │
  │    Body: { message: "Token refreshed" }  │
```

### Token Rotation

Every call to `/auth/refresh` **invalidates the previous refresh token** and issues a new one. This means:

- Each refresh token is single-use
- If an attacker steals an old refresh token and the legitimate user has already refreshed, the stolen token's hash won't match the new stored hash — it gets rejected
- Logout always invalidates the refresh token, even if the attacker has a copy

---

## Logout Flow

```
Client                                    Server
  │                                          │
  │── POST /api/v1/auth/logout ─────────────▶│
  │   Cookie: access_token=<jwt>             │
  │                                          │── JwtAuthGuard validates access token
  │                                          │── AuthService.logout():
  │                                          │   1. Clear refreshToken in DB (set null)
  │                                          │   2. Set both cookies to empty + maxAge: 0
  │                                          │
  │◀── 200 OK ──────────────────────────────│
  │    Set-Cookie: access_token="" (expired) │
  │    Set-Cookie: refresh_token="" (expired)│
  │    Body: { message: "Logged out" }       │
```

After logout:

- The refresh token hash in the DB is `null` — any attempt to use the old refresh token will fail the hash comparison
- Cookies are cleared from the browser
- The access token will expire naturally in up to 15 minutes
  - For immediate revocation, a Redis-based token blacklist would be needed (future enhancement)

---

## Security Measures

### Timing Attack Prevention

During login, `bcrypt.compare()` is always called — even when the user doesn't exist. Without this, an attacker could determine which emails are registered by measuring response time (DB miss is faster than bcrypt hash comparison).

```typescript
// A dummy hash is used when user is not found
// bcrypt runs for the same amount of time either way
const passwordToCompare =
  user?.hashedPassword ?? '$2b$12$invalidhashfortimingattackprevention';
const isPasswordValid = await bcrypt.compare(dto.password, passwordToCompare);
```

### User Enumeration Prevention

The same error message is returned whether the email doesn't exist or the password is wrong:

```
401 Unauthorized: "Invalid credentials"
```

This prevents attackers from probing which email addresses are registered.

### Refresh Token Storage

Refresh tokens are **hashed with bcrypt** before being stored in the database. If the database is compromised, attackers get bcrypt hashes — not usable tokens.

Cost factor 10 is used (vs 12 for passwords) because:

- Refresh tokens are cryptographically random — not guessable like passwords
- This runs on every login AND every refresh — performance matters
- Lower cost is still safe because the input has high entropy

### Separate JWT Secrets

Access and refresh tokens are signed with **different secrets**:

- A compromised access secret cannot be used to forge refresh tokens
- A compromised refresh secret cannot be used to forge access tokens

---

## JWT Payload Structure

```typescript
// Both access and refresh tokens carry the same minimal payload
{
  sub: "user-uuid",    // Standard JWT "subject" claim — the user's ID
  email: "user@example.com",
  iat: 1708000000,     // Issued at (set automatically by jwt.sign)
  exp: 1708000900      // Expiry (set automatically based on expiresIn)
}
```

The payload is intentionally minimal — JWTs are base64-encoded and sent on every request. Sensitive data (roles, permissions) is never embedded in the token; it's always fetched fresh from the database on each request.
