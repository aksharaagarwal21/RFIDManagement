const express = require('express');
const {
  processRfidScan,
  getRfidLogs,
  getLocationHistory
} = require('../controllers/rfidController');
const { protect, authorize, rfidAuth } = require('../middleware/auth');
const { validateRfidScan, validateObjectId, validatePagination } = require('../middleware/validation');
const { ROLES } = require('../config/constants');

const router = express.Router();

// RFID device routes (require device authentication)
router.post('/scan', rfidAuth, validateRfidScan, processRfidScan);

// Protected user routes
router.use(protect);

router.get('/logs', validatePagination, getRfidLogs);
router.get('/location-history/:userId', validateObjectId('userId'), getLocationHistory);

module.exports = router;
