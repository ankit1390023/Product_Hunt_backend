import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true,
        lowercase: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    icon: {
        type: String,
        default: 'default-category-icon.png'
    },
    color: {
        type: String,
        default: '#000000'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    subCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    productCount: {
        type: Number,
        default: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Create slug from name before saving
categorySchema.pre('save', function (next) {
    if (this.isModified('name')) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]/g, '-')
            .replace(/-+/g, '-');
    }
    next();
});

// Method to get all subcategories recursively
categorySchema.methods.getAllSubCategories = async function () {
    const subCategories = await this.model('Category')
        .find({ parentCategory: this._id })
        .populate('subCategories');

    return subCategories;
};

// Static method to get category tree
categorySchema.statics.getCategoryTree = async function () {
    const categories = await this.find({ parentCategory: null })
        .populate({
            path: 'subCategories',
            populate: {
                path: 'subCategories'
            }
        });

    return categories;
};

// Method to update product count
categorySchema.methods.updateProductCount = async function () {
    const count = await mongoose.model('Product').countDocuments({ category: this._id });
    this.productCount = count;
    await this.save();
    return this;
};

export const Category = mongoose.model('Category', categorySchema); 