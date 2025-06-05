// server/createAdminUser.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

// Create admin user
const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: "admin@shine.com" });

    if (adminExists) {
      console.log("Admin user already exists");
      return;
    }

    // Create new admin user
    const adminUser = new User({
      name: "Admin User",
      email: "admin@shine.com",
      password: "admin123", // In production, use a strong password
      isAdmin: true,
    });

    await adminUser.save();
    console.log("Admin user created successfully");
  } catch (error) {
    console.error("Error creating admin user:", error.message);
  } finally {
    // Disconnect from MongoDB
    mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

// Run the script
connectDB().then(() => {
  createAdminUser();
});
