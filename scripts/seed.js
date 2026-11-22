require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

const data = [
  { name: 'Study Table', sku: 'FURN-TB-812', category: 'Furniture', price: 3999, quantity: 2, reorderLevel: 4, supplier: 'IKEA India' },
  { name: 'Office Chair', sku: 'FURN-CH-101', category: 'Furniture', price: 6499, quantity: 15, reorderLevel: 5, supplier: 'Godrej Interio' },
  { name: 'Wireless Mouse', sku: 'ELEC-MS-220', category: 'Electronics', price: 799, quantity: 40, reorderLevel: 10, supplier: 'Logitech' },
  { name: 'Mechanical Keyboard', sku: 'ELEC-KB-330', category: 'Electronics', price: 4599, quantity: 3, reorderLevel: 8, supplier: 'Keychron' },
  { name: 'Laptop 14"', sku: 'ELEC-LP-440', category: 'Electronics', price: 54999, quantity: 6, reorderLevel: 6, supplier: 'Lenovo' },
  { name: 'USB-C Hub', sku: 'ELEC-HB-550', category: 'Electronics', price: 1999, quantity: 47, reorderLevel: 10, supplier: 'Anker' },
  { name: 'Cotton T-Shirt', sku: 'APPR-TS-660', category: 'Apparel', price: 599, quantity: 60, reorderLevel: 15, supplier: 'Allen Solly' },
  { name: 'Denim Jacket', sku: 'APPR-JK-770', category: 'Apparel', price: 2199, quantity: 18, reorderLevel: 6, supplier: 'Levis' },
  { name: 'Notebook A4', sku: 'STNY-NB-880', category: 'Stationery', price: 90, quantity: 120, reorderLevel: 30, supplier: 'Classmate' },
  { name: 'Gel Pen Pack of 15', sku: 'STNY-PN-713', category: 'Stationery', price: 120, quantity: 4, reorderLevel: 20, supplier: 'Cello Pens' },
  { name: 'Basmati Rice 5kg', sku: 'GROC-RC-990', category: 'Grocery', price: 650, quantity: 35, reorderLevel: 10, supplier: 'India Gate' },
  { name: 'Olive Oil 1L', sku: 'GROC-OL-991', category: 'Grocery', price: 899, quantity: 9, reorderLevel: 10, supplier: 'Figaro' },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Product.deleteMany({});
  await Product.insertMany(data);
  console.log(`Seeded ${data.length} products`);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
