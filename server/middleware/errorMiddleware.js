// UNSUPPORTED ENDPOINTS

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// ERROR MIDDLEWARE

const isValidErrorStatus = (statusCode) =>
  Number.isInteger(statusCode) && statusCode >= 400 && statusCode <= 599;

const getErrorStatus = (error) =>
  [error.status, error.statusCode, error.code].find(isValidErrorStatus) ?? 500;

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  res
    .status(getErrorStatus(error))
    .json({ message: error.message || "An unknown error occurred!" });
};

module.exports = {
  notFound,
  errorHandler,
};
