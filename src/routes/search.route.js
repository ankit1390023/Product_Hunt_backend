import { Router } from "express";
import {
    searchProducts,
    searchUsers,
    searchComments,
    getSearchSuggestions
} from "../controllers/search.controller.js";

const router = Router();

// Public routes
router.get("/products", searchProducts);
router.get("/users", searchUsers);
router.get("/comments", searchComments);
router.get("/suggestions", getSearchSuggestions);

export default router; 