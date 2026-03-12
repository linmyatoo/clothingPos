const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/upload');

// Public (authenticated)
router.get('/', authMiddleware, productController.getProducts);
router.get('/low-stock', authMiddleware, roleMiddleware('admin'), productController.getLowStock);
router.get('/:id', authMiddleware, productController.getProductById);

// Admin only
router.post('/', authMiddleware, roleMiddleware('admin'), productController.createProduct);
router.put('/:id', authMiddleware, roleMiddleware('admin'), productController.updateProduct);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), productController.deleteProduct);
router.post('/:id/variants', authMiddleware, roleMiddleware('admin'), productController.addVariant);
router.put('/variants/:variantId', authMiddleware, roleMiddleware('admin'), productController.updateVariant);

// Image upload
router.post('/:id/image', authMiddleware, roleMiddleware('admin'), upload.single('image'), productController.uploadProductImage);

module.exports = router;
