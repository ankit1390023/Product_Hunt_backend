import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiError } from "../utils/apiError.utils.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { Category } from "../models/category.model.js";

// Get product analytics
const getProductAnalytics = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { timeRange = '7d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (timeRange) {
        case '24h':
            startDate.setHours(startDate.getHours() - 24);
            break;
        case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
        case '90d':
            startDate.setDate(startDate.getDate() - 90);
            break;
        default:
            startDate.setDate(startDate.getDate() - 7);
    }

    // Get product details
    const product = await Product.findById(productId)
        .populate('submittedBy', 'username profile.displayName')
        .populate('category', 'name');

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    // Get engagement metrics
    const engagementMetrics = await Product.aggregate([
        { $match: { _id: product._id } },
        {
            $lookup: {
                from: 'comments',
                localField: '_id',
                foreignField: 'product',
                as: 'comments'
            }
        },
        {
            $project: {
                totalViews: '$views',
                totalUpvotes: '$upvoteCount',
                totalComments: { $size: '$comments' },
                averageRating: { $avg: '$comments.rating' }
            }
        }
    ]);

    // Get time-based analytics
    const timeBasedAnalytics = await Product.aggregate([
        { $match: { _id: product._id } },
        {
            $lookup: {
                from: 'comments',
                localField: '_id',
                foreignField: 'product',
                pipeline: [
                    {
                        $match: {
                            createdAt: { $gte: startDate, $lte: endDate }
                        }
                    }
                ],
                as: 'recentComments'
            }
        },
        {
            $project: {
                viewsOverTime: {
                    $map: {
                        input: { $range: [0, { $subtract: [{ $divide: [{ $subtract: [endDate, startDate] }, 86400000] }, 1] }] },
                        as: 'day',
                        in: {
                            date: { $add: [startDate, { $multiply: ['$$day', 86400000] }] },
                            views: { $size: { $filter: { input: '$views', as: 'view', cond: { $gte: ['$$view', { $add: [startDate, { $multiply: ['$$day', 86400000] }] }] } } } }
                        }
                    }
                },
                commentsOverTime: {
                    $map: {
                        input: { $range: [0, { $subtract: [{ $divide: [{ $subtract: [endDate, startDate] }, 86400000] }, 1] }] },
                        as: 'day',
                        in: {
                            date: { $add: [startDate, { $multiply: ['$$day', 86400000] }] },
                            count: { $size: { $filter: { input: '$recentComments', as: 'comment', cond: { $gte: ['$$comment.createdAt', { $add: [startDate, { $multiply: ['$$day', 86400000] }] }] } } } }
                        }
                    }
                }
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            product: {
                _id: product._id,
                name: product.name,
                submittedBy: product.submittedBy,
                category: product.category
            },
            metrics: engagementMetrics[0],
            timeBasedAnalytics: timeBasedAnalytics[0]
        }, "Product analytics fetched successfully")
    );
});

// Get user analytics
const getUserAnalytics = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (timeRange) {
        case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
        case '90d':
            startDate.setDate(startDate.getDate() - 90);
            break;
        default:
            startDate.setDate(startDate.getDate() - 30);
    }

    // Get user details
    const user = await User.findById(userId)
        .select('-password -refreshToken');

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Get user activity metrics
    const activityMetrics = await User.aggregate([
        { $match: { _id: user._id } },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: 'submittedBy',
                as: 'submittedProducts'
            }
        },
        {
            $lookup: {
                from: 'comments',
                localField: '_id',
                foreignField: 'author',
                as: 'comments'
            }
        },
        {
            $project: {
                totalProducts: { $size: '$submittedProducts' },
                totalComments: { $size: '$comments' },
                totalUpvotes: '$activity.totalUpvotes',
                averageProductRating: { $avg: '$submittedProducts.rating' }
            }
        }
    ]);

    // Get time-based activity
    const timeBasedActivity = await User.aggregate([
        { $match: { _id: user._id } },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: 'submittedBy',
                pipeline: [
                    {
                        $match: {
                            createdAt: { $gte: startDate, $lte: endDate }
                        }
                    }
                ],
                as: 'recentProducts'
            }
        },
        {
            $lookup: {
                from: 'comments',
                localField: '_id',
                foreignField: 'author',
                pipeline: [
                    {
                        $match: {
                            createdAt: { $gte: startDate, $lte: endDate }
                        }
                    }
                ],
                as: 'recentComments'
            }
        },
        {
            $project: {
                productsOverTime: {
                    $map: {
                        input: { $range: [0, { $subtract: [{ $divide: [{ $subtract: [endDate, startDate] }, 86400000] }, 1] }] },
                        as: 'day',
                        in: {
                            date: { $add: [startDate, { $multiply: ['$$day', 86400000] }] },
                            count: { $size: { $filter: { input: '$recentProducts', as: 'product', cond: { $gte: ['$$product.createdAt', { $add: [startDate, { $multiply: ['$$day', 86400000] }] }] } } } }
                        }
                    }
                },
                commentsOverTime: {
                    $map: {
                        input: { $range: [0, { $subtract: [{ $divide: [{ $subtract: [endDate, startDate] }, 86400000] }, 1] }] },
                        as: 'day',
                        in: {
                            date: { $add: [startDate, { $multiply: ['$$day', 86400000] }] },
                            count: { $size: { $filter: { input: '$recentComments', as: 'comment', cond: { $gte: ['$$comment.createdAt', { $add: [startDate, { $multiply: ['$$day', 86400000] }] }] } } } }
                        }
                    }
                }
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            user: {
                _id: user._id,
                username: user.username,
                profile: user.profile
            },
            metrics: activityMetrics[0],
            timeBasedActivity: timeBasedActivity[0]
        }, "User analytics fetched successfully")
    );
});

// Get platform analytics (admin only)
const getPlatformAnalytics = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
        throw new ApiError(403, "Only admins can access platform analytics");
    }

    // Get overall platform metrics
    const platformMetrics = await Promise.all([
        Product.countDocuments(),
        User.countDocuments(),
        Comment.countDocuments(),
        Category.countDocuments()
    ]);

    // Get engagement metrics
    const engagementMetrics = await Product.aggregate([
        {
            $group: {
                _id: null,
                totalViews: { $sum: '$views' },
                totalUpvotes: { $sum: '$upvoteCount' },
                averageViews: { $avg: '$views' },
                averageUpvotes: { $avg: '$upvoteCount' }
            }
        }
    ]);

    // Get category performance
    const categoryPerformance = await Product.aggregate([
        {
            $group: {
                _id: '$category',
                totalProducts: { $sum: 1 },
                totalViews: { $sum: '$views' },
                totalUpvotes: { $sum: '$upvoteCount' }
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: '_id',
                foreignField: '_id',
                as: 'category'
            }
        },
        { $unwind: '$category' },
        {
            $project: {
                category: {
                    _id: '$category._id',
                    name: '$category.name',
                    icon: '$category.icon'
                },
                metrics: {
                    totalProducts: '$totalProducts',
                    totalViews: '$totalViews',
                    totalUpvotes: '$totalUpvotes',
                    averageViews: { $divide: ['$totalViews', '$totalProducts'] },
                    averageUpvotes: { $divide: ['$totalUpvotes', '$totalProducts'] }
                }
            }
        },
        { $sort: { 'metrics.totalUpvotes': -1 } }
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            platformMetrics: {
                totalProducts: platformMetrics[0],
                totalUsers: platformMetrics[1],
                totalComments: platformMetrics[2],
                totalCategories: platformMetrics[3]
            },
            engagementMetrics: engagementMetrics[0],
            categoryPerformance
        }, "Platform analytics fetched successfully")
    );
});

export {
    getProductAnalytics,
    getUserAnalytics,
    getPlatformAnalytics
}; 