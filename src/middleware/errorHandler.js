const AppError = require('../utils/AppError');

exports.notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

// Centralized error handler - every error ends up here
// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => e.message);
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value: a product with this ${field} already exists`;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON in request body';
  }

  if (status >= 500) console.error(err);

  const body = { message };
  if (details) body.errors = details;
  res.status(status).json(body);
};
