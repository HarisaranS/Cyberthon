const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dataSourceController');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Store uploads in uploads/<orgId>/ directory
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const dir = path.join(__dirname, '../../uploads', String(req.user?.orgId || 'tmp'));
		fs.mkdirSync(dir, { recursive: true });
		cb(null, dir);
	},
	filename: (req, file, cb) => {
		const safe = file.originalname.replace(/[^\w.\-]/g, '_');
		cb(null, `${Date.now()}_${safe}`);
	}
});
const upload = multer({
	storage,
	limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB per file
	fileFilter: (req, file, cb) => {
		const allowed = /\.(csv|txt|pdf|docx|xlsx|xls|json|xml|log|zip|jpg|jpeg|png|py|js|ts|java|env|yaml|yml|sql|md)$/i;
		cb(null, allowed.test(file.originalname));
	}
});

router.use(auth);
router.get('/', ctrl.getSources);
router.post('/', ctrl.createSource);
router.post('/upload', upload.array('files', 20), ctrl.uploadFiles);
router.post('/test', ctrl.testConnection);
router.get('/:id', ctrl.getSource);
router.patch('/:id', ctrl.updateSource);
router.delete('/:id', ctrl.deleteSource);

module.exports = router;
