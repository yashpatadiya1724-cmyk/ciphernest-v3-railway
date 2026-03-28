const express = require('express');
const router = express.Router();
const { getSystemStats, getDashboardOverview } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.get('/overview', protect, getDashboardOverview);
router.get('/system-stats', protect, getSystemStats);

module.exports = router;
