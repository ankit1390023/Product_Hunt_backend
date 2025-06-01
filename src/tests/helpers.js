import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

// Create a test user and return auth token
export const createTestUser = async () => {
    const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User'
    });

    const accessToken = jwt.sign(
        { _id: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1d' }
    );

    return { user, accessToken };
};

// Create test product data
export const createTestProduct = () => ({
    name: 'Test Product',
    description: 'Test Description',
    website: 'https://test.com',
    category: 'Test Category',
    tags: ['test', 'product'],
    twitter: 'https://twitter.com/test',
    github: 'https://github.com/test'
});

// Create test category data
export const createTestCategory = () => ({
    name: 'Test Category',
    description: 'Test Category Description',
    color: '#FF0000'
});

// Create test comment data
export const createTestComment = () => ({
    content: 'Test Comment',
    productId: 'testProductId'
}); 