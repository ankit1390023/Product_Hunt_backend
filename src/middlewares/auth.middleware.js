import { User } from "../models/user.model.js";
import jwt from 'jsonwebtoken';
import { ApiError } from "../utils/apiError.utils.js";
import { asyncHandler } from "../utils/asyncHandler.utils.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    // Extract token from cookies or Authorization header
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.accessToken;

    if (!token) {
        throw new ApiError(401, "Unauthorized: No token provided");
    }

    let decodedToken;
    try {
        // Verify the token
        decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, "Unauthorized: Invalid token");
    }

    // Find user by ID in the decoded token
    const user = await User.findById(decodedToken._id).select('-password -refreshToken');
    if (!user) {
        throw new ApiError(401, "Unauthorized: User not found");
    }

    // Attach the user to the request object
    req.user = user;
    next();
});

