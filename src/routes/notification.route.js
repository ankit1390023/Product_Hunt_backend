import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createNotification,
    getUserNotifications,
    markNotificationsAsRead,
    deleteNotifications,
    updateNotificationPreferences,
    getNotificationPreferences
} from "../controllers/notification.controller.js";

const router = Router();

// All routes below require authentication
router.use(verifyJWT);

// Get all notifications for the logged-in user
router.get("/", getUserNotifications);

// Create a notification (could be admin or system use)
router.post("/", createNotification);

// Mark notifications as read
router.patch("/read", markNotificationsAsRead);

// Delete notifications
router.delete("/", deleteNotifications);

// Get and update notification preferences
router.get("/preferences", getNotificationPreferences);
router.patch("/preferences", updateNotificationPreferences);

export default router; 