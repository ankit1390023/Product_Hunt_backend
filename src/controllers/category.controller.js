import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiError } from "../utils/apiError.utils.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import mongoose from "mongoose";

// Create a new category
const createCategory = asyncHandler(async (req, res) => {
    const { name, description, icon, color, parentCategory } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ name: name.toLowerCase() });
    if (existingCategory) {
        throw new ApiError(409, "Category with this name already exists");
    }

    // Create new category
    const category = await Category.create({
        name,
        description,
        icon,
        color,
        parentCategory
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                category,
                "Category created successfully"
            )
        );
});

// Get all categories
const getAllCategories = asyncHandler(async (req, res) => {
    const { includeStats } = req.query;

    let categories;
    if (includeStats === "true") {
        categories = await Category.aggregate([
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "category",
                    as: "products"
                }
            },
            {
                $addFields: {
                    totalProducts: { $size: "$products" },
                    totalUpvotes: {
                        $reduce: {
                            input: "$products",
                            initialValue: 0,
                            in: { $add: ["$$value", { $size: "$$this.upvotes" }] }
                        }
                    },
                    totalViews: {
                        $reduce: {
                            input: "$products",
                            initialValue: 0,
                            in: { $add: ["$$value", "$$this.views"] }
                        }
                    }
                }
            },
            {
                $project: {
                    products: 0
                }
            }
        ]);
    } else {
        categories = await Category.find();
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                categories,
                "Categories retrieved successfully"
            )
        );
});

// Get category by ID
const getCategoryById = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    // Get category statistics
    const stats = await Category.aggregate([
        {
            $match: { _id: category._id }
        },
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "category",
                as: "products"
            }
        },
        {
            $addFields: {
                totalProducts: { $size: "$products" },
                totalUpvotes: {
                    $reduce: {
                        input: "$products",
                        initialValue: 0,
                        in: { $add: ["$$value", { $size: "$$this.upvotes" }] }
                    }
                },
                totalViews: {
                    $reduce: {
                        input: "$products",
                        initialValue: 0,
                        in: { $add: ["$$value", "$$this.views"] }
                    }
                }
            }
        },
        {
            $project: {
                products: 0
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { ...category.toObject(), ...stats[0] },
                "Category retrieved successfully"
            )
        );
});

// Update category
const updateCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { name, description, icon, color, isActive, featured, order } = req.body;

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    // Check if new name conflicts with existing category
    if (name && name.toLowerCase() !== category.name.toLowerCase()) {
        const existingCategory = await Category.findOne({ name: name.toLowerCase() });
        if (existingCategory) {
            throw new ApiError(409, "Category with this name already exists");
        }
    }

    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
        categoryId,
        {
            name,
            description,
            icon,
            color,
            isActive,
            featured,
            order
        },
        { new: true }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedCategory,
                "Category updated successfully"
            )
        );
});

// Delete category
const deleteCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    // Check if category has products
    const productCount = await mongoose.model('Product').countDocuments({ category: categoryId });
    if (productCount > 0) {
        throw new ApiError(400, "Cannot delete category with associated products");
    }

    // Delete category
    await Category.findByIdAndDelete(categoryId);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Category deleted successfully"
            )
        );
});

// Get trending categories
const getTrendingCategories = asyncHandler(async (req, res) => {
    const categories = await Category.aggregate([
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "category",
                as: "products"
            }
        },
        {
            $addFields: {
                totalUpvotes: {
                    $reduce: {
                        input: "$products",
                        initialValue: 0,
                        in: { $add: ["$$value", { $size: "$$this.upvotes" }] }
                    }
                },
                totalViews: {
                    $reduce: {
                        input: "$products",
                        initialValue: 0,
                        in: { $add: ["$$value", "$$this.views"] }
                    }
                }
            }
        },
        {
            $project: {
                products: 0
            }
        },
        {
            $sort: {
                totalUpvotes: -1,
                totalViews: -1
            }
        },
        {
            $limit: 10
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                categories,
                "Trending categories retrieved successfully"
            )
        );
});

export {
    createCategory,
    getAllCategories,
    getAllCategories as getCategories,
    getCategoryById,
    getCategoryById as getCategory,
    updateCategory,
    deleteCategory,
    getTrendingCategories
}; 