const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const {
  REFRESH_TOKEN_TTL_MS,
  createAccessToken,
  createRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
  getRefreshCookieOptions,
} = require("../utils/authTokens");

process.env.JWT_SECRET = "chirp-auth-test-secret";

test("creates a 15-minute access token for the user", () => {
  const userId = "507f191e810c19729de860ea";
  const token = createAccessToken(userId);
  const payload = jwt.verify(token, process.env.JWT_SECRET);

  assert.equal(payload.id, userId);
  assert.equal(payload.exp - payload.iat, 15 * 60);
});

test("creates unpredictable refresh tokens and hashes them", () => {
  const firstToken = createRefreshToken();
  const secondToken = createRefreshToken();

  assert.notEqual(firstToken, secondToken);
  assert.match(firstToken, /^[A-Za-z0-9_-]{64}$/);
  assert.match(hashRefreshToken(firstToken), /^[a-f0-9]{64}$/);
  assert.notEqual(hashRefreshToken(firstToken), firstToken);
});

test("creates a seven-day refresh-token expiry", () => {
  const before = Date.now();
  const expiry = getRefreshTokenExpiry().getTime();
  const after = Date.now();

  assert.ok(expiry >= before + REFRESH_TOKEN_TTL_MS);
  assert.ok(expiry <= after + REFRESH_TOKEN_TTL_MS);
});

test("uses a restricted HttpOnly refresh cookie", (t) => {
  const originalNodeEnv = process.env.NODE_ENV;

  t.after(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  process.env.NODE_ENV = "production";

  assert.deepEqual(getRefreshCookieOptions(), {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/api/users",
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
});
