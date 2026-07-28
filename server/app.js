const express = require("express");
const cors = require("cors");
const upload = require("express-fileupload");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const routes = require("./routes/routes");

const cookieParser = require("cookie-parser");

const REQUEST_BODY_LIMIT = "16kb";
const MAX_UPLOAD_BYTES = 1_000_000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const GENERAL_REQUEST_LIMIT = 300;
const AUTHENTICATION_REQUEST_LIMIT = 10;

const createRateLimiter = (limit) =>
  rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  });

const ALLOWED_ORIGINS = [
  "http://localhost:4200",
  "http://localhost:5173",
  "https://chirp.blog",
  "https://www.chirp.blog",
];

const configureApp = (app) => {
  app.set("trust proxy", "loopback");
  app.disable("x-powered-by");

  app.use(helmet());

  app.use(
    cors({
      credentials: true,
      origin: ALLOWED_ORIGINS,
    }),
  );

  const generalRateLimiter = createRateLimiter(GENERAL_REQUEST_LIMIT);
  const authenticationRateLimiter = createRateLimiter(
    AUTHENTICATION_REQUEST_LIMIT,
  );

  app.use(
    ["/api/users/login", "/api/users/register"],
    authenticationRateLimiter,
  );
  app.use("/api", generalRateLimiter);

  app.use(cookieParser());

  app.use(
    express.urlencoded({
      extended: true,
      limit: REQUEST_BODY_LIMIT,
    }),
  );
  app.use(express.json({ limit: REQUEST_BODY_LIMIT }));

  app.use(
    upload({
      limits: {
        fileSize: MAX_UPLOAD_BYTES,
      },
      abortOnLimit: true,
    }),
  );

  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = configureApp;
