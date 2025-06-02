import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiError } from "../utils/apiError.utils.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.utils.js";
import { generateAccessAndRefreshTokens } from "../utils/token.utils.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../utils/email.utils.js";

// Authentication Controllers
const register = asyncHandler(async (req, res) => {
    console.log('Backend - Received registration request body:', req.body);
    console.log('Backend - Received file:', req.file);

    const { username, email, password, role = 'user' } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
        throw new ApiError(400, "All fields are required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format");
    }

    // Validate role
    const validRoles = ['user', 'admin', 'moderator'];
    if (!validRoles.includes(role)) {
        throw new ApiError(400, "Invalid role specified");
    }

    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existingUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    // Handle avatar upload if present
    let avatarUrl = null;
    if (req.file) {
        try {
            console.log('Backend - Uploading avatar to Cloudinary:', req.file);
            const avatar = await uploadOnCloudinary(req.file.path);
            console.log('Backend - Cloudinary upload response:', avatar);
            if (avatar) {
                avatarUrl = avatar.secure_url;
            }
        } catch (error) {
            console.error('Backend - Error uploading avatar:', error);
            throw new ApiError(500, "Error uploading avatar");
        }
    }

    // Create new user
    const user = await User.create({
        username: username.trim(),
        email: email.trim(),
        password,
        avatar: avatarUrl,
        role
    });

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // Get user without sensitive data
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    // Set refresh token in HTTP-only cookie
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 50 * 24 * 60 * 60 * 1000 // 50 days
    };

    return res
        .status(201)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                201,
                {
                    user: createdUser,
                    accessToken
                },
                "User registered successfully"
            )
        );
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // Get user without sensitive data
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // Set refresh token in HTTP-only cookie
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 50 * 24 * 60 * 60 * 1000 // 50 days
    };

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken
                },
                "User logged in successfully"
            )
        );
});

const logout = asyncHandler(async (req, res) => {
    // Clear refresh token from user document
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: 1 }
        },
        { new: true }
    );

    // Clear refresh token cookie
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    };

    return res
        .status(200)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decoded = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decoded._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 50 * 24 * 60 * 60 * 1000 // 50 days
        };

        return res
            .status(200)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken },
                    "Access token refreshed successfully"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
    user.resetPasswordExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail({
        email: user.email,
        subject: "Password Reset Request",
        message: `Click the following link to reset your password: ${resetUrl}`
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset email sent successfully"
            )
        );
});

const resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired reset token");
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset successful"
            )
        );
});

const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.body;

    const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: { $gt: Date.now() }
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired verification token");
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Email verified successfully"
            )
        );
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isEmailVerified) {
        throw new ApiError(400, "Email is already verified");
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");
    user.emailVerificationExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save({ validateBeforeSave: false });

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    await sendEmail({
        email: user.email,
        subject: "Email Verification",
        message: `Click the following link to verify your email: ${verificationUrl}`
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Verification email sent successfully"
            )
        );
});

// Profile Controllers
const getUserProfile = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId)
        .select("-password -refreshToken")
        .populate("submittedProducts", "name tagline logo upvoteCount views")
        .populate("upvotedProducts", "name tagline logo upvoteCount views");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(200, user, "User profile fetched successfully")
    );
});

const updateUserProfile = asyncHandler(async (req, res) => {
    const { displayName, headline, website, location, bio, socialLinks } = req.body;

    // Handle avatar upload
    let avatarUrl = req.user.avatar;
    if (req.file) {
        const avatar = await uploadOnCloudinary(req.file.path);
        if (!avatar?.secure_url) {
            throw new ApiError(400, "Error uploading avatar");
        }
        avatarUrl = avatar.secure_url;
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatarUrl,
                "profile.displayName": displayName,
                "profile.headline": headline,
                "profile.website": website,
                "profile.location": location,
                bio,
                "profile.socialLinks": socialLinks
            }
        },
        { new: true }
    ).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "Profile updated successfully")
    );
});

const deleteUserAccount = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    // Delete user's avatar from cloudinary if exists
    if (user.avatar && user.avatar !== "default-avatar.png") {
        const publicId = user.avatar.split("/").pop().split(".")[0];
        await deleteFromCloudinary(publicId);
    }

    // Delete user's products and upvotes
    await Promise.all([
        // Delete user's submitted products
        Product.deleteMany({ _id: { $in: user.submittedProducts } }),
        // Remove user's upvotes from products
        Product.updateMany(
            { _id: { $in: user.upvotedProducts } },
            {
                $pull: { upvotes: user._id },
                $inc: { upvoteCount: -1 }
            }
        )
    ]);

    // Delete user account
    await User.findByIdAndDelete(req.user._id);

    return res.status(200).json(
        new ApiResponse(200, {}, "Account deleted successfully")
    );
});

// Social Controllers
const followUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
        throw new ApiError(400, "You cannot follow yourself");
    }

    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
        throw new ApiError(404, "User not found");
    }

    // Check if already following
    if (req.user.following.includes(userId)) {
        throw new ApiError(400, "You are already following this user");
    }

    // Update both users
    await Promise.all([
        User.findByIdAndUpdate(req.user._id, {
            $push: { following: userId }
        }),
        User.findByIdAndUpdate(userId, {
            $push: { followers: req.user._id }
        })
    ]);

    return res.status(200).json(
        new ApiResponse(200, {}, "User followed successfully")
    );
});

const unfollowUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
        throw new ApiError(400, "You cannot unfollow yourself");
    }

    const userToUnfollow = await User.findById(userId);
    if (!userToUnfollow) {
        throw new ApiError(404, "User not found");
    }

    // Check if following
    if (!req.user.following.includes(userId)) {
        throw new ApiError(400, "You are not following this user");
    }

    // Update both users
    await Promise.all([
        User.findByIdAndUpdate(req.user._id, {
            $pull: { following: userId }
        }),
        User.findByIdAndUpdate(userId, {
            $pull: { followers: req.user._id }
        })
    ]);

    return res.status(200).json(
        new ApiResponse(200, {}, "User unfollowed successfully")
    );
});

const getUserFollowers = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const user = await User.findById(userId)
        .populate({
            path: "followers",
            select: "username profile.displayName profile.headline avatar",
            options: {
                skip: (parseInt(page) - 1) * parseInt(limit),
                limit: parseInt(limit)
            }
        });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const total = user.followers.length;

    return res.status(200).json(
        new ApiResponse(200, {
            followers: user.followers,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "Followers fetched successfully")
    );
});

const getUserFollowing = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const user = await User.findById(userId)
        .populate({
            path: "following",
            select: "username profile.displayName profile.headline avatar",
            options: {
                skip: (parseInt(page) - 1) * parseInt(limit),
                limit: parseInt(limit)
            }
        });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const total = user.following.length;

    return res.status(200).json(
        new ApiResponse(200, {
            following: user.following,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "Following fetched successfully")
    );
});

export {
    // Authentication exports
    register,
    login,
    logout,
    refreshAccessToken,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,

    // Profile exports
    getUserProfile,
    updateUserProfile,
    deleteUserAccount,

    // Social exports
    followUser,
    unfollowUser,
    getUserFollowers,
    getUserFollowing
}; 