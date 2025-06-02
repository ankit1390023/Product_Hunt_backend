import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiError } from "../utils/apiError.utils.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";

// Search products
const searchProducts = asyncHandler(async (req, res) => {
    const {
        query,
        category,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10,
        status = 'active',
        minUpvotes,
        minViews,
        dateRange
    } = req.query;

    // Build search query
    const searchQuery = {};

    // Text search
    if (query) {
        searchQuery.$or = [
            { name: { $regex: query, $options: 'i' } },
            { tagline: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ];
    }

    // Category filter
    if (category) {
        searchQuery.category = category;
    }

    // Status filter
    if (status) {
        searchQuery.status = status;
    }

    // Engagement filters
    if (minUpvotes) {
        searchQuery.upvoteCount = { $gte: parseInt(minUpvotes) };
    }
    if (minViews) {
        searchQuery.views = { $gte: parseInt(minViews) };
    }

    // Date range filter
    if (dateRange) {
        const [startDate, endDate] = dateRange.split(',');
        searchQuery.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get products with pagination and sorting
    const products = await Product.find(searchQuery)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('submittedBy', 'username profile.displayName');

    // Get total count for pagination
    const total = await Product.countDocuments(searchQuery);

    return res.status(200).json(
        new ApiResponse(200, {
            products,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "Products fetched successfully")
    );
});

// Search users
const searchUsers = asyncHandler(async (req, res) => {
    const {
        query,
        role,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10,
        hasProducts,
        minUpvotes
    } = req.query;

    // Build search query
    const searchQuery = {};

    // Text search
    if (query) {
        searchQuery.$or = [
            { username: { $regex: query, $options: 'i' } },
            { 'profile.displayName': { $regex: query, $options: 'i' } },
            { 'profile.headline': { $regex: query, $options: 'i' } }
        ];
    }

    // Role filter
    if (role) {
        searchQuery.role = role;
    }

    // Engagement filters
    if (hasProducts === 'true') {
        searchQuery['activity.totalProducts'] = { $gt: 0 };
    }
    if (minUpvotes) {
        searchQuery['activity.totalUpvotes'] = { $gte: parseInt(minUpvotes) };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute search
    const users = await User.find(searchQuery)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-password -refreshToken');

    // Get total count
    const total = await User.countDocuments(searchQuery);

    return res.status(200).json(
        new ApiResponse(200, {
            users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "Users search completed successfully")
    );
});

// Search comments
const searchComments = asyncHandler(async (req, res) => {
    const {
        query,
        productId,
        authorId,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10,
        minLikes
    } = req.query;

    // Build search query
    const searchQuery = { isHidden: false };

    // Text search
    if (query) {
        searchQuery.content = { $regex: query, $options: 'i' };
    }

    // Filters
    if (productId) {
        searchQuery.product = productId;
    }
    if (authorId) {
        searchQuery.author = authorId;
    }
    if (minLikes) {
        searchQuery.likes = { $size: { $gte: parseInt(minLikes) } };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute search
    const comments = await Comment.find(searchQuery)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('author', 'username profile.displayName profile.headline')
        .populate('product', 'name slug');

    // Get total count
    const total = await Comment.countDocuments(searchQuery);

    return res.status(200).json(
        new ApiResponse(200, {
            comments,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "Comments search completed successfully")
    );
});

// Get search suggestions
const getSearchSuggestions = asyncHandler(async (req, res) => {
    const { query, type = 'all' } = req.query;

    if (!query || query.length < 2) {
        return res.status(200).json(
            new ApiResponse(200, [], "No suggestions available")
        );
    }

    const suggestions = [];

    // Product suggestions
    if (type === 'all' || type === 'products') {
        const productSuggestions = await Product.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { tagline: { $regex: query, $options: 'i' } }
            ]
        })
            .limit(5)
            .select('name tagline slug');

        suggestions.push(...productSuggestions.map(p => ({
            type: 'product',
            text: p.name,
            subtitle: p.tagline,
            slug: p.slug
        })));
    }

    // User suggestions
    if (type === 'all' || type === 'users') {
        const userSuggestions = await User.find({
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { 'profile.displayName': { $regex: query, $options: 'i' } }
            ]
        })
            .limit(5)
            .select('username profile.displayName');

        suggestions.push(...userSuggestions.map(u => ({
            type: 'user',
            text: u.profile.displayName || u.username,
            subtitle: `@${u.username}`,
            username: u.username
        })));
    }

    return res.status(200).json(
        new ApiResponse(200, suggestions, "Search suggestions fetched successfully")
    );
});

export {
    searchProducts,
    searchUsers,
    searchComments,
    getSearchSuggestions
}; 