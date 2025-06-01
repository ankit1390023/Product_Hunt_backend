import request from "supertest";
import mongoose from "mongoose";
import { app } from "../app.js"; // Adjust path as needed
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { Comment } from "../models/comment.model.js";

describe("Comment API", () => {
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
    });

    afterAll(async () => {
        await User.deleteMany({});
        await Product.deleteMany({});
        await Comment.deleteMany({});
        await mongoose.disconnect();
    });

    it("should create a comment", async () => {
        const response = await request(app)
            .post(`/api/comments/product/${productId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ content: "Test comment" });
        expect(response.status).toBe(201);
        expect(response.body.data).toHaveProperty("_id");
        commentId = response.body.data._id;
    });

    it("should get comments for a product", async () => {
        const response = await request(app)
            .get(`/api/comments/product/${productId}`);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data.comments)).toBe(true);
    });

    it("should update a comment", async () => {
        const response = await request(app)
            .patch(`/api/comments/${commentId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ content: "Updated comment" });
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("content", "Updated comment");
    });

    it("should like a comment", async () => {
        const response = await request(app)
            .post(`/api/comments/${commentId}/like`)
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("likes");
    });

    it("should delete a comment", async () => {
        const response = await request(app)
            .delete(`/api/comments/${commentId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("_id", commentId);
    });
}); 
import mongoose from "mongoose";
import { app } from "../app.js"; // Adjust path as needed
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { Comment } from "../models/comment.model.js";

describe("Comment API", () => {
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
    });

    afterAll(async () => {
        await User.deleteMany({});
        await Product.deleteMany({});
        await Comment.deleteMany({});
        await mongoose.disconnect();
    });

    it("should create a comment", async () => {
        const response = await request(app)
            .post(`/api/comments/product/${productId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ content: "Test comment" });
        expect(response.status).toBe(201);
        expect(response.body.data).toHaveProperty("_id");
        commentId = response.body.data._id;
    });

    it("should get comments for a product", async () => {
        const response = await request(app)
            .get(`/api/comments/product/${productId}`);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data.comments)).toBe(true);
    });

    it("should update a comment", async () => {
        const response = await request(app)
            .patch(`/api/comments/${commentId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ content: "Updated comment" });
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("content", "Updated comment");
    });

    it("should like a comment", async () => {
        const response = await request(app)
            .post(`/api/comments/${commentId}/like`)
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("likes");
    });

    it("should delete a comment", async () => {
        const response = await request(app)
            .delete(`/api/comments/${commentId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("_id", commentId);
    });
}); 