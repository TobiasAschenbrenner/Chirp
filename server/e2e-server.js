process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "chirp-e2e-only-secret";

const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server-core");

const configureApp = require("./app");

const HOST = "127.0.0.1";
const PORT = 3001;

let mongoServer;
let httpServer;
let shuttingDown = false;

const shutdown = async () => {
  if (shuttingDown) return;
  shuttingDown = true;

  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
  }

  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }
};

const handleShutdown = async () => {
  try {
    await shutdown();
    process.exit(0);
  } catch (error) {
    console.error("Failed to stop E2E server:", error);
    process.exit(1);
  }
};

const start = async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: { dbName: "chirp-e2e" },
  });

  await mongoose.connect(mongoServer.getUri());

  const app = configureApp(express());

  await new Promise((resolve, reject) => {
    httpServer = app.listen(PORT, HOST);
    httpServer.once("listening", resolve);
    httpServer.once("error", reject);
  });

  console.log(`E2E server running on http://${HOST}:${PORT}`);
};

process.once("SIGINT", handleShutdown);
process.once("SIGTERM", handleShutdown);

start().catch(async (error) => {
  console.error("Failed to start E2E server:", error);
  await shutdown();
  process.exit(1);
});
