const express = require("express");
const cors = require("cors");
const upload = require("express-fileupload");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const routes = require("./routes/routes");

const configureApp = (app) => {
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json({ extended: true }));
  app.use(cors({ credentials: true, origin: ["http://localhost:5173"] }));
  app.use(upload());

  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = configureApp;
