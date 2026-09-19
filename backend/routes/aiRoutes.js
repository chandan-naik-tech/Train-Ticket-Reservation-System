const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/waitlist', aiController.predictWaitlist);
router.post('/plan', aiController.planTravel);
router.post('/fare', aiController.predictFare);
router.post('/crowd', aiController.predictCrowd);
router.post('/recommend-seat', aiController.recommendSeat);
router.post('/chatbot', aiController.chatbotQuery);

module.exports = router;
