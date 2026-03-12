const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// All routes require authentication
router.get('/', authMiddleware, branchController.getBranches);
router.get('/:id', authMiddleware, branchController.getBranchById);

// Admin only
router.post('/', authMiddleware, roleMiddleware('admin'), branchController.createBranch);
router.put('/:id', authMiddleware, roleMiddleware('admin'), branchController.updateBranch);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), branchController.deleteBranch);

// Branch stock management (Admin only)
router.get('/:branchId/stock', authMiddleware, branchController.getBranchStock);
router.put('/:branchId/stock/:variantId', authMiddleware, roleMiddleware('admin'), branchController.updateBranchStock);

module.exports = router;
