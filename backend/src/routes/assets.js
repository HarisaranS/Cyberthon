const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAssets,
  getAsset,
  getAssetStats,
  triggerDiscovery,
  authenticateAsset,
  scanAsset
} = require('../controllers/assetController');

router.use(protect);

router.get('/', getAssets);
router.get('/stats', getAssetStats);
router.get('/:id', getAsset);
router.post('/discover', authorize('admin', 'super_admin'), triggerDiscovery);
router.post('/:id/authenticate', authorize('admin', 'super_admin'), authenticateAsset);
router.post('/:id/scan', scanAsset);

module.exports = router;
