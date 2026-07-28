const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");

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
