import request from "supertest";
import mongoose from "mongoose";
import { app } from "../app.js"; // Adjust path as needed
import { User } from "../models/user.model.js";
import { Category } from "../models/category.model.js";

describe("Category API", () => {
    let token;
    let userId;
    let categoryId;

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
    });

    afterAll(async () => {
        await User.deleteMany({});
        await Category.deleteMany({});
        await mongoose.disconnect();
    });

    it("should create a category", async () => {
        const response = await request(app)
            .post("/api/categories")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Test Category",
                description: "A test category"
            });
        expect(response.status).toBe(201);
        expect(response.body.data).toHaveProperty("_id");
        categoryId = response.body.data._id;
    });

    it("should get all categories", async () => {
        const response = await request(app)
            .get("/api/categories");
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should get a category by id", async () => {
        const response = await request(app)
            .get(`/api/categories/${categoryId}`);
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("name", "Test Category");
    });

    it("should update a category", async () => {
        const response = await request(app)
            .patch(`/api/categories/${categoryId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Updated Category" });
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("name", "Updated Category");
    });

    it("should get trending categories", async () => {
        const response = await request(app)
            .get("/api/categories/trending");
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should delete a category", async () => {
        const response = await request(app)
            .delete(`/api/categories/${categoryId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("_id", categoryId);
    });
}); 
import mongoose from "mongoose";
import { app } from "../app.js"; // Adjust path as needed
import { User } from "../models/user.model.js";
import { Category } from "../models/category.model.js";

describe("Category API", () => {
    let token;
    let userId;
    let categoryId;

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
    });

    afterAll(async () => {
        await User.deleteMany({});
        await Category.deleteMany({});
        await mongoose.disconnect();
    });

    it("should create a category", async () => {
        const response = await request(app)
            .post("/api/categories")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Test Category",
                description: "A test category"
            });
        expect(response.status).toBe(201);
        expect(response.body.data).toHaveProperty("_id");
        categoryId = response.body.data._id;
    });

    it("should get all categories", async () => {
        const response = await request(app)
            .get("/api/categories");
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should get a category by id", async () => {
        const response = await request(app)
            .get(`/api/categories/${categoryId}`);
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("name", "Test Category");
    });

    it("should update a category", async () => {
        const response = await request(app)
            .patch(`/api/categories/${categoryId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Updated Category" });
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("name", "Updated Category");
    });

    it("should get trending categories", async () => {
        const response = await request(app)
            .get("/api/categories/trending");
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should delete a category", async () => {
        const response = await request(app)
            .delete(`/api/categories/${categoryId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("_id", categoryId);
    });
}); 