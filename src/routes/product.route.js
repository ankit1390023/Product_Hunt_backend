import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createProduct,
    getProduct,
    updateProduct,
    deleteProduct,
    listProducts,
    upvoteProduct,
    removeUpvote,
    getTrendingProducts
} from "../controllers/product.controller.js";

const router = Router();

// Public routes
router.get("/", listProducts);
router.get("/trending", getTrendingProducts);
router.get("/:productId", getProduct);

// Protected routes
router.use(verifyJWT);

// Product management
router.post("/", upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "images", maxCount: 5 }
]), createProduct);

router.patch("/:productId", upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "images", maxCount: 5 }
]), updateProduct);

router.delete("/:productId", deleteProduct);

// Product engagement
router.post("/:productId/upvote", upvoteProduct);
router.delete("/:productId/upvote", removeUpvote);

export default router; 