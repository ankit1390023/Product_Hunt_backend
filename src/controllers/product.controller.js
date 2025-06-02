import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiError } from "../utils/apiError.utils.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";
import { Product } from "../models/product.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.utils.js";
import fs from 'fs';

// Create a new product
const createProduct = asyncHandler(async (req, res) => {
    const {
        name,
        tagline,
        description,
        website,
        category,
        launchDate,
        twitter,
        github
    } = req.body;

    // Validate required fields
    if (!name || !tagline || !description || !website || !category) {
        throw new ApiError(400, "All required fields must be provided");
    }

    // Handle logo and images upload
    const logoLocalPath = req.files?.logo?.[0]?.path;
    const imagesLocalPaths = req.files?.images?.map(file => file.path) || [];

    if (!logoLocalPath) {
        throw new ApiError(400, "Product logo is required");
    }

    try {
        // Upload logo to cloudinary
        const logo = await uploadOnCloudinary(logoLocalPath);
        if (!logo?.secure_url) {
            throw new ApiError(400, "Error uploading logo");
        }

        // Upload product images
        const images = [];
        for (const imagePath of imagesLocalPaths) {
            const image = await uploadOnCloudinary(imagePath);
            if (image?.secure_url) {
                images.push(image.secure_url);
            }
        }

        // Create product
        const product = await Product.create({
            name,
            tagline,
            description,
            website,
            logo: logo.secure_url,
            images,
            category,
            submittedBy: req.user._id,
            launchDate: launchDate || new Date(),
            twitter,
            github,
            status: 'draft' // Start as draft
        });

        // Update user's submitted products
        await req.user.updateOne({
            $push: { submittedProducts: product._id },
            $inc: { 'activity.totalProducts': 1 }
        });

        // Populate submitter details
        await product.populate('submittedBy', 'username profile.displayName profile.headline');

        return res.status(201).json(
            new ApiResponse(201, product, "Product created successfully")
        );
    } catch (error) {
        console.error('Error in createProduct:', error);
        throw new ApiError(500, error.message || "Error creating product");
    } finally {
        // Clean up temporary files
        if (logoLocalPath) {
            fs.unlink(logoLocalPath, (err) => {
                if (err) console.error('Error deleting logo temp file:', err);
            });
        }
        imagesLocalPaths.forEach(path => {
            fs.unlink(path, (err) => {
                if (err) console.error('Error deleting image temp file:', err);
            });
        });
    }
});

// Get product details
const getProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findById(productId)
        .populate('submittedBy', 'username profile.displayName profile.headline')
        .populate({
            path: 'comments',
            populate: {
                path: 'author',
                select: 'username profile.displayName profile.headline'
            }
        });

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    // Increment view count
    await product.incrementViews();

    return res.status(200).json(
        new ApiResponse(200, product, "Product details fetched successfully")
    );
});

// Update product
const updateProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const {
        name,
        tagline,
        description,
        website,
        category,
        launchDate
    } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    // Check if user is the submitter or an admin
    if (product.submittedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, "You are not authorized to update this product");
    }

    // Handle logo and images upload
    const logoLocalPath = req.files?.logo?.[0]?.path;
    const imagesLocalPaths = req.files?.images?.map(file => file.path) || [];

    let logoUrl = product.logo;
    if (logoLocalPath) {
        const logo = await uploadOnCloudinary(logoLocalPath);
        if (!logo?.secure_url) {
            throw new ApiError(400, "Error uploading logo");
        }
        logoUrl = logo.secure_url;
    }

    // Upload new product images
    const newImages = [];
    for (const imagePath of imagesLocalPaths) {
        const image = await uploadOnCloudinary(imagePath);
        if (image?.secure_url) {
            newImages.push(image.secure_url);
        }
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
            $set: {
                name: name || product.name,
                tagline: tagline || product.tagline,
                description: description || product.description,
                website: website || product.website,
                logo: logoUrl,
                category: category || product.category,
                launchDate: launchDate || product.launchDate,
                ...(newImages.length > 0 && { images: newImages })
            }
        },
        { new: true }
    ).populate('submittedBy', 'username profile.displayName')
        .populate('category', 'name slug');

    return res.status(200).json(
        new ApiResponse(200, updatedProduct, "Product updated successfully")
    );
});

// Delete product
const deleteProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    // Check if user is the submitter or an admin
    if (product.submittedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, "You are not authorized to delete this product");
    }

    // Delete product
    await Product.findByIdAndDelete(productId);

    // Update user's submitted products
    await req.user.updateOne({
        $pull: { submittedProducts: productId },
        $inc: { 'activity.totalProducts': -1 }
    });

    return res.status(200).json(
        new ApiResponse(200, {}, "Product deleted successfully")
    );
});

// List products with filtering and pagination
const listProducts = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        category,
        search,
        status
    } = req.query;

    const query = {};

    // Apply filters
    if (category) {
        query.category = category;
    }
    if (status) {
        query.status = status;
    }
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { tagline: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get products with pagination and sorting
    const products = await Product.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('submittedBy', 'username profile.displayName')
        .populate('category', 'name slug');

    // Get total count for pagination
    const total = await Product.countDocuments(query);

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

// Upvote a product
const upvoteProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    // Check if user has already upvoted
    if (product.upvotes.includes(req.user._id)) {
        throw new ApiError(400, "You have already upvoted this product");
    }

    // Add upvote
    await product.addUpvote(req.user._id);

    // Update user's activity
    await req.user.updateOne({
        $push: { upvotedProducts: productId },
        $inc: { 'activity.totalUpvotes': 1 }
    });

    return res.status(200).json(
        new ApiResponse(200, product, "Product upvoted successfully")
    );
});

// Remove upvote from a product
const removeUpvote = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    // Check if user has upvoted
    if (!product.upvotes.includes(req.user._id)) {
        throw new ApiError(400, "You haven't upvoted this product");
    }

    // Remove upvote
    await product.removeUpvote(req.user._id);

    // Update user's activity
    await req.user.updateOne({
        $pull: { upvotedProducts: productId },
        $inc: { 'activity.totalUpvotes': -1 }
    });

    return res.status(200).json(
        new ApiResponse(200, product, "Upvote removed successfully")
    );
});

// Get trending products
const getTrendingProducts = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const products = await Product.find({ status: 'active' })
        .sort({ upvoteCount: -1, views: -1 })
        .limit(parseInt(limit))
        .populate('submittedBy', 'username profile.displayName')
        .populate('category', 'name slug');

    return res.status(200).json(
        new ApiResponse(200, products, "Trending products fetched successfully")
    );
});

export {
    createProduct,
    getProduct,
    updateProduct,
    deleteProduct,
    listProducts,
    upvoteProduct,
    removeUpvote,
    getTrendingProducts
}; 