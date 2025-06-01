import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URL, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log(`MONGODB CONNECTED SUCCESSFULLY! DB HOST: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};

export { connectDB };
