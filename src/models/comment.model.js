import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Comment content is required'],
        trim: true,
        maxlength: [1000, 'Comment cannot be more than 1000 characters']
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    likeCount: {
        type: Number,
        default: 0
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    lastEditedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Method to add like
commentSchema.methods.addLike = async function (userId) {
    if (!this.likes.includes(userId)) {
        this.likes.push(userId);
        this.likeCount = this.likes.length;
        await this.save();
    }
    return this;
};

// Method to remove like
commentSchema.methods.removeLike = async function (userId) {
    this.likes = this.likes.filter(id => id.toString() !== userId.toString());
    this.likeCount = this.likes.length;
    await this.save();
    return this;
};

// Method to add reply
commentSchema.methods.addReply = async function (replyId) {
    this.replies.push(replyId);
    await this.save();
    return this;
};

// Method to update comment
commentSchema.methods.updateComment = async function (newContent) {
    this.content = newContent;
    this.isEdited = true;
    this.lastEditedAt = new Date();
    await this.save();
    return this;
};

// Method to hide comment
commentSchema.methods.hideComment = async function () {
    this.isHidden = true;
    await this.save();
    return this;
};

 export const Comment = mongoose.model('Comment', commentSchema);

