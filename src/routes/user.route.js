import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    getUserProfile,
    updateUserProfile,
    deleteUserAccount,
    followUser,
    unfollowUser,
    getUserFollowers,
    getUserFollowing
} from "../controllers/user.controller.js";

const router = Router();

// Public routes
router.get("/:userId", getUserProfile);
router.get("/:userId/followers", getUserFollowers);
router.get("/:userId/following", getUserFollowing);

// Protected routes
router.use(verifyJWT);
router.patch("/profile", upload.single("avatar"), updateUserProfile);
router.delete("/", deleteUserAccount);
router.post("/:userId/follow", followUser);
router.delete("/:userId/follow", unfollowUser);

export default router;
