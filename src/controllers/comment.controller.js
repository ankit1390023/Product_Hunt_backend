import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiError } from "../utils/apiError.utils.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";
import { Comment } from "../models/comment.model.js";
import { Product } from "../models/product.model.js";

// Create a new comment
const createComment = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { content, parentCommentId } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    // Create comment
    const comment = await Comment.create({
        content,
        product: productId,
        author: req.user._id,
        parentComment: parentCommentId || null
    });

    // If it's a reply, add it to parent comment's replies
    if (parentCommentId) {
        await Comment.findByIdAndUpdate(parentCommentId, {
            $push: { replies: comment._id }
        });
    }

    // Add comment to product
    await Product.findByIdAndUpdate(productId, {
        $push: { comments: comment._id },
        $inc: { commentCount: 1 }
    });

    // Update user's activity
    await req.user.updateOne({
        $inc: { 'activity.totalComments': 1 }
    });

    // Populate author details
    await comment.populate('author', 'username profile.displayName profile.headline');

    return res.status(201).json(
        new ApiResponse(201, comment, "Comment created successfully")
    );
});

// Get comments for a product
const getProductComments = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    // Get top-level comments (not replies)
    const comments = await Comment.find({
        product: productId,
        parentComment: null,
        isHidden: false
    })
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .populate('author', 'username profile.displayName profile.headline')
        .populate({
            path: 'replies',
            populate: {
                path: 'author',
                select: 'username profile.displayName profile.headline'
            }
        });

    // Get total count for pagination
    const total = await Comment.countDocuments({
        product: productId,
        parentComment: null,
        isHidden: false
    });

    return res.status(200).json(
        new ApiResponse(200, {
            comments,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "Comments fetched successfully")
    );
});

// Update a comment
const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment");
    }

    // Update comment
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content,
                isEdited: true,
                lastEditedAt: new Date()
            }
        },
        { new: true }
    ).populate('author', 'username profile.displayName profile.headline');

    return res.status(200).json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
    );
});

// Delete a comment
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if user is the author or an admin
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, "You are not authorized to delete this comment");
    }

    // If it's a top-level comment, remove it from product
    if (!comment.parentComment) {
        await Product.findByIdAndUpdate(comment.product, {
            $pull: { comments: commentId },
            $inc: { commentCount: -1 }
        });
    } else {
        // If it's a reply, remove it from parent comment
        await Comment.findByIdAndUpdate(comment.parentComment, {
            $pull: { replies: commentId }
        });
    }

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    // Update user's activity
    await req.user.updateOne({
        $inc: { 'activity.totalComments': -1 }
    });

    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    );
});

// Like a comment
const likeComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if user has already liked
    if (comment.likes.includes(req.user._id)) {
        throw new ApiError(400, "You have already liked this comment");
    }

    // Add like
    await comment.addLike(req.user._id);

    return res.status(200).json(
        new ApiResponse(200, comment, "Comment liked successfully")
    );
});

// Remove like from a comment
const removeLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if user has liked
    if (!comment.likes.includes(req.user._id)) {
        throw new ApiError(400, "You haven't liked this comment");
    }

    // Remove like
    await comment.removeLike(req.user._id);

    return res.status(200).json(
        new ApiResponse(200, comment, "Like removed successfully")
    );
});

// Hide a comment (admin only)
const hideComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
        throw new ApiError(403, "Only admins can hide comments");
    }

    // Hide comment
    comment.isHidden = true;
    await comment.save();

    return res.status(200).json(
        new ApiResponse(200, comment, "Comment hidden successfully")
    );
});

export {
    createComment,
    getProductComments as getComments,
    updateComment,
    deleteComment,
    likeComment,
    removeLike as unlikeComment,
    hideComment
}; 