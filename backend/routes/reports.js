const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generateReport } = require('../controllers/reportController');

router.get('/generate', protect, generateReport);

module.exports = router;
