// server/controllers/adminController.js
import User from "../models/User.js";

// Get all users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get admin dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();

    // You can add more stats here as your application grows
    const stats = {
      userCount,
      // Add other stats as needed
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new user (admin only)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, isAdmin } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password, // In a real app, hash this password
      isAdmin,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
