import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiError } from "../utils/apiError.utils.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";
import { Notification } from "../models/notification.model.js";
import { User } from "../models/user.model.js";
import { emitNotification } from "../config/socket.js";

// Create a new notification
const createNotification = asyncHandler(async (req, res) => {
    const { recipientId, type, content, relatedId } = req.body;

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
        throw new ApiError(404, "Recipient not found");
    }

    // Create notification
    const notification = await Notification.create({
        recipient: recipientId,
        type,
        content,
        relatedId,
        createdBy: req.user._id
    });

    // Update user's unread notifications count
    await User.findByIdAndUpdate(recipientId, {
        $inc: { "notifications.unreadCount": 1 }
    });

    // Emit real-time notification
    emitNotification(req.app.get("io"), recipientId, notification);

    return res.status(201).json(
        new ApiResponse(201, notification, "Notification created successfully")
    );
});

// Get user's notifications
const getUserNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { recipient: req.user._id };
    if (type) {
        query.type = type;
    }

    // Get notifications
    const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("createdBy", "username profile.displayName profile.avatar");

    // Get total count
    const total = await Notification.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(200, {
            notifications,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        }, "Notifications fetched successfully")
    );
});

// Mark notifications as read
const markNotificationsAsRead = asyncHandler(async (req, res) => {
    const { notificationIds } = req.body;

    // Update notifications
    await Notification.updateMany(
        {
            _id: { $in: notificationIds },
            recipient: req.user._id
        },
        { $set: { read: true } }
    );

    // Update user's unread count
    const unreadCount = await Notification.countDocuments({
        recipient: req.user._id,
        read: false
    });

    await User.findByIdAndUpdate(req.user._id, {
        "notifications.unreadCount": unreadCount
    });

    // Emit real-time update
    emitNotification(req.app.get("io"), req.user._id, {
        type: "read",
        unreadCount
    });

    return res.status(200).json(
        new ApiResponse(200, { unreadCount }, "Notifications marked as read")
    );
});

// Delete notifications
const deleteNotifications = asyncHandler(async (req, res) => {
    const { notificationIds } = req.body;

    // Delete notifications
    await Notification.deleteMany({
        _id: { $in: notificationIds },
        recipient: req.user._id
    });

    // Update user's unread count
    const unreadCount = await Notification.countDocuments({
        recipient: req.user._id,
        read: false
    });

    await User.findByIdAndUpdate(req.user._id, {
        "notifications.unreadCount": unreadCount
    });

    // Emit real-time update
    emitNotification(req.app.get("io"), req.user._id, {
        type: "delete",
        unreadCount
    });

    return res.status(200).json(
        new ApiResponse(200, { unreadCount }, "Notifications deleted successfully")
    );
});

// Update notification preferences
const updateNotificationPreferences = asyncHandler(async (req, res) => {
    const { preferences } = req.body;

    // Update user's notification preferences
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { "notifications.preferences": preferences },
        { new: true }
    ).select("notifications.preferences");

    // Emit real-time update
    emitNotification(req.app.get("io"), req.user._id, {
        type: "preferences",
        preferences: user.notifications.preferences
    });

    return res.status(200).json(
        new ApiResponse(200, user.notifications.preferences, "Notification preferences updated")
    );
});

// Get notification preferences
const getNotificationPreferences = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .select("notifications.preferences");

    return res.status(200).json(
        new ApiResponse(200, user.notifications.preferences, "Notification preferences fetched")
    );
});

export {
    createNotification,
    getUserNotifications,
    markNotificationsAsRead,
    deleteNotifications,
    updateNotificationPreferences,
    getNotificationPreferences
}; 