const { createHash, randomBytes } = require("node:crypto");
const jwt = require("jsonwebtoken");

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_COOKIE_NAME = "chirp_refresh_token";

const createAccessToken = (userId) =>
  jwt.sign({ id: String(userId) }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });

const createRefreshToken = () => randomBytes(48).toString("base64url");

const hashRefreshToken = (token) =>
  createHash("sha256").update(token).digest("hex");

const getRefreshTokenExpiry = () => new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/users",
  maxAge: REFRESH_TOKEN_TTL_MS,
});

const getRefreshCookieClearOptions = () => {
  const options = getRefreshCookieOptions();
  delete options.maxAge;
  return options;
};

module.exports = {
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_MS,
  createAccessToken,
  createRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
  getRefreshCookieOptions,
  getRefreshCookieClearOptions,
};
