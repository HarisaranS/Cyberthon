const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportController');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get('/', ctrl.getReports);
router.post('/generate', ctrl.generateReport);
router.get('/:id', ctrl.getReport);
router.get('/:id/download', ctrl.downloadReport);
router.delete('/:id', ctrl.deleteReport);

module.exports = router;
