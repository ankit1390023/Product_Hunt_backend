import dotenv from 'dotenv';
import { connectDB } from './db/connection.js'
import { app, server } from './app.js'

// Load environment variables
dotenv.config();

// Health check route
app.get("/", (req, res) => {
    res.json({
        status: "success",
        message: "Server is running",
        timestamp: new Date().toISOString()
    });
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${process.env.PORT || 8000} is already in use. Please try a different port.`);
        process.exit(1);
    } else {
        console.error('Server error:', error);
    }
});

// Start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        console.log('Connected to MongoDB');

        // Start server
        const port = process.env.PORT || 8000;
        server.listen(port, () => {
            console.log(`Server is running on port ${port}`);
            console.log(`API available at http://localhost:${port}/api/v1`);
            console.log(`Health check at http://localhost:${port}/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Promise Rejection:', error);
    // Close server & exit process
    server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Close server & exit process
    server.close(() => process.exit(1));
});

// Start the server
startServer();