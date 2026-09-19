const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/book', authenticateToken, bookingController.bookTicket);
router.get('/pnr/:pnr', bookingController.getBookingByPNR); // PNR searches are public
router.post('/cancel', authenticateToken, bookingController.cancelTicket);
router.get('/history', authenticateToken, bookingController.getHistory);
router.get('/notifications', authenticateToken, bookingController.getNotifications);
router.post('/feedback', authenticateToken, bookingController.submitFeedback);

module.exports = router;
