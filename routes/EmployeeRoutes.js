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

const router = express.Router();

// Routes
router.post("/", createEmployee);
router.get("/", getEmployees);
router.get("/:id", getEmployeeById);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);
router.delete("/:employeeId/documents/:docType/:public_id", deleteDocument);

export default router;
