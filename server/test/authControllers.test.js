const { after, test } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");

const UserModel = require("../models/userModel");
const RefreshSessionModel = require("../models/refreshSessionModel");
const {
  REFRESH_COOKIE_NAME,
  hashRefreshToken,
} = require("../utils/authTokens");
const {
  loginUser,
  refreshAccessToken,
  logoutUser,
} = require("../controllers/userControllers");

const originalJwtSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = "chirp-controller-test-secret";

after(() => {
  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalJwtSecret;
  }
});

const stubMethod = (t, target, methodName, replacement) => {
  const original = target[methodName];
  target[methodName] = replacement;

  t.after(() => {
    target[methodName] = original;
  });
};

const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  headers: new Map(),
  cookies: [],
  clearedCookies: [],

  set(name, value) {
    this.headers.set(name.toLowerCase(), value);
    return this;
  },

  cookie(name, value, options) {
    this.cookies.push({ name, value, options });
    return this;
  },

  clearCookie(name, options) {
    this.clearedCookies.push({ name, options });
    return this;
  },

  status(statusCode) {
    this.statusCode = statusCode;
    return this;
  },

  json(body) {
    this.body = body;
    return this;
  },

  send(body) {
    this.body = body;
    return this;
  },
});

test("login creates a hashed refresh session", async (t) => {
  const userId = "507f191e810c19729de860ea";
  let createdSession;

  stubMethod(t, UserModel, "findOne", () => ({
    select: async (selection) => {
      assert.equal(selection, "+password");

      return {
        _id: userId,
        password: "stored-password-hash",
      };
    },
  }));

  stubMethod(t, bcrypt, "compare", async () => true);

  stubMethod(t, RefreshSessionModel, "create", async (session) => {
    createdSession = session;
    return session;
  });

  const response = createResponse();
  let nextError;

  await loginUser(
    {
      body: {
        email: "user@example.com",
        password: "Password123!",
      },
    },
    response,
    (error) => {
      nextError = error;
    },
  );

  const refreshCookie = response.cookies[0];

  assert.equal(nextError, undefined);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.id, userId);
  assert.equal(typeof response.body.token, "string");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(refreshCookie.name, REFRESH_COOKIE_NAME);
  assert.equal(refreshCookie.options.httpOnly, true);
  assert.equal(refreshCookie.options.sameSite, "strict");
  assert.equal(refreshCookie.options.path, "/api/users");
  assert.equal(createdSession.user, userId);
  assert.equal(createdSession.tokenHash, hashRefreshToken(refreshCookie.value));
  assert.notEqual(createdSession.tokenHash, refreshCookie.value);
  assert.ok(createdSession.expiresAt instanceof Date);
});

test("refresh consumes the old session and rotates its token", async (t) => {
  const userId = "507f191e810c19729de860ea";
  const oldRefreshToken = "old-refresh-token";
  let consumedSessionFilter;
  let createdSession;

  stubMethod(t, RefreshSessionModel, "findOneAndDelete", async (filter) => {
    consumedSessionFilter = filter;
    return { user: userId };
  });

  stubMethod(t, UserModel, "exists", async (filter) => {
    assert.deepEqual(filter, { _id: userId });
    return { _id: userId };
  });

  stubMethod(t, RefreshSessionModel, "create", async (session) => {
    createdSession = session;
    return session;
  });

  const response = createResponse();
  let nextError;

  await refreshAccessToken(
    {
      cookies: {
        [REFRESH_COOKIE_NAME]: oldRefreshToken,
      },
    },
    response,
    (error) => {
      nextError = error;
    },
  );

  const nextRefreshCookie = response.cookies[0];

  assert.equal(nextError, undefined);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.id, userId);
  assert.equal(typeof response.body.token, "string");
  assert.equal(
    consumedSessionFilter.tokenHash,
    hashRefreshToken(oldRefreshToken),
  );
  assert.ok(consumedSessionFilter.expiresAt.$gt instanceof Date);
  assert.notEqual(nextRefreshCookie.value, oldRefreshToken);
  assert.equal(
    createdSession.tokenHash,
    hashRefreshToken(nextRefreshCookie.value),
  );
});

test("rejects an invalid or reused refresh token", async (t) => {
  stubMethod(t, RefreshSessionModel, "findOneAndDelete", async () => null);

  const response = createResponse();
  let nextError;

  await refreshAccessToken(
    {
      cookies: {
        [REFRESH_COOKIE_NAME]: "already-consumed-token",
      },
    },
    response,
    (error) => {
      nextError = error;
    },
  );

  assert.equal(nextError.code, 401);
  assert.equal(nextError.message, "Invalid or expired refresh token");
  assert.equal(response.cookies.length, 0);
  assert.equal(response.clearedCookies[0].name, REFRESH_COOKIE_NAME);
});

test("logout revokes the session and clears its cookie", async (t) => {
  const refreshToken = "refresh-token-to-revoke";
  let deletionFilter;

  stubMethod(t, RefreshSessionModel, "deleteOne", async (filter) => {
    deletionFilter = filter;
    return { acknowledged: true, deletedCount: 1 };
  });

  const response = createResponse();
  let nextError;

  await logoutUser(
    {
      cookies: {
        [REFRESH_COOKIE_NAME]: refreshToken,
      },
    },
    response,
    (error) => {
      nextError = error;
    },
  );

  assert.equal(nextError, undefined);
  assert.deepEqual(deletionFilter, {
    tokenHash: hashRefreshToken(refreshToken),
  });
  assert.equal(response.statusCode, 204);
  assert.equal(response.clearedCookies[0].name, REFRESH_COOKIE_NAME);
});
