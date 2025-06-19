// server/routes/employeeRoutes.js

import express from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  deleteDocument
} from "../controllers/EmployeeController.js";

import fileUpload from "express-fileupload";

const router = express.Router();

// File upload middleware
router.use(fileUpload({
  useTempFiles: true,
  tempFileDir: "/tmp/",
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  abortOnLimit: true
}));

// Routes
router.post("/", createEmployee);
router.get("/", getEmployees);
router.get("/:id", getEmployeeById);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);
router.delete("/:employeeId/documents/:docType/:public_id", deleteDocument);

export default router;
