import request from "supertest";
import mongoose from "mongoose";
import { app } from "../app.js"; // Adjust path as needed
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { Comment } from "../models/comment.model.js";

describe("Search API", () => {
    let token;
    let userId;
    let productId;
    let commentId;

    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI_TEST || "mongodb://localhost:27017/product_hunt_test");
        // Create a test user and get token
        const user = await User.create({
            username: "testuser",
            email: "test@example.com",
            password: "password123"
        });
        userId = user._id;
        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({ email: "test@example.com", password: "password123" });
        token = loginResponse.body.data.token;

        // Create a test product
        const product = await Product.create({
            name: "Test Product",
            tagline: "A test product",
            description: "This is a test product description",
            category: new mongoose.Types.ObjectId(),
            createdBy: userId
        });
        productId = product._id;

        // Create a test comment
        const comment = await Comment.create({
            content: "Test comment",
            product: productId,
            author: userId
        });
        commentId = comment._id;
    });

    afterAll(async () => {
        await User.deleteMany({});
        await Product.deleteMany({});
        await Comment.deleteMany({});
        await mongoose.disconnect();
    });

    it("should search products", async () => {
        const response = await request(app)
            .get("/api/search/products")
            .query({ query: "Test" });
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should search users", async () => {
        const response = await request(app)
            .get("/api/search/users")
            .query({ query: "testuser" });
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should search comments", async () => {
        const response = await request(app)
            .get("/api/search/comments")
            .query({ query: "Test" });
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should get search suggestions", async () => {
        const response = await request(app)
            .get("/api/search/suggestions")
            .query({ query: "Test" });
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("products");
        expect(response.body.data).toHaveProperty("users");
        expect(response.body.data).toHaveProperty("categories");
    });
}); 
import mongoose from "mongoose";
import { app } from "../app.js"; // Adjust path as needed
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { Comment } from "../models/comment.model.js";

describe("Search API", () => {
    let token;
    let userId;
    let productId;
    let commentId;

    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI_TEST || "mongodb://localhost:27017/product_hunt_test");
        // Create a test user and get token
        const user = await User.create({
            username: "testuser",
            email: "test@example.com",
            password: "password123"
        });
        userId = user._id;
        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({ email: "test@example.com", password: "password123" });
        token = loginResponse.body.data.token;

        // Create a test product
        const product = await Product.create({
            name: "Test Product",
            tagline: "A test product",
            description: "This is a test product description",
            category: new mongoose.Types.ObjectId(),
            createdBy: userId
        });
        productId = product._id;

        // Create a test comment
        const comment = await Comment.create({
            content: "Test comment",
            product: productId,
            author: userId
        });
        commentId = comment._id;
    });

    afterAll(async () => {
        await User.deleteMany({});
        await Product.deleteMany({});
        await Comment.deleteMany({});
        await mongoose.disconnect();
    });

    it("should search products", async () => {
        const response = await request(app)
            .get("/api/search/products")
            .query({ query: "Test" });
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should search users", async () => {
        const response = await request(app)
            .get("/api/search/users")
            .query({ query: "testuser" });
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should search comments", async () => {
        const response = await request(app)
            .get("/api/search/comments")
            .query({ query: "Test" });
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should get search suggestions", async () => {
        const response = await request(app)
            .get("/api/search/suggestions")
            .query({ query: "Test" });
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("products");
        expect(response.body.data).toHaveProperty("users");
        expect(response.body.data).toHaveProperty("categories");
    });
}); 