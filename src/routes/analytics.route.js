import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getProductAnalytics,
    getUserAnalytics,
    getPlatformAnalytics
} from "../controllers/analytics.controller.js";

const router = Router();

// Protected routes
router.use(verifyJWT);

// Product analytics
router.get("/products/:productId", getProductAnalytics);

// User analytics
router.get("/users/:userId", getUserAnalytics);

// Platform analytics (admin only)
router.get("/platform", getPlatformAnalytics);

export default router; 