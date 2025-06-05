// server/controllers/authController.js
import User from "../models/User.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt with:", email);

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log("User found, comparing passwords");
    console.log("Input password:", password);
    console.log("Stored password:", user.password);

    // Check if password matches
    if (password === user.password) {
      console.log("Password match successful");
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      });
    } else {
      console.log("Password match failed");
      return res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password, // In production, hash this password
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
