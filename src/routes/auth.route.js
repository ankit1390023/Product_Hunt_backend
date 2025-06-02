import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    register,
    login,
    logout,
    refreshAccessToken,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail
} from "../controllers/user.controller.js";

const router = Router();

// Public routes
router.post("/register", upload.single('avatar'), register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

// Protected routes
router.use(verifyJWT);
router.post("/logout", logout);
router.post("/refresh-token", refreshAccessToken);

export default router; 