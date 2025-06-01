import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [100, 'Product name cannot be more than 100 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    tagline: {
        type: String,
        required: [true, 'Tagline is required'],
        trim: true,
        maxlength: [200, 'Tagline cannot be more than 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    website: {
        type: String,
        required: [true, 'Website URL is required'],
        trim: true,
        match: [/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/, 'Please enter a valid URL']
    },
    logo: {
        type: String,
        required: [true, 'Logo is required']
    },
    images: [{
        type: String
    }],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    upvoteCount: {
        type: Number,
        default: 0
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    featured: {
        type: Boolean,
        default: false
    },
    views: {
        type: Number,
        default: 0
    },
    launchDate: {
        type: Date,
        default: Date.now
    },
    twitter: {
        type: String,
        trim: true
    },
    github: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Create slug from name before saving
productSchema.pre('save', function (next) {
    if (this.isModified('name')) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]/g, '-')
            .replace(/-+/g, '-');
    }
    next();
});

// Index for better search performance
productSchema.index({ name: 'text', tagline: 'text', description: 'text' });

// Method to add upvote
productSchema.methods.addUpvote = async function (userId) {
    if (!this.upvotes.includes(userId)) {
        this.upvotes.push(userId);
        this.upvoteCount = this.upvotes.length;
        await this.save();
    }
    return this;
};

// Method to remove upvote
productSchema.methods.removeUpvote = async function (userId) {
    this.upvotes = this.upvotes.filter(id => id.toString() !== userId.toString());
    this.upvoteCount = this.upvotes.length;
    await this.save();
    return this;
};

// Method to increment views
productSchema.methods.incrementViews = async function () {
    this.views += 1;
    await this.save();
    return this;
};

const Product = mongoose.model('Product', productSchema);

export { Product }; 