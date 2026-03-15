const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/alertController');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get('/', ctrl.getAlerts);
router.get('/unread-count', ctrl.getUnreadCount);
router.post('/mark-all-read', ctrl.markAllRead);
router.patch('/:id/read', ctrl.markRead);
router.patch('/:id/resolve', ctrl.resolveAlert);

module.exports = router;
