const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/scanController');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get('/', ctrl.getScans);
router.post('/', ctrl.startScan);
router.get('/active', ctrl.getActiveScans);
router.get('/stats', ctrl.getScanStats);
router.get('/:id', ctrl.getScan);
router.get('/:id/results', ctrl.getScanResults);
router.post('/:id/cancel', ctrl.cancelScan);

module.exports = router;
