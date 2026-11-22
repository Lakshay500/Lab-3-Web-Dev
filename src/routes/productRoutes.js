const express = require('express');
const c = require('../controllers/productController');
const { validateObjectId, validateCreate, validateUpdate, validateStockChange } = require('../middleware/validate');

const router = express.Router();
router.get('/low-stock', c.getLowStock);
router.get('/summary', c.getSummary);

router.route('/').get(c.getProducts).post(validateCreate, c.createProduct);

router
  .route('/:id')
  .get(validateObjectId, c.getProductById)
  .put(validateObjectId, validateUpdate, c.updateProduct)
  .delete(validateObjectId, c.deleteProduct);

router.patch('/:id/stock', validateObjectId, validateStockChange, c.adjustStock);

module.exports = router;
