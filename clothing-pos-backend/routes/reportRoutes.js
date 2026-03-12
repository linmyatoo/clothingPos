const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/dashboard', authMiddleware, roleMiddleware('admin'), reportController.getDashboardStats);
router.get('/daily', authMiddleware, roleMiddleware('admin', 'employee'), reportController.getDailySales);
router.get('/monthly', authMiddleware, roleMiddleware('admin'), reportController.getMonthlySales);
router.get('/yearly', authMiddleware, roleMiddleware('admin'), reportController.getYearlySales);
router.get('/performance', authMiddleware, roleMiddleware('admin'), reportController.getPerformance);

module.exports = router;
