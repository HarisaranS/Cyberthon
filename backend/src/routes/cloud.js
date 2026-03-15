const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCredentials,
  addCredential,
  deleteCredential,
  triggerCloudDiscovery,
  getCloudResources,
  getCloudStats
} = require('../controllers/cloudController');

router.use(protect);

router.get('/credentials', getCredentials);
router.post('/credentials', authorize('admin', 'super_admin'), addCredential);
router.delete('/credentials/:id', authorize('admin', 'super_admin'), deleteCredential);
router.post('/discover', authorize('admin', 'super_admin'), triggerCloudDiscovery);
router.get('/resources', getCloudResources);
router.get('/stats', getCloudStats);

module.exports = router;
