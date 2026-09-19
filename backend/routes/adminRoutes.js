const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeAdmin } = require('../middleware/authMiddleware');

// Secure all admin routes with auth and role validation
router.use(authenticateToken, authorizeAdmin);

router.get('/stats', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);
router.get('/bookings', adminController.getAllBookings);
router.put('/bookings/:id/cancel', adminController.cancelBooking);
router.delete('/bookings/:id', adminController.deleteBooking);

router.get('/trains', adminController.getAllTrains);
router.post('/trains', adminController.createTrain);
router.put('/trains/:id', adminController.updateTrain);
router.delete('/trains/:id', adminController.deleteTrain);

router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
