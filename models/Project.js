// server/models/Project.js
import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true,
    },
    projectType: {
      type: String,
      required: true,
    },
    projectAmount: {
      type: Number,
      required: true,
    },
    advanceAmount: {
      type: Number,
      required: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    clientContact: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    deadline: {
      type: Date,
    },
    handoverDate: {
      type: Date,
    },
    commissionTo: {
      type: String,
    },
    commissionAmount: {
      type: Number,
    },
    domain: {
      type: String,
    },
    domainPurchaseDate: {
      type: Date,
    },
    domainCost: {
      type: Number,
    },
    domainExpiryDate: {
      type: Date,
    },
    renewalDate: {
      type: Date,
    },
    projectLink: {
      type: String,
    },
    sourceCodeLink: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
    },
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);
export default Project;
