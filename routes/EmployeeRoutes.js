import express from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  deleteDocument,
  toggleCurrentEmployee,
  previewContract,
  acceptContract,
  updateContract,
  downloadContract,
  // acceptPolicy, getPolicyStatus,
  // acceptTerms,
  // getTermsStatus,
} from "../controllers/EmployeeController.js";

import upload from "../config/multer.js";

const router = express.Router();

const uploadFields = upload.fields([
  { name: "profile_image", maxCount: 1 },
  { name: "aadhar_document", maxCount: 1 },
  { name: "pan_document", maxCount: 1 },
  { name: "resume", maxCount: 1 },
  { name: "offer_letter", maxCount: 1 },
  { name: "joining_letter", maxCount: 1 },
  { name: "other_docs", maxCount: 10 },
  { name: "experience_letter", maxCount: 10 },
]);

// Employee routes
router.post("/", uploadFields, createEmployee);
router.put("/:id", uploadFields, updateEmployee);
router.get("/", getEmployees);
router.get("/:id", getEmployeeById);
router.delete("/:id", deleteEmployee);
router.delete("/:employeeId/documents/:docType/:public_id", deleteDocument);
router.patch("/employees/:id/toggle-current", toggleCurrentEmployee);

// Contract-related routes
router.get("/:id/contract/preview", previewContract);
router.patch("/:id/contract/accept", acceptContract);
router.put("/:id/contract/update", updateContract);
router.get("/:id/contract/download", downloadContract);
// router.post('/:id/accept-policy', acceptPolicy);
// router.get('/:id/policy-status', getPolicyStatus);
// router.post("/:id/accept-terms", acceptTerms);
// router.get("/:id/terms-status", getTermsStatus);

export default router;
