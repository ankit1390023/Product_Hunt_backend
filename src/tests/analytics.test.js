import request from "supertest";
import mongoose from "mongoose";
import { app } from "../app.js"; // Adjust path as needed
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";

describe("Analytics API", () => {
    let token;
    let userId;
    let productId;

    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI_TEST || "mongodb://localhost:27017/product_hunt_test");
        // Create a test user and get token
        const user = await User.create({
            username: "testuser",
            email: "test@example.com",
            password: "password123",
            role: "admin"
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
        await mongoose.disconnect();
    });

    it("should get product analytics", async () => {
        const response = await request(app)
            .get(`/api/analytics/products/${productId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("views");
        expect(response.body.data).toHaveProperty("upvotes");
        expect(response.body.data).toHaveProperty("comments");
    });

    it("should get user analytics", async () => {
        const response = await request(app)
            .get(`/api/analytics/users/${userId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("products");
        expect(response.body.data).toHaveProperty("comments");
        expect(response.body.data).toHaveProperty("upvotes");
    });

    it("should get platform analytics", async () => {
        const response = await request(app)
            .get("/api/analytics/platform")
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("totalProducts");
        expect(response.body.data).toHaveProperty("totalUsers");
        expect(response.body.data).toHaveProperty("totalComments");
    });
}); 
import mongoose from "mongoose";
import { app } from "../app.js"; // Adjust path as needed
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";

describe("Analytics API", () => {
    let token;
    let userId;
    let productId;

    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI_TEST || "mongodb://localhost:27017/product_hunt_test");
        // Create a test user and get token
        const user = await User.create({
            username: "testuser",
            email: "test@example.com",
            password: "password123",
            role: "admin"
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
        await mongoose.disconnect();
    });

    it("should get product analytics", async () => {
        const response = await request(app)
            .get(`/api/analytics/products/${productId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("views");
        expect(response.body.data).toHaveProperty("upvotes");
        expect(response.body.data).toHaveProperty("comments");
    });

    it("should get user analytics", async () => {
        const response = await request(app)
            .get(`/api/analytics/users/${userId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("products");
        expect(response.body.data).toHaveProperty("comments");
        expect(response.body.data).toHaveProperty("upvotes");
    });

    it("should get platform analytics", async () => {
        const response = await request(app)
            .get("/api/analytics/platform")
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("totalProducts");
        expect(response.body.data).toHaveProperty("totalUsers");
        expect(response.body.data).toHaveProperty("totalComments");
    });
}); 