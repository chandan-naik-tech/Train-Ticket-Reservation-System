const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/admin/login', authController.adminLogin);
router.post('/admin/register', authController.adminRegister);
router.post('/forgot-password', authController.forgotPassword);

router.get('/profile', authenticateToken, authController.getProfile);
router.post('/wallet/add', authenticateToken, authController.addWalletFunds);

module.exports = router;
