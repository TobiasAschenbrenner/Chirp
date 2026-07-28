const express = require("express");
const cors = require("cors");
const upload = require("express-fileupload");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const routes = require("./routes/routes");

const REQUEST_BODY_LIMIT = "16kb";
const MAX_UPLOAD_BYTES = 1_000_000;

const ALLOWED_ORIGINS = [
  "http://localhost:4200",
  "http://localhost:5173",
  "https://chirp.blog",
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

  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );

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
