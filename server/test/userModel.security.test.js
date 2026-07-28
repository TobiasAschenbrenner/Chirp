const test = require("node:test");
const assert = require("node:assert/strict");

const UserModel = require("../models/userModel");

const userData = {
  fullName: "Security Test User",
  email: "security-test@example.com",
  password: "$2b$10$examplePasswordHash",
};

test("does not select the password field in database queries by default", () => {
  const passwordPath = UserModel.schema.path("password");

  assert.equal(passwordPath.options.select, false);
});

test("does not include the password field in serialized user responses", () => {
  const user = new UserModel(userData);

  // Express res.json() ultimately serializes the document as JSON.
  const responseBody = JSON.parse(JSON.stringify(user));

  assert.equal(Object.hasOwn(responseBody, "password"), false);
});
