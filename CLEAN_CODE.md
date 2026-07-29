# Clean Code in Chirp

## Purpose

This document explains how Clean Code principles are applied in Chirp and provides concrete references to the implementation and refactoring history.

## Clean Code Principles

### Meaningful Names and Small Functions

Functions and variables describe their intent instead of their implementation details. Examples include:

- `validateRegistrationBody`
- `validateObjectIdParam`
- `createAccessToken`
- `hashRefreshToken`
- `getRefreshCookieOptions`
- `normalizeUser`
- `isBookmarked`
- `refreshSession`

Validation is divided into focused helpers such as `isNonEmptyString`, `isValidEmail`, and `isValidPassword`.

Evidence:

- [server/middleware/requestValidation.js](server/middleware/requestValidation.js)
- [server/utils/authTokens.js](server/utils/authTokens.js)
- [client/src/app/utils/normalize-user.ts](client/src/app/utils/normalize-user.ts)

### Appropriate Data Types and Interfaces

The Angular frontend uses TypeScript interfaces for API payloads and domain objects instead of passing unstructured objects through the application.

Examples include:

- `LoginPayload`, `LoginResponse`, and `RegisterPayload`
- `User` and `ApiUser`
- `Post`, `PostUser`, and `Comment`
- Union types for references that may be either an ID or a populated object

Because TypeScript types do not exist at runtime, backend middleware separately validates incoming values and MongoDB ObjectIds.

Evidence:

- [client/src/app/models](client/src/app/models)
- [server/middleware/requestValidation.js](server/middleware/requestValidation.js)

### Single Responsibility Principle

Backend responsibilities are separated into focused modules:

- `index.js` connects to MongoDB and starts the server.
- `app.js` configures Express and its middleware.
- Controllers handle application use cases.
- `requestValidation.js` validates external input.
- `authMiddleware.js` authenticates requests.
- `errorMiddleware.js` produces consistent error responses.
- `authTokens.js` creates and hashes authentication tokens.

The frontend follows a similar separation:

- Services communicate with the API.
- Components manage presentation and user interaction.
- Guards control route access.
- Models describe application data.
- Utilities contain reusable transformations and validation rules.

Evidence:

- [server/index.js](server/index.js)
- [server/app.js](server/app.js)
- [server/middleware](server/middleware)
- [client/src/app/services](client/src/app/services)
- [client/src/app/components](client/src/app/components)

### Modularity, Cohesion, and Coupling

Related behavior is grouped into cohesive modules. For example, post requests are handled by the `Posts` service, user requests by the `Users` service, and authentication by the `Auth` service.

Components depend on these services rather than implementing HTTP communication themselves. Child components communicate with their parents using typed inputs and outputs.

Repeated frontend validation values are kept in one constant instead of being scattered as magic numbers.

Evidence:

- [client/src/app/services/posts/posts.ts](client/src/app/services/posts/posts.ts)
- [client/src/app/services/users/users.ts](client/src/app/services/users/users.ts)
- [client/src/app/services/auth/auth.ts](client/src/app/services/auth/auth.ts)
- [client/src/app/utils/input-validation.ts](client/src/app/utils/input-validation.ts)

### Interfaces, Inheritance, and Composition

TypeScript interfaces define contracts for data passed between services and components.

The backend’s `HttpError` extends the standard `Error` class because it represents a specialized error with an HTTP status code.

For UI behavior, composition is preferred over inheritance. For example, the feed composes smaller components for profile images, likes, bookmarks, and post editing. Express also composes validation and authentication middleware when defining routes.

Evidence:

- [server/models/errorModel.js](server/models/errorModel.js)
- [client/src/app/components/feed/feed.html](client/src/app/components/feed/feed.html)
- [server/routes/routes.js](server/routes/routes.js)

### Encapsulation and Information Hiding

The `Auth` service hides browser-storage operations behind private methods such as `read`, `write`, `remove`, and `persistSession`. Other components use the public authentication API without depending directly on its storage implementation.

Passwords are excluded from normal Mongoose queries and removed again during JSON serialization. This keeps sensitive implementation data out of API responses.

Evidence:

- [client/src/app/services/auth/auth.ts](client/src/app/services/auth/auth.ts)
- [server/models/userModel.js](server/models/userModel.js)

### Error Handling and Predictable State

Backend errors are passed to centralized error middleware using `next`. The middleware maps supported status codes to a consistent JSON response.

Frontend components represent loading, error, and busy states explicitly. RxJS `finalize` is used where cleanup must happen after either success or failure.

Evidence:

- [server/middleware/errorMiddleware.js](server/middleware/errorMiddleware.js)
- [server/models/errorModel.js](server/models/errorModel.js)
- [client/src/app/components/like-post/like-post.ts](client/src/app/components/like-post/like-post.ts)
- [client/src/app/guards/auth.interceptor.ts](client/src/app/guards/auth.interceptor.ts)

### Principle of Least Astonishment

Authentication, validation, and error behavior are centralized so that similar operations behave consistently.

Examples include:

- All protected API requests receive their access token through one interceptor.
- Expired sessions are refreshed centrally.
- Invalid request bodies consistently return `400` responses.
- Forms prevent repeated submissions while an operation is running.

### YAGNI

An unfinished messaging and Socket.IO implementation was removed because it was not used by the frontend or required for the submitted use cases. Keeping it would have increased maintenance and security costs without delivering user value.

Evidence:

- [`refactor(security): remove unused messaging surface`](https://github.com/TobiasAschenbrenner/chirp/commit/9a4dbaeafcad533539fe0675d1a474cf490d3ad2)

## Refactoring Examples

| Previous problem or smell                                | Refactoring                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------------ |
| Server startup and Express configuration were coupled    | Extracted reusable Express configuration into `server/app.js`      |
| Validation rules were scattered or missing               | Introduced focused validation middleware and frontend constants    |
| Password fields could accidentally be serialized         | Hid passwords in the schema and added regression tests             |
| Unused messaging code increased complexity               | Removed the messaging and Socket.IO surface                        |
| Legacy Angular structural directives remained            | Migrated templates to built-in `@if`, `@for`, and `@switch` syntax |
| Feed rendering caused avoidable user requests            | Populated creator data in the feed API response                    |
| Security and quality checks depended on manual execution | Added ESLint and automated CI checks                               |

## Test-First Refactoring Workflow

For the main refactoring work, tests were added before the implementation change. This made the expected behavior explicit and reduced the risk of regressions.

Examples from the commit history:

1. `test(security): ensure user responses never expose passwords`
2. `fix(security): prevent password hashes from being serialized`
3. `test(validation): cover invalid authentication and resource input`
4. `feat(validation): validate authentication, post bodies and resource ids`
5. `test(api): cover feed request efficiency`
6. `fix(api): reduce feed requests and tune rate limits`
7. `test(auth): cover expired session handling`
8. `fix(auth): handle expired sessions`

The frontend validation work followed the same pattern with separate test and implementation commits for passwords, registration, profile input, posts, and comments.

The larger validation change was reviewed and verified in [PR #1](https://github.com/TobiasAschenbrenner/chirp/pull/1). The Angular control-flow migration was kept separate in [PR #2](https://github.com/TobiasAschenbrenner/chirp/pull/2).

## Automated Quality Checks

The repository uses:

- ESLint for frontend and backend static analysis
- Vitest for Angular tests
- Node’s built-in test runner for backend tests
- Angular production builds
- `npm audit` for dependency vulnerability checks
- GitHub Actions for pull requests and changes to `main`

The CI configuration is available in [.github/workflows/ci.yml](.github/workflows/ci.yml).

Local verification commands:

```bash
cd server
npm run lint
npm test

cd ../client
npm run lint
npm test -- --watch=false
npm run build
```

## Remaining Limitations and Improvements

The project still contains areas that could be improved:

- Some controllers combine HTTP handling, database operations, and file processing and could be split into smaller services.
- Some frontend failures are only written to `console.log` instead of being presented consistently to users.
- Frontend and backend validation limits are maintained separately and could drift.
- Several service methods rely on inferred return types instead of explicit `Observable` return types.
- Like, bookmark, and follow actions currently use `GET` despite changing server state. `POST` or `PATCH` would better match normal HTTP expectations.
- The feed component retains some inline-editing state alongside the edit modal, which should be simplified.
- More complex end-to-end tests would complement the existing unit and API tests.

These limitations are documented rather than hidden and provide clear targets for future refactoring.
