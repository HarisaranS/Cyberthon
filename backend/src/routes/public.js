const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');
const { publicDetectLimiter } = require('../middleware/rateLimiter');

router.post('/detect', publicDetectLimiter, ctrl.publicDetect);
router.post('/waitlist', (req, res) => {
  res.json({ success: true, message: 'Added to waitlist!' });
});
router.post('/contact', (req, res) => {
  res.json({ success: true, message: 'Message received. We will be in touch.' });
});

module.exports = router;
