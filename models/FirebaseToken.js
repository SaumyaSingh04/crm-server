// models/FirebaseToken.js
import mongoose from "mongoose";

const FirebaseTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Optional for later scaling
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.FirebaseToken ||
  mongoose.model("FirebaseToken", FirebaseTokenSchema);
