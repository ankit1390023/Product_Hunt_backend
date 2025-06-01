import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    avatar: {
        type: String,
        default: 'default-avatar.png'
    },
    bio: {
        type: String,
        maxlength: 500
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
    },
    upvotedProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    submittedProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    profile: {
        displayName: {
            type: String,
            trim: true
        },
        headline: {
            type: String,
            trim: true,
            maxlength: 200
        },
        website: {
            type: String,
            trim: true
        },
        location: {
            type: String,
            trim: true
        },
        socialLinks: {
            twitter: String,
            github: String,
            linkedin: String,
            productHunt: String
        },
        makerProfile: {
            type: Boolean,
            default: false
        },
        makerBio: {
            type: String,
            maxlength: 1000
        }
    },
    activity: {
        lastActive: {
            type: Date,
            default: Date.now
        },
        totalUpvotes: {
            type: Number,
            default: 0
        },
        totalComments: {
            type: Number,
            default: 0
        },
        totalProducts: {
            type: Number,
            default: 0
        }
    },
    notifications: {
        email: {
            newComments: { type: Boolean, default: true },
            newUpvotes: { type: Boolean, default: true },
            productUpdates: { type: Boolean, default: true },
            marketing: { type: Boolean, default: false }
        },
        inApp: {
            newComments: { type: Boolean, default: true },
            newUpvotes: { type: Boolean, default: true },
            productUpdates: { type: Boolean, default: true }
        }
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    refreshToken: {
        type: String
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpiry: {
        type: Date
    },
    emailVerificationToken: {
        type: String
    },
    emailVerificationExpiry: {
        type: Date
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    }
}, {
    timestamps: true
});

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.isPasswordCorrect = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate access token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            role: this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
};

// Method to generate refresh token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
};

export const User = mongoose.model('User', userSchema);

