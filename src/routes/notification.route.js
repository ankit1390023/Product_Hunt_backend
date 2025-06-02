import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Get all notifications for the current user
router.get('/', verifyJWT, async (req, res) => {
    try {
        const notifications = await req.user.populate('notifications');
        res.json(notifications.notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mark a notification as read
router.patch('/:id/read', verifyJWT, async (req, res) => {
    try {
        const notification = await req.user.notifications.id(req.params.id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        notification.read = true;
        await req.user.save();
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mark all notifications as read
router.patch('/read-all', verifyJWT, async (req, res) => {
    try {
        req.user.notifications.forEach(notification => {
            notification.read = true;
        });
        await req.user.save();
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete a notification
router.delete('/:id', verifyJWT, async (req, res) => {
    try {
        req.user.notifications.pull(req.params.id);
        await req.user.save();
        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router; 