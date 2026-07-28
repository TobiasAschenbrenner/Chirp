const test = require("node:test");
const assert = require("node:assert/strict");

const RefreshSessionModel = require("../models/refreshSessionModel");

test("stores refresh tokens as hidden hashes", () => {
  const tokenHashPath = RefreshSessionModel.schema.path("tokenHash");

  assert.equal(tokenHashPath.options.required, true);
  assert.equal(tokenHashPath.options.unique, true);
  assert.equal(tokenHashPath.options.select, false);
});

test("associates sessions with users and expires them automatically", () => {
  const userPath = RefreshSessionModel.schema.path("user");
  const expiresAtPath = RefreshSessionModel.schema.path("expiresAt");

  assert.equal(userPath.options.ref, "User");
  assert.equal(userPath.options.required, true);
  assert.equal(expiresAtPath.options.required, true);
  assert.equal(expiresAtPath.options.expires, 0);
});
