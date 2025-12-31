const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { askLearningBot, paymentAssistant, smartSupport } = require('../controllers/aiController');

router.post('/learn', protect, askLearningBot);
router.post('/payment-assist', protect, paymentAssistant);
router.post('/support', protect, smartSupport);

module.exports = router;
