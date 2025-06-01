import request from "supertest";
import mongoose from "mongoose";
import { app } from "../app.js"; // Adjust path as needed
import { User } from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";

describe("Notification API", () => {
    let token;
    let userId;
    let notificationId;

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
        await Notification.deleteMany({});
        await mongoose.disconnect();
    });

    it("should create a notification", async () => {
        const response = await request(app)
            .post("/api/notifications")
            .set("Authorization", `Bearer ${token}`)
            .send({
                recipientId: userId,
                type: "system",
                content: "Test notification",
                relatedId: new mongoose.Types.ObjectId()
            });
        expect(response.status).toBe(201);
        expect(response.body.data).toHaveProperty("_id");
        notificationId = response.body.data._id;
    });

    it("should get user notifications", async () => {
        const response = await request(app)
            .get("/api/notifications")
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data.notifications)).toBe(true);
    });

    it("should mark notifications as read", async () => {
        const response = await request(app)
            .patch("/api/notifications/read")
            .set("Authorization", `Bearer ${token}`)
            .send({ notificationIds: [notificationId] });
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("unreadCount");
    });

    it("should delete notifications", async () => {
        const response = await request(app)
            .delete("/api/notifications")
            .set("Authorization", `Bearer ${token}`)
            .send({ notificationIds: [notificationId] });
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("unreadCount");
    });

    it("should update notification preferences", async () => {
        const response = await request(app)
            .patch("/api/notifications/preferences")
            .set("Authorization", `Bearer ${token}`)
            .send({ preferences: { email: true, push: false } });
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("email", true);
    });

    it("should get notification preferences", async () => {
        const response = await request(app)
            .get("/api/notifications/preferences")
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty("email");
    });
}); 