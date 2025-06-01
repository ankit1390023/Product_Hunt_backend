import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createComment,
    getComments,
    updateComment,
    deleteComment,
    likeComment,
    unlikeComment
} from "../controllers/comment.controller.js";

const router = Router();

// Public routes
router.get("/product/:productId", getComments);

// Protected routes
router.use(verifyJWT);

// Comment management
router.post("/product/:productId", createComment);
router.patch("/:commentId", updateComment);
router.delete("/:commentId", deleteComment);

// Comment engagement
router.post("/:commentId/like", likeComment);
router.delete("/:commentId/like", unlikeComment);

export default router; 