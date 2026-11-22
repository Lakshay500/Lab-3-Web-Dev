const mongoose = require('mongoose');
const isInt = { validator: Number.isInteger, message: '{PATH} must be a whole number' };
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9-]{3,30}$/, 'SKU may contain only letters, digits and hyphens (3-30 chars)'],
    },
    category: { type: String, required: [true, 'Category is required'], trim: true },
    price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      validate: isInt,
      default: 0,
    },
    reorderLevel: {
      type: Number,
      min: [0, 'Reorder level cannot be negative'],
      validate: isInt,
      default: 5,
    },
    supplier: { type: String, trim: true, default: 'Unknown' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.virtual('stockValue').get(function () {
  return this.price * this.quantity;
});

productSchema.index({ category: 1, price: 1 });
productSchema.index({ quantity: 1 });
productSchema.index({ name: 1 });

module.exports = mongoose.model('Product', productSchema);
