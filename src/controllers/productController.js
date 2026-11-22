const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SORTABLE = ['name', 'price', 'quantity', 'category', 'createdAt', 'updatedAt'];

const parseSort = (raw) => {
  if (!raw) return { createdAt: -1 };
  const sort = {};
  String(raw)
    .split(',')
    .forEach((token) => {
      const desc = token.startsWith('-');
      const field = token.replace(/^-/, '').trim();
      if (SORTABLE.includes(field)) sort[field] = desc ? -1 : 1;
    });
  return Object.keys(sort).length ? sort : { createdAt: -1 };
};

exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

exports.getProducts = asyncHandler(async (req, res) => {
  const { category, search, supplier, minPrice, maxPrice, inStock, lowStock, sort } = req.query;
  const filter = {};

  if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, 'i');
  if (supplier) filter.supplier = new RegExp(`^${escapeRegex(supplier)}$`, 'i');
  if (search) filter.name = new RegExp(escapeRegex(search), 'i');

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) {
      if (Number.isNaN(Number(minPrice))) throw new AppError('minPrice must be a number', 400);
      filter.price.$gte = Number(minPrice);
    }
    if (maxPrice !== undefined) {
      if (Number.isNaN(Number(maxPrice))) throw new AppError('maxPrice must be a number', 400);
      filter.price.$lte = Number(maxPrice);
    }
  }
  if (inStock === 'true') filter.quantity = { $gt: 0 };
  if (inStock === 'false') filter.quantity = 0;
  if (lowStock === 'true') filter.$expr = { $lte: ['$quantity', '$reorderLevel'] };

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter)
      .sort(parseSort(sort))
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  res.json({
    total,
    page,
    totalPages: Math.ceil(total / limit),
    count: products.length,
    products,
  });
});

exports.getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  res.json(product);
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!product) throw new AppError('Product not found', 404);
  res.json(product);
});

exports.adjustStock = asyncHandler(async (req, res) => {
  const change = req.stockChange;
  const filter = { _id: req.params.id };
  if (change < 0) filter.quantity = { $gte: -change };

  const product = await Product.findOneAndUpdate(
    filter,
    { $inc: { quantity: change } },
    { new: true, runValidators: true }
  );

  if (!product) {
    const exists = await Product.exists({ _id: req.params.id });
    if (!exists) throw new AppError('Product not found', 404);
    throw new AppError('Insufficient stock for this sale', 400);
  }
  res.json({ message: 'Stock updated', product });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  res.json({ message: 'Product deleted', id: product.id });
});

exports.getLowStock = asyncHandler(async (req, res) => {
  const lowStockItems = await Product.aggregate([
    { $match: { $expr: { $lte: ['$quantity', '$reorderLevel'] } } },
    { $sort: { quantity: 1 } },
  ]);

  const items = lowStockItems.map((p) => ({
    ...p,
    stockValue: p.price * p.quantity,
    id: String(p._id),
  }));
  res.json({ count: items.length, lowStockItems: items });
});

exports.getSummary = asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } },
        avgPrice: { $avg: '$price' },
      },
    },
    { $set: { avgPrice: { $round: ['$avgPrice', 2] } } },
    { $sort: { totalStockValue: -1 } },
  ]);
  res.json({ categories: summary.length, summary });
});
