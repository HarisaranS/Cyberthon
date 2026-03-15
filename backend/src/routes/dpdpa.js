const express = require('express');
const router = express.Router();
const dpdpaController = require('../controllers/dpdpaController');
const { protect } = require('../middleware/auth');

// All DPDPA routes are protected
router.use(protect);

router.get('/compliance', dpdpaController.getComplianceStatus);
router.post('/compliance', dpdpaController.addComplianceItem);
router.delete('/compliance/:id', dpdpaController.deleteComplianceItem);

router.get('/consent', dpdpaController.getConsentRecords);
router.post('/consent', dpdpaController.addConsentRecord);
router.delete('/consent/:id', dpdpaController.deleteConsentRecord);

router.get('/nomination', dpdpaController.getNominationRecords);
router.post('/nomination', dpdpaController.addNomination);
router.delete('/nomination/:id', dpdpaController.deleteNomination);

module.exports = router;
