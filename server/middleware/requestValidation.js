const { isObjectIdOrHexString } = require("mongoose");

const HttpError = require("../models/errorModel");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_FULL_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_BYTES = 72;
const MAX_POST_LENGTH = 500;

const isNonEmptyString = (value, maxLength) =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.length <= maxLength;

const isValidEmail = (value) =>
  isNonEmptyString(value, MAX_EMAIL_LENGTH) && EMAIL_PATTERN.test(value.trim());

const isValidPassword = (value) =>
  typeof value === "string" &&
  value.length >= MIN_PASSWORD_LENGTH &&
  Buffer.byteLength(value, "utf8") <= MAX_PASSWORD_BYTES;

const validateRegistrationBody = (req, res, next) => {
  const { fullName, email, password, confirmPassword } = req.body ?? {};

  const registrationIsValid =
    isNonEmptyString(fullName, MAX_FULL_NAME_LENGTH) &&
    isValidEmail(email) &&
    isValidPassword(password) &&
    confirmPassword === password;

  if (!registrationIsValid) {
    return next(new HttpError("Invalid registration data", 400));
  }

  req.body.fullName = fullName.trim();
  req.body.email = email.trim();

  next();
};

const validateLoginBody = (req, res, next) => {
  const { email, password } = req.body ?? {};

  if (!isValidEmail(email) || !isValidPassword(password)) {
    return next(new HttpError("Invalid login data", 400));
  }

  req.body.email = email.trim();

  next();
};

const validatePostBody = (req, res, next) => {
  const { body } = req.body ?? {};

  if (!isNonEmptyString(body, MAX_POST_LENGTH)) {
    return next(
      new HttpError(
        `Post body must contain between 1 and ${MAX_POST_LENGTH} characters`,
        400,
      ),
    );
  }

  req.body.body = body.trim();

  next();
};

const validateObjectIdParam = (paramName) => (req, res, next) => {
  const objectId = req.params[paramName];

  if (!isObjectIdOrHexString(objectId)) {
    return next(new HttpError(`Invalid ${paramName}`, 400));
  }

  next();
};

module.exports = {
  validateRegistrationBody,
  validateLoginBody,
  validatePostBody,
  validateObjectIdParam,
};
