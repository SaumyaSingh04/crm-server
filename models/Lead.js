// server/models/Lead.js
import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    number: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["New", "Contacted", "In Progress", "Qualified", "Lost", "Won"],
      default: "New",
    },
    followUpDate: {
      type: Date,
      required: false,
    },
    followUpStatus: {
      type: String,
      enum: ["Not Started", "Scheduled", "Pending", "Completed"],
      default: "Not Started",
    },
    isInterested: {
      type: Boolean,
      default: false,
    },
    meetingDate: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

const Lead = mongoose.model("Lead", leadSchema);
export default Lead;
