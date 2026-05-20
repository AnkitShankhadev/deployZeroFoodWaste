const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');
const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = require('../config/env');

/**
 * Create email transporter (optional - only if email credentials are provided)
 */
let transporter = null;
if (EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: false,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
}

/**
 * Create a notification
 * @param {string} userId - User ID
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 * @param {string} relatedId - Related entity ID (optional)
 * @param {object} metadata - Additional metadata (optional)
 * @returns {Promise<Object>} Notification object
 */
const createNotification = async (userId, message, type, relatedId = null, metadata = {}) => {
  try {
    const notification = await Notification.create({
      userId,
      message,
      type,
      relatedId,
      metadata,
    });

    // Optionally send email notification
    if (transporter) {
      await sendEmailNotification(userId, message, type).catch((err) => {
        console.error('Email notification failed:', err.message);
      });
    }

    // Emit real-time notification via socket.io
    try {
      const socket = require('../socket');
      socket.getIO().to(userId.toString()).emit('notification', notification);
    } catch (err) {
      console.error('Socket notification failed:', err.message);
    }

    return notification;
  } catch (error) {
    throw new Error(`Error creating notification: ${error.message}`);
  }
};

/**
 * Send email notification (optional)
 * @param {string} userId - User ID
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 * @returns {Promise<void>}
 */
const sendEmailNotification = async (userId, message, type) => {
  if (!transporter) {
    return;
  }

  try {
    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user || !user.email) {
      return;
    }

    const mailOptions = {
      from: EMAIL_USER,
      to: user.email,
      subject: `ZeroFoodWaste: ${type.replace(/_/g, ' ')}`,
      text: message,
      html: `<p>${message}</p>`,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error(`Error sending email: ${error.message}`);
  }
};

/**
 * Get notifications for a user
 * @param {string} userId - User ID
 * @param {boolean} unreadOnly - Get only unread notifications
 * @param {number} limit - Limit number of results
 * @returns {Promise<Array>} Array of notifications
 */
const getUserNotifications = async (userId, unreadOnly = false, limit = 50) => {
  try {
    const query = { userId };
    if (unreadOnly) {
      query.readStatus = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    return notifications;
  } catch (error) {
    throw new Error(`Error getting notifications: ${error.message}`);
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for security)
 * @returns {Promise<Object>} Updated notification
 */
const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { readStatus: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification;
  } catch (error) {
    throw new Error(`Error marking notification as read: ${error.message}`);
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Update result
 */
const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { userId, readStatus: false },
      { readStatus: true, readAt: new Date() }
    );

    return result;
  } catch (error) {
    throw new Error(`Error marking all notifications as read: ${error.message}`);
  }
};

/**
 * Delete notification
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for security)
 * @returns {Promise<void>}
 */
const deleteNotification = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      throw new Error('Notification not found');
    }
  } catch (error) {
    throw new Error(`Error deleting notification: ${error.message}`);
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendEmailNotification,
};

