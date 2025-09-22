const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Protect all routes
router.use(protect);

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, isRead, type, category } = req.query;
  
  // Build filter
  const filter = { userId: req.user.userId };
  
  if (isRead !== undefined) {
    filter.isRead = isRead === 'true';
  }
  if (type) filter.type = type;
  if (category) filter.category = category;

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Notification.countDocuments(filter);
  const unreadCount = await Notification.countDocuments({ 
    userId: req.user.userId, 
    isRead: false 
  });

  res.json({
    success: true,
    data: {
      notifications,
      unreadCount,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    userId: req.user.userId
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  await notification.markAsRead();

  res.json({
    success: true,
    message: 'Notification marked as read',
    data: { notification }
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { userId: req.user.userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  res.json({
    success: true,
    message: `${result.modifiedCount} notifications marked as read`
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.userId
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

// @desc    Get notification summary
// @route   GET /api/notifications/summary
// @access  Private
const getNotificationSummary = asyncHandler(async (req, res) => {
  const summary = await Notification.aggregate([
    { $match: { userId: req.user.userId } },
    {
      $group: {
        _id: '$category',
        total: { $sum: 1 },
        unread: {
          $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
        }
      }
    }
  ]);

  const totalUnread = await Notification.countDocuments({
    userId: req.user.userId,
    isRead: false
  });

  res.json({
    success: true,
    data: {
      totalUnread,
      byCategory: summary
    }
  });
});

// Routes
router.get('/', validatePagination, getNotifications);
router.get('/summary', getNotificationSummary);
router.put('/:id/read', validateObjectId(), markAsRead);
router.put('/mark-all-read', markAllAsRead);
router.delete('/:id', validateObjectId(), deleteNotification);

module.exports = router;
