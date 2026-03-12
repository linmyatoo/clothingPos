const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);

// Employee management (Admin only)
router.get('/employees', authMiddleware, roleMiddleware('admin'), authController.getEmployees);
router.post('/employees', authMiddleware, roleMiddleware('admin'), authController.createEmployee);
router.put('/employees/:id', authMiddleware, roleMiddleware('admin'), authController.updateEmployee);
router.delete('/employees/:id', authMiddleware, roleMiddleware('admin'), authController.deleteEmployee);

module.exports = router;
