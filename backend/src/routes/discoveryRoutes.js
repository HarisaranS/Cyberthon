const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  discoverNetwork,
  getDiscoveredSources,
  scanAllDiscovered
} = require('../controllers/discoveryController');

router.use(protect);

router.post('/scan', authorize('admin', 'super_admin'), discoverNetwork);
router.get('/sources', getDiscoveredSources);
router.post('/scan-all', authorize('admin', 'super_admin'), scanAllDiscovered);

module.exports = router;
