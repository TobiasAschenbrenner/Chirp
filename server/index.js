const express = require("express");
const { connect } = require("mongoose");
require("dotenv").config();

const configureApp = require("./app");

const app = configureApp(express());

connect(process.env.MONGO_URL)
  .then(() => {
    app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`),
    );
  })
  .catch((error) => console.error(error));
