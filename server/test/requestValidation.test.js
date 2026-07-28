const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");

const CommentModel = require("../models/commentModel");
const PostModel = require("../models/postModel");
const UserModel = require("../models/userModel");

const routes = require("../routes/routes");
const { errorHandler } = require("../middleware/errorMiddleware");

process.env.JWT_SECRET = "chirp-validation-test-secret";

const app = express();

app.use(express.json());
app.use("/api", routes);
app.use(errorHandler);

let server;
let baseUrl;

before(
  () =>
    new Promise((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    }),
);

after(
  () =>
    new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    }),
);

const authToken = jwt.sign(
  { id: "507f191e810c19729de860ea" },
  process.env.JWT_SECRET,
  { expiresIn: "5m" },
);

const validPostId = "507f191e810c19729de860eb";
const validCommentId = "507f191e810c19729de860ec";

const mockCommentPersistence = (testContext) => {
  testContext.mock.method(UserModel, "findById", async () => ({
    fullName: "Security Test User",
    profilePhoto: "https://example.com/avatar.png",
  }));

  const createCommentMock = testContext.mock.method(
    CommentModel,
    "create",
    async (commentData) => ({
      _id: validCommentId,
      ...commentData,
    }),
  );

  testContext.mock.method(PostModel, "findByIdAndUpdate", async () => ({}));

  return createCommentMock;
};

test("rejects NoSQL operator objects in registration input", async () => {
  const response = await fetch(`${baseUrl}/api/users/register`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      fullName: "Security Test User",
      email: { $ne: null },
      password: "password123",
      confirmPassword: "password123",
    }),
  });

  assert.equal(response.status, 400);
});

test("rejects non-string login input", async () => {
  const response = await fetch(`${baseUrl}/api/users/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: ["security-test@example.com"],
      password: "password123",
    }),
  });

  assert.equal(response.status, 400);
});

test("rejects NoSQL operator objects in post input", async () => {
  const response = await fetch(`${baseUrl}/api/posts`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${authToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      body: { $ne: null },
    }),
  });

  assert.equal(response.status, 400);
});

test("rejects malformed MongoDB resource IDs", async () => {
  const response = await fetch(`${baseUrl}/api/users/not-a-valid-object-id`, {
    headers: {
      authorization: `Bearer ${authToken}`,
    },
  });

  assert.equal(response.status, 400);
});

test("accepts valid profile input on the profile edit endpoint", async (t) => {
  const updateUserMock = t.mock.method(
    UserModel,
    "findByIdAndUpdate",
    async () => ({
      _id: "507f191e810c19729de860ea",
      fullName: "Updated Test User",
      bio: "Updated biography",
    }),
  );

  const response = await fetch(`${baseUrl}/api/users/edit`, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${authToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      fullName: "Updated Test User",
      bio: "Updated biography",
    }),
  });

  assert.equal(response.status, 200);
  assert.equal(updateUserMock.mock.callCount(), 1);
});

test("rejects non-string profile input", async (t) => {
  const updateUserMock = t.mock.method(
    UserModel,
    "findByIdAndUpdate",
    async () => ({}),
  );

  const response = await fetch(`${baseUrl}/api/users/edit`, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${authToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      fullName: { $ne: null },
      bio: "Updated biography",
    }),
  });

  const responseBody = await response.json();

  assert.equal(response.status, 400);
  assert.equal(responseBody.message, "Invalid profile data");
  assert.equal(updateUserMock.mock.callCount(), 0);
});

test("rejects NoSQL operator objects in comment input", async (t) => {
  const createCommentMock = mockCommentPersistence(t);

  const response = await fetch(`${baseUrl}/api/comments/${validPostId}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${authToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      comment: { $ne: null },
    }),
  });

  assert.equal(response.status, 400);
  assert.equal(createCommentMock.mock.callCount(), 0);
});

test("rejects comments longer than 500 characters", async (t) => {
  const createCommentMock = mockCommentPersistence(t);

  const response = await fetch(`${baseUrl}/api/comments/${validPostId}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${authToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      comment: "a".repeat(501),
    }),
  });

  assert.equal(response.status, 400);
  assert.equal(createCommentMock.mock.callCount(), 0);
});

test("keeps active profile action routes reachable", async () => {
  const headers = {
    authorization: `Bearer ${authToken}`,
  };

  const [followResponse, postsResponse, avatarResponse] = await Promise.all([
    fetch(`${baseUrl}/api/users/not-a-valid-object-id/follow-unfollow`, {
      headers,
    }),
    fetch(`${baseUrl}/api/users/not-a-valid-object-id/posts`, { headers }),
    fetch(`${baseUrl}/api/users/avatar`, {
      method: "POST",
      headers,
    }),
  ]);

  assert.deepEqual(
    {
      follow: followResponse.status,
      posts: postsResponse.status,
      avatar: avatarResponse.status,
    },
    {
      follow: 400,
      posts: 400,
      avatar: 422,
    },
  );
});
