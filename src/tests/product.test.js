import request from "supertest";
import mongoose from "mongoose";
import { app } from "../app.js"; // Adjust path as needed
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { createTestUser, createTestProduct } from './helpers.js';

describe("Product API", () => {
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
            password: "password123"
        });
        userId = user._id;
        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({ email: "test@example.com", password: "password123" });
        token = loginResponse.body.data.token;
    });

    afterAll(async () => {
        await User.deleteMany({});
        await Product.deleteMany({});
        await mongoose.disconnect();
    });

    it("should create a product", async () => {
        const response = await request(app)
            .post("/api/products")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Test Product",
                tagline: "A test product",
                description: "This is a test product description",
                category: new mongoose.Types.ObjectId()
            });
        expect(response.status).toBe(201);
        expect(response.body.data).toHaveProperty("_id");
        productId = response.body.data._id;
    });

    it("should get a product", async () => {
        const response = await request(app)
            .get(`/api/products/${productId}`);
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("name", "Test Product");
    });

    it("should update a product", async () => {
        const response = await request(app)
            .patch(`/api/products/${productId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Updated Product" });
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("name", "Updated Product");
    });

    it("should upvote a product", async () => {
        const response = await request(app)
            .post(`/api/products/${productId}/upvote`)
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("upvotes");
    });

    it("should get trending products", async () => {
        const response = await request(app)
            .get("/api/products/trending");
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should delete a product", async () => {
        const response = await request(app)
            .delete(`/api/products/${productId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("_id", productId);
    });
});

describe('Product Routes', () => {
    let accessToken;
    let testProduct;

    beforeEach(async () => {
        const { accessToken: token } = await createTestUser();
        accessToken = token;
        testProduct = createTestProduct();
    });

    describe('POST /api/v1/products', () => {
        it('should create a new product', async () => {
            const response = await request(app)
                .post('/api/v1/products')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(testProduct);

            expect(response.status).toBe(201);
            expect(response.body.data).toHaveProperty('product');
            expect(response.body.data.product).toHaveProperty('name', testProduct.name);
        });

        it('should not create product without auth', async () => {
            const response = await request(app)
                .post('/api/v1/products')
                .send(testProduct);

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/v1/products', () => {
        it('should get all products', async () => {
            // Create a test product first
            await request(app)
                .post('/api/v1/products')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(testProduct);

            const response = await request(app)
                .get('/api/v1/products');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.data.products)).toBe(true);
        });
    });

    describe('GET /api/v1/products/:id', () => {
        it('should get product by id', async () => {
            // Create a test product first
            const createResponse = await request(app)
                .post('/api/v1/products')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(testProduct);

            const productId = createResponse.body.data.product._id;

            const response = await request(app)
                .get(`/api/v1/products/${productId}`);

            expect(response.status).toBe(200);
            expect(response.body.data.product).toHaveProperty('_id', productId);
        });
    });

    describe('PUT /api/v1/products/:id', () => {
        it('should update product', async () => {
            // Create a test product first
            const createResponse = await request(app)
                .post('/api/v1/products')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(testProduct);

            const productId = createResponse.body.data.product._id;
            const updateData = { name: 'Updated Product Name' };

            const response = await request(app)
                .put(`/api/v1/products/${productId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.data.product).toHaveProperty('name', updateData.name);
        });
    });

    describe('DELETE /api/v1/products/:id', () => {
        it('should delete product', async () => {
            // Create a test product first
            const createResponse = await request(app)
                .post('/api/v1/products')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(testProduct);

            const productId = createResponse.body.data.product._id;

            const response = await request(app)
                .delete(`/api/v1/products/${productId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
        });
    });
}); 