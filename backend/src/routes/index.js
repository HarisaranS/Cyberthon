const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/sources', require('./dataSources'));
router.use('/scans', require('./scans'));
router.use('/dashboard', require('./dashboard'));
router.use('/alerts', require('./alerts'));
router.use('/reports', require('./reports'));
router.use('/ai', require('./ai'));
router.use('/public', require('./public'));
router.use('/discovery', require('./discoveryRoutes'));
router.use('/assets', require('./assets'));
router.use('/cloud', require('./cloud'));
router.use('/dpdpa', require('./dpdpa'));

module.exports = router;
