const { connect } = require("mongoose");
require("dotenv").config();

const configureApp = require("./app");
const { server, app } = require("./socket/socket");

configureApp(app);

connect(process.env.MONGO_URL)
  .then(
    server.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`),
    ),
  )
  .catch((err) => console.log(err));
