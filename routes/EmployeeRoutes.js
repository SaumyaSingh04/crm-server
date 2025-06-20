import express from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  deleteDocument,
  toggleCurrentEmployee
} from "../controllers/EmployeeController.js";

import upload from "../config/multer.js";

const router = express.Router();

router.post(
  "/",
  upload.fields([
    { name: "profile_image", maxCount: 1 },
    { name: "aadhar_document", maxCount: 1 },
    { name: "pan_document", maxCount: 1 },
    { name: "resume", maxCount: 1 },
    { name: "offer_letter", maxCount: 1 },
    { name: "joining_letter", maxCount: 1 },
    { name: "other_docs", maxCount: 10 },
    { name: "experience_letter", maxCount: 10 },
  ]),
  createEmployee
);

router.get("/", getEmployees);
router.get("/:id", getEmployeeById);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);
router.delete("/:employeeId/documents/:docType/:public_id", deleteDocument);
router.patch("/employees/:id/toggle-current", toggleCurrentEmployee);

export default router;
