const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/', authMiddleware, saleController.createSale);
router.get('/', authMiddleware, saleController.getSales);
router.get('/:id', authMiddleware, saleController.getSaleById);

module.exports = router;
