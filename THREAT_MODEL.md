# Threat Model – Chirp Web Application

## 1. Purpose and Scope

This document identifies security threats to Chirp, a social-media web
application, and evaluates the controls currently implemented to reduce those
threats. The analysis uses the STRIDE framework and covers the production
application at `chirp.blog` and `api.chirp.blog`.

The system consists of:

- an Angular single-page application hosted by Hostinger;
- an Nginx reverse proxy and Node.js/Express REST API on a Hostinger VPS;
- MongoDB Atlas for application and authentication-session data; and
- Cloudinary for profile pictures and post images.

The internal security of Hostinger, MongoDB Atlas, and Cloudinary is outside the
application's direct control. Compromise of a user's device or browser is also
outside the model, although the impact of client-side token theft is considered.

## 2. Architecture and Data-Flow Diagram

The diagram shows the main components, data flows, trust boundaries, protected
data, and identified threats. Yellow sticky notes are possible threats and purple dashed circles show trust boundarys.

### Main Data Flows

1. The browser downloads the Angular application over HTTPS.
2. The frontend sends JSON or multipart requests to the API over HTTPS.
3. Protected requests include a short-lived JWT access token in the
   `Authorization` header.
4. After login or token refresh, the API returns a 15-minute access token and
   sets a seven-day refresh token in an HttpOnly cookie.
5. The API reads and writes application data and hashed refresh sessions in
   MongoDB Atlas.
6. The API sends accepted image uploads to Cloudinary, and clients retrieve the
   resulting images over HTTPS.

## 3. Security-Relevant Assets

| Asset                             | Reason for protection                                                           |
| --------------------------------- | ------------------------------------------------------------------------------- |
| Password hashes                   | Disclosure could enable offline password cracking                               |
| JWT access tokens                 | A valid token permits temporary account impersonation                           |
| Refresh tokens and session hashes | Compromise could enable longer-lived session abuse                              |
| User profile data                 | Contains email addresses, names, biographies, and social relationships          |
| User-generated content            | Posts, comments, likes, bookmarks, and uploaded images require integrity        |
| Backend secrets                   | The JWT secret, MongoDB URI, and Cloudinary credentials grant privileged access |
| Service availability              | Users depend on the API, database, and media service remaining available        |

## 4. Actors and Trust Boundaries

### Actors

- **Public user:** Can register, log in, refresh a session, and log out.
- **Authenticated user:** Can access social features and modify their own
  resources.
- **Malicious authenticated user:** Has a valid account but attempts to access or
  modify another user's resources.
- **External attacker:** Attempts credential attacks, denial of service,
  injection, token theft, or secret compromise without a valid account.

### Trust Boundaries

- **Client boundary:** Browser state and frontend code are not trusted by the
  backend.
- **Application boundary:** Requests cross from the public internet through
  Nginx to the Express API.
- **Database boundary:** The API authenticates separately to MongoDB Atlas.
- **Media-service boundary:** Image data and API credentials cross from the
  backend to Cloudinary.

## 5. Entry Points and Attack Surface

- Public authentication endpoints for registration, login, refresh, and logout
- Protected REST endpoints for users, profiles, posts, comments, likes, and
  bookmarks
- Path parameters containing MongoDB ObjectIds
- JSON and URL-encoded request bodies
- Multipart profile-photo and post-image uploads
- JWT parsing and authorization middleware
- Refresh-token cookies and refresh-session records
- Database queries issued through Mongoose
- Cloudinary's upload and media-delivery APIs
- Third-party frontend and backend dependencies

## 6. STRIDE Analysis

### Spoofing

**Threats**

- **T1:** An attacker steals an access token through XSS or a compromised browser
  and impersonates the user.
- **T3:** Clickjacking tricks a user into an unintended action, or a compromised
  dependency executes with the application's privileges.
- **T4:** An attacker uses brute force or credential stuffing against the login
  endpoint.

**Implemented controls**

- Protected routes verify the access token's JWT signature and expiry.
- The authenticated identity is derived from the verified token rather than a
  client-supplied user ID.
- Access tokens expire after 15 minutes.
- Refresh tokens are cryptographically random, stored in an HttpOnly,
  `SameSite=Strict` cookie, and rotated after every successful refresh.
- Only a SHA-256 hash of each refresh token is stored in MongoDB.
- Logout deletes the matching refresh session and clears the cookie.
- Login and registration are limited to 10 requests per 15 minutes per client.
- Login uses a generic `Invalid credentials` response.
- Helmet prevents the application from being framed by another origin and adds
  browser security headers.
- Lock files make dependency versions reproducible.

**Residual risk**

- Access tokens remain in `localStorage`, so successful XSS can steal them.
- A stolen access token cannot be revoked before its 15-minute expiry.
- Rate limiting slows automated attacks but does not replace detection or
  account-level lockout.
- Dependency versions are locked, but automated dependency scanning is not yet
  part of CI.

### Tampering

**Threats**

- **T2:** An attacker attempts to make a browser send the refresh-token cookie
  with a forged refresh or logout request.
- **T5:** A user changes an ObjectId to edit or delete another user's resource
  (IDOR/broken object-level authorization).
- **T6:** An attacker submits NoSQL operators, malformed identifiers, or
  oversized input to alter a database query or application state.
- **T7:** An attacker uploads an unexpected or malicious file.
- **T8:** Compromised database credentials are used to modify stored data.

**Implemented controls**

- The refresh cookie uses `SameSite=Strict`, is scoped to `/api/users`, and is
  sent only over HTTPS in production.
- Credentialed CORS requests are accepted only from explicit Chirp origins.
- Protected routes use the verified user ID from the JWT.
- Update and delete operations for posts and comments compare the resource owner
  with the authenticated user.
- Registration, login, profile, post, and comment bodies are type-checked,
  length-limited, and normalized before reaching controllers.
- Route identifiers are validated as MongoDB ObjectIds.
- Database updates construct fixed server-side update objects rather than
  passing complete client objects to Mongoose.
- Uploads have a MIME-type allowlist for JPEG, PNG, and WEBP.
- Global uploads are limited to 1 MB; avatars have an additional 500 KB limit.
- Temporary filenames use random UUIDs, metadata is stripped by Cloudinary, and
  temporary files are removed after processing.

**Residual risk**

- Cookie settings substantially reduce CSRF risk, but they must remain correct
  if the frontend and API deployment origins change.
- MIME types are supplied by the client and are not verified using file
  signatures or content scanning.
- Authorization must remain correctly implemented on every newly added route.
- Database compromise would bypass application-level authorization controls.

### Repudiation

**Threat**

- **T10:** A user denies creating, editing, or deleting content.

**Implemented controls**

- Write operations associate content with the authenticated backend identity.
- MongoDB documents include creation and update timestamps.
- API errors are handled centrally.

**Residual risk**

- Chirp has no dedicated, tamper-resistant audit log containing actor, action,
  target, timestamp, and request context.
- Application console output is not sufficient evidence for a security
  investigation.

### Information Disclosure

**Threats**

- **T1:** XSS exposes the access token and enables access to protected API data.
- **T8:** The MongoDB URI or database account is exposed.
- **T9:** Cloudinary credentials or private application media are exposed.

**Implemented controls**

- Passwords are salted and hashed with bcrypt.
- The password field is excluded from normal queries and removed during user
  serialization.
- Authentication responses use `Cache-Control: no-store`.
- Refresh tokens are inaccessible to frontend JavaScript because the cookie is
  HttpOnly.
- Production refresh cookies use the `Secure` attribute.
- Secrets are read from server-side environment variables rather than committed
  to source control.
- Production traffic uses HTTPS, and database traffic uses the MongoDB Atlas TLS
  connection.
- Cloudinary strips image metadata during upload.
- CORS allows credentials only from explicit Chirp development and production
  origins.
- Helmet supplies security headers and Express's `X-Powered-By` header is
  disabled.

**Residual risk**

- Client-side code can still read the short-lived access token.
- A server, deployment, or provider-account compromise could expose environment
  secrets and stored data.
- Publicly delivered Cloudinary URLs should not be treated as confidential
  storage.

### Denial of Service

**Threats**

- **T4:** An attacker sends excessive authentication or general API requests.
- **T7:** Oversized bodies or uploads exhaust memory, disk, CPU, or third-party
  resources.
- **T9:** Cloudinary or MongoDB becomes unavailable.

**Implemented controls**

- Login and registration are limited to 10 requests per 15 minutes.
- General API traffic is limited to 300 requests per 15 minutes.
- JSON and URL-encoded request bodies are limited to 16 KB.
- File uploads are limited to 1 MB, and temporary files are deleted.
- User search results and search limits are bounded.

**Residual risk**

- The rate limiter uses the application's default in-memory store. Limits are
  not shared across multiple server instances and reset when the process
  restarts.
- Application-level limits cannot stop a large network-level distributed denial
  of service attack before traffic reaches the VPS.
- Chirp depends on the availability of Hostinger, MongoDB Atlas, and Cloudinary.

### Elevation of Privilege

**Threats**

- **T5:** An authenticated user performs actions reserved for another user.
- **T6:** Crafted input reaches an unintended database operation.
- **T8/T9:** Stolen service credentials grant access beyond a normal Chirp user.

**Implemented controls**

- Authorization is enforced by the API rather than the Angular interface.
- Protected routes require a valid access token.
- Resource ownership is checked before modification or deletion.
- Validated fields and fixed update shapes restrict client control over database
  operations.
- Cloudinary and database credentials are held only by the backend.

**Residual risk**

- Chirp has no administrator role, so there is no separate role-based access
  control layer.
- A backend or service-account compromise would operate with the privileges of
  that service account.

## 7. Residual-Risk Summary

The ratings below are qualitative and represent risk remaining after the
implemented controls.

| ID  | Threat                                       | Likelihood |   Impact | Residual risk |
| --- | -------------------------------------------- | ---------: | -------: | ------------: |
| T1  | XSS and access-token theft                   |     Medium |     High |        Medium |
| T2  | CSRF against refresh or logout               |        Low |   Medium |           Low |
| T3  | Clickjacking or dependency compromise        |        Low |     High |        Medium |
| T4  | Credential attacks or request flooding       |     Medium |   Medium |        Medium |
| T5  | IDOR or broken object-level authorization    |        Low |     High |           Low |
| T6  | NoSQL injection or malformed input           |        Low |     High |           Low |
| T7  | Malicious or resource-intensive uploads      |     Medium |     High |        Medium |
| T8  | Database credential or account compromise    |        Low | Critical |        Medium |
| T9  | Cloudinary compromise, disclosure, or outage |        Low |     High |        Medium |
| T10 | Repudiation without audit evidence           |     Medium |   Medium |        Medium |

## 8. Security-Control Evidence

| Control                                              | Main implementation                                                                    |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Security headers, CORS, size limits, and rate limits | `server/app.js`                                                                        |
| JWT verification                                     | `server/middleware/authMiddleware.js`                                                  |
| Access and refresh-token lifecycle                   | `server/utils/authTokens.js`                                                           |
| Refresh rotation, logout, and session responses      | `server/controllers/userControllers.js`                                                |
| Hashed refresh sessions with automatic expiry        | `server/models/refreshSessionModel.js`                                                 |
| Request and ObjectId validation                      | `server/middleware/requestValidation.js` and `server/routes/routes.js`                 |
| Object-level authorization                           | `server/controllers/postControllers.js` and `server/controllers/commentControllers.js` |
| Upload validation and cleanup                        | `server/controllers/userControllers.js` and `server/controllers/postControllers.js`    |
| Password exclusion from API responses                | `server/models/userModel.js`                                                           |
| Automatic access-token refresh                       | `client/src/app/guards/auth.interceptor.ts`                                            |

## 9. Prioritized Future Improvements

1. Keep the access token in memory instead of `localStorage` to reduce its
   exposure to token-stealing XSS.
2. Validate image file signatures and decode accepted images before upload;
   optionally add malware scanning.
3. Add structured, tamper-resistant audit logging for authentication and
   resource changes.
4. Replace the in-memory rate-limit store with a shared store such as Redis if
   the API is deployed on multiple instances.
5. Add refresh-token family tracking so detected token reuse can revoke all
   sessions in the affected family.
6. Add centralized monitoring and alerts for repeated authentication failures,
   authorization failures, rate-limit events, and server errors.
7. Document and test backup restoration and service-secret rotation procedures.
8. Add automated dependency and secret scanning to CI.

## 10. Evaluation

Chirp applies multiple layers of protection at the client, API, database, and
media-service boundaries. Short-lived access tokens, rotating refresh sessions,
backend authorization, strict input validation, upload limits, security headers,
restricted CORS, and rate limiting reduce the most likely application-level
threats.

The most important remaining risks are access-token exposure through XSS,
content-based image validation, limited auditability, in-memory rate limiting,
and reliance on third-party infrastructure. These limitations are explicitly
accepted for the current university-project scope and form the priority list for
future hardening.
