import { Router } from "express";
import authRoutes from "./auth.route.js";
import userRoutes from "./user.route.js";
import productRoutes from "./product.route.js";
import categoryRoutes from "./category.route.js";
import commentRoutes from "./comment.route.js";
import notificationRoutes from "./notification.route.js";
import searchRoutes from "./search.route.js";
import analyticsRoutes from "./analytics.route.js";

const router = Router();

// API Version 1
const v1Router = Router();

// Auth routes
v1Router.use("/auth", authRoutes);

// User routes
v1Router.use("/users", userRoutes);

// Product routes
v1Router.use("/products", productRoutes);

// Category routes
v1Router.use("/categories", categoryRoutes);

// Comment routes
v1Router.use("/comments", commentRoutes);

// Notification routes
v1Router.use("/notifications", notificationRoutes);

// Search routes
v1Router.use("/search", searchRoutes);

// Analytics routes
v1Router.use("/analytics", analyticsRoutes);

// Mount v1 routes
router.use("/api/v1", v1Router);

// Health check route
router.get("/health", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Server is healthy",
        timestamp: new Date().toISOString()
    });
});

export default router; 