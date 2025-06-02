import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.utils.js";

export const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new ApiError(401, "Authentication error: No token provided"));
            }

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded._id).select("-password");

            if (!user) {
                return next(new ApiError(404, "Authentication error: User not found"));
            }

            socket.user = user;
            next();
        } catch (error) {
            return next(new ApiError(401, "Authentication error: Invalid token"));
        }
    });

    // Connection handler
    io.on("connection", (socket) => {
        // Join user's personal room
        socket.join(socket.user._id.toString());

        // Handle disconnection
        socket.on("disconnect", () => {
            // Clean up any necessary resources
        });
    });

    return io;
}; 