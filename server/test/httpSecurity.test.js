const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");

const configureApp = require("../app");

const app = configureApp(express());

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

test("sets security headers and removes the Express disclosure header", async () => {
  const response = await fetch(`${baseUrl}/api/not-found`);

  assert.deepEqual(
    {
      contentTypeOptions: response.headers.get("x-content-type-options"),
      frameOptions: response.headers.get("x-frame-options"),
      poweredBy: response.headers.get("x-powered-by"),
    },
    {
      contentTypeOptions: "nosniff",
      frameOptions: "SAMEORIGIN",
      poweredBy: null,
    },
  );
});

test("allows the production frontend origin but not arbitrary origins", async () => {
  const [productionResponse, untrustedResponse] = await Promise.all([
    fetch(`${baseUrl}/api/not-found`, {
      headers: {
        origin: "https://chirp.blog",
      },
    }),
    fetch(`${baseUrl}/api/not-found`, {
      headers: {
        origin: "https://untrusted.example",
      },
    }),
  ]);

  assert.deepEqual(
    {
      allowedOrigin: productionResponse.headers.get(
        "access-control-allow-origin",
      ),
      credentials: productionResponse.headers.get(
        "access-control-allow-credentials",
      ),
      untrustedOrigin: untrustedResponse.headers.get(
        "access-control-allow-origin",
      ),
    },
    {
      allowedOrigin: "https://chirp.blog",
      credentials: "true",
      untrustedOrigin: null,
    },
  );
});

test("rejects JSON request bodies larger than 16 KB", async () => {
  const response = await fetch(`${baseUrl}/api/not-found`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      value: "a".repeat(20_000),
    }),
  });

  assert.equal(response.status, 413);
});

test("rejects uploaded files larger than 1 MB", async () => {
  const formData = new FormData();
  const oversizedImage = new Blob([Buffer.alloc(1_000_001)], {
    type: "image/png",
  });

  formData.append("image", oversizedImage, "oversized.png");

  const response = await fetch(`${baseUrl}/api/not-found`, {
    method: "POST",
    body: formData,
  });

  assert.equal(response.status, 413);
});

test("allows normal browsing while strictly limiting authentication attempts", async () => {
  let responseAfterOldLimit;
  let generalFinalResponse;

  for (let attempt = 1; attempt <= 301; attempt += 1) {
    generalFinalResponse = await fetch(`${baseUrl}/api/not-found`, {
      headers: {
        "x-forwarded-for": "198.51.100.20",
      },
    });

    if (attempt === 101) {
      responseAfterOldLimit = generalFinalResponse;
    }
  }

  let authenticationFinalResponse;

  for (let attempt = 1; attempt <= 11; attempt += 1) {
    authenticationFinalResponse = await fetch(`${baseUrl}/api/users/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "198.51.100.21",
      },
      body: JSON.stringify({}),
    });
  }

  assert.deepEqual(
    {
      afterOldLimit: responseAfterOldLimit.status,
      afterNewLimit: generalFinalResponse.status,
      authentication: authenticationFinalResponse.status,
    },
    {
      afterOldLimit: 404,
      afterNewLimit: 429,
      authentication: 429,
    },
  );

  assert.ok(authenticationFinalResponse.headers.get("retry-after"));
});
