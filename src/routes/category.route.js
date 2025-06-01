import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createCategory,
    getCategories,
    getCategory,
    updateCategory,
    deleteCategory
} from "../controllers/category.controller.js";

const router = Router();

// Public routes
router.get("/", getCategories);
router.get("/:categoryId", getCategory);

// Protected routes
router.use(verifyJWT);
router.post("/", createCategory);
router.patch("/:categoryId", updateCategory);
router.delete("/:categoryId", deleteCategory);

export default router; 