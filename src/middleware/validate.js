const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

const WRITABLE = ['name', 'sku', 'category', 'price', 'quantity', 'reorderLevel', 'supplier'];
const REQUIRED_ON_CREATE = ['name', 'sku', 'category', 'price', 'quantity'];

exports.validateObjectId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError(`Invalid product id: ${req.params.id}`, 400));
  }
  next();
};

const buildProductValidator = (isCreate) => (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  if (isCreate) {
    REQUIRED_ON_CREATE.forEach((f) => {
      if (body[f] === undefined || body[f] === null || body[f] === '') errors.push(`${f} is required`);
    });
  }
  ['price', 'quantity', 'reorderLevel'].forEach((f) => {
    if (body[f] !== undefined && (typeof body[f] !== 'number' || Number.isNaN(body[f]))) {
      errors.push(`${f} must be a number`);
    }
  });
  ['name', 'sku', 'category', 'supplier'].forEach((f) => {
    if (body[f] !== undefined && typeof body[f] !== 'string') errors.push(`${f} must be a string`);
  });
  if (errors.length) return next(new AppError('Validation failed', 400, errors));

  const clean = {};
  WRITABLE.forEach((f) => {
    if (body[f] !== undefined) clean[f] = body[f];
  });
  if (!isCreate && Object.keys(clean).length === 0) {
    return next(new AppError('Provide at least one field to update', 400));
  }
  req.body = clean;
  next();
};

exports.validateCreate = buildProductValidator(true);
exports.validateUpdate = buildProductValidator(false);

exports.validateStockChange = (req, res, next) => {
  const { change, type, amount } = req.body || {};
  let delta;

  if (change !== undefined) {
    delta = change;
  } else if (type !== undefined && amount !== undefined) {
    if (!['restock', 'sale'].includes(type)) {
      return next(new AppError('type must be "restock" or "sale"', 400));
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      return next(new AppError('amount must be a positive integer', 400));
    }
    delta = type === 'sale' ? -amount : amount;
  } else {
    return next(new AppError('Provide "change" (positive = restock, negative = sale)', 400));
  }

  if (!Number.isInteger(delta) || delta === 0) {
    return next(new AppError('change must be a non-zero integer', 400));
  }
  req.stockChange = delta;
  next();
};
