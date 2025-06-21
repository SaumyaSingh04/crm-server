import Employee from '../models/Employee.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/upload.js';
import mongoose from 'mongoose';
import createHttpError from 'http-errors';
import pdf from 'html-pdf';
import { renderContractHTML } from '../utils/contract.utils.js';
import fs from "fs";
import path from "path";
import handlebars from 'handlebars';

// Process files and upload to Cloudinary

export const processFiles = async (req) => {
  const fileData = {};

  if (!req.files) return fileData;
  const arrayFields = ['other_docs', 'experience_letter'];
  for (const field in req.files) {
    let files = req.files[field];

    // Ensure files is always an array
    if (!Array.isArray(files)) {
      files = [files];
    }

    // Handle array fields
    if (arrayFields.includes(field)) {
      fileData[field] = files.map(file => ({
        public_id: file.public_id,
        url: file.secure_url
      }));
    } 

    // All other fields (resume, profile_image, pan_document, etc.)
    fileData[field] = [];
    for (const file of files) {
      try {
        const uploaded = await uploadToCloudinary(file.tempFilePath, "employees");
        fileData[field].push(uploaded);
      } catch (error) {
        console.error(`Error uploading ${field}:`, error);
      }
    }

    // If only one file, simplify
    if (fileData[field].length === 1) {
      fileData[field] = fileData[field][0];
    }
  }

  return fileData;
};


export const createEmployee = async (req, res) => {
  try {
    // Debug: Log incoming request
    console.log('Received files:', Object.keys(req.files || {}));
    console.log('Received employeeData:', req.body.employeeData);
    console.log("req.files:", req.files);
    if (!req?.body?.employeeData) {
      return res.status(400).json({
        success: false,
        message: 'Missing employeeData in request'
      });
    }

    let employeeData;
    try {
      employeeData = JSON.parse(req.body.employeeData);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON in employeeData'
      });
    }
    
    // Remove any existing employee_id to prevent manual entry
    delete employeeData.employee_id;
    
    const fileData = await processFiles(req);
    
    // Map file data to employee data
    employeeData.profile_image = fileData.profile_image || null;
    employeeData.aadhar_document = fileData.aadhar_document || null;
    employeeData.pan_document = fileData.pan_document || null;
    
    // Handle documents
    employeeData.documents = {
      resume: fileData.resume || null,
      offer_letter: fileData.offer_letter || null,
      joining_letter: fileData.joining_letter || null,
      other_docs: fileData.other_docs || []
    };
    
    // Handle work experience files
   if (employeeData.work_experience && fileData.experience_letter) {
      // Map experience letters to work experience entries
      employeeData.work_experience = employeeData.work_experience.map((exp, index) => ({
        ...exp,
        experience_letter: fileData.experience_letter[index] || null
      }));
    }
    
    const employee = new Employee(employeeData);
    await employee.save();
    
    res.status(201).json({
      success: true,
      data: employee,
      message: 'Employee created successfully'
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID or email already exists'
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get All Employees
export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ employee_id: 1 });
    res.status(200).json({
      success: true,
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get Single Employee
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update Employee
export const updateEmployee = async (req, res) => {
  try {
    const fileData = await processFiles(req);
    const employeeData = req.body.employeeData ? 
      JSON.parse(req.body.employeeData) : 
      req.body;

    // Prevent changing the auto-generated employee_id
    if (employeeData.employee_id) {
      delete employeeData.employee_id;
    }

    // Find existing employee
    let employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // profile_image
    if (fileData.profile_image) {
      if (employee.profile_image?.public_id) {
        await deleteFromCloudinary(employee.profile_image.public_id);
      }
      employeeData.profile_image = fileData.profile_image;
    } else {
      employeeData.profile_image = employee.profile_image;
    }

    // aadhar_document
    if (fileData.aadhar_document) {
      if (employee.aadhar_document?.public_id) {
        await deleteFromCloudinary(employee.aadhar_document.public_id);
      }
      employeeData.aadhar_document = fileData.aadhar_document;
    } else {
      employeeData.aadhar_document = employee.aadhar_document;
    }

    // pan_document
    if (fileData.pan_document) {
      if (employee.pan_document?.public_id) {
        await deleteFromCloudinary(employee.pan_document.public_id);
      }
      employeeData.pan_document = fileData.pan_document;
    } else {
      employeeData.pan_document = employee.pan_document;
    }

    // Resume
    employeeData.documents = employeeData.documents || {};
    if (fileData.resume) {
      if (employee.documents?.resume?.public_id) {
        await deleteFromCloudinary(employee.documents.resume.public_id);
      }
      employeeData.documents.resume = fileData.resume;
    } else {
      employeeData.documents.resume = employee.documents?.resume || null;
    }

    // Offer Letter
    if (fileData.offer_letter) {
      if (employee.documents?.offer_letter?.public_id) {
        await deleteFromCloudinary(employee.documents.offer_letter.public_id);
      }
      employeeData.documents.offer_letter = fileData.offer_letter;
    } else {
      employeeData.documents.offer_letter = employee.documents?.offer_letter || null;
    }

    // Joining Letter
    if (fileData.joining_letter) {
      if (employee.documents?.joining_letter?.public_id) {
        await deleteFromCloudinary(employee.documents.joining_letter.public_id);
      }
      employeeData.documents.joining_letter = fileData.joining_letter;
    } else {
      employeeData.documents.joining_letter = employee.documents?.joining_letter || null;
    }

    // Other Docs
    if (fileData.other_docs && fileData.other_docs.length > 0) {
      employeeData.documents.other_docs = [
        ...(employee.documents?.other_docs || []),
        ...fileData.other_docs
      ];
    } else {
      employeeData.documents.other_docs = employee.documents?.other_docs || [];
    }

    // Handle work experience files
    if (employeeData.work_experience && fileData.experience_letter) {
      employeeData.work_experience.forEach((exp, index) => {
        if (fileData.experience_letter[index]) {
          // Delete old experience letter if exists
          if (employee.work_experience[index]?.experience_letter?.public_id) {
            deleteFromCloudinary(employee.work_experience[index].experience_letter.public_id)
              .catch(err => console.error('Error deleting old experience letter:', err));
          }
          exp.experience_letter = fileData.experience_letter[index];
        } else if (employee.work_experience[index]?.experience_letter) {
          // Keep existing if no new file
          exp.experience_letter = employee.work_experience[index].experience_letter;
        }
      });
    }
    

    // Update employee
    employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: employeeData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: employee,
      message: 'Employee updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


// Delete Employee
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Delete all associated files from Cloudinary
    const deletePromises = [];
    
    const deleteIfExists = (file) => {
      if (file?.public_id) {
        deletePromises.push(
          deleteFromCloudinary(file.public_id)
        );
      }
    };
    
    // Delete profile images and documents
    deleteIfExists(employee.profile_image);
    deleteIfExists(employee.aadhar_document);
    deleteIfExists(employee.pan_document);
    
    // Delete documents
    if (employee.documents) {
      deleteIfExists(employee.documents.resume);
      deleteIfExists(employee.documents.offer_letter);
      deleteIfExists(employee.documents.joining_letter);
      
      if (employee.documents.other_docs) {
        employee.documents.other_docs.forEach(doc => {
          deleteIfExists(doc);
        });
      }
    }
    
    // Delete work experience files
    if (employee.work_experience) {
      employee.work_experience.forEach(exp => {
        deleteIfExists(exp.experience_letter);
      });
    }
    
    // Wait for all deletions to complete
    await Promise.all(deletePromises);
    
    await employee.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete a specific document
export const deleteDocument = async (req, res) => {
  try {
    const { employeeId, docType, public_id } = req.params;
    
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Delete file from Cloudinary
    await deleteFromCloudinary(public_id);
    
    // Remove reference from employee document
    let updateQuery = {};
    
    if (docType === 'other_docs') {
      updateQuery = {
        $pull: { 'documents.other_docs': { public_id } }
      };
    } else if (docType === 'experience_letter') {
      const expIndex = employee.work_experience.findIndex(
        exp => exp.experience_letter?.public_id === public_id
      );
      
      if (expIndex !== -1) {
        employee.work_experience[expIndex].experience_letter = null;
        await employee.save();
        return res.status(200).json({
          success: true,
          message: 'Document deleted successfully'
        });
      }
    } else {
      // Handle other document types
      const fieldMap = {
        resume: 'documents.resume',
        offer_letter: 'documents.offer_letter',
        joining_letter: 'documents.joining_letter',
        profile_image: 'profile_image',
        aadhar_document: 'aadhar_document',
        pan_document: 'pan_document'
      };
      
      if (fieldMap[docType]) {
        updateQuery = {
          $unset: { [fieldMap[docType]]: 1 }
        };
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid document type'
        });
      }
    }
    
    await Employee.updateOne(
      { _id: employeeId },
      updateQuery
    );
    
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
// Toggle is_current_employee
export const toggleCurrentEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    employee.is_current_employee = !employee.is_current_employee;
    await employee.save();

    res.status(200).json({
      success: true,
      message: "is_current_employee toggled successfully",
      data: employee,
    });
  } catch (error) {
    console.error("Toggle Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while toggling is_current_employee",
    });
  }
};

// // Process files and upload to Cloudinary
// export const processFiles = async (req) => {
//   const fileData = {};
//   if (!req.files) return fileData;

//   const arrayFields = ['other_docs', 'experience_letter'];
//   for (const field in req.files) {
//     let files = req.files[field];
//     if (!Array.isArray(files)) files = [files];

//     // Upload each file
//     fileData[field] = [];
//     for (const file of files) {
//       try {
//         const uploaded = await uploadToCloudinary(file.tempFilePath, "employees");
//         fileData[field].push(uploaded);
//       } catch (error) {
//         console.error(`Error uploading ${field}:`, error);
//       }
//     }

//     // Simplify single‐file arrays
//     if (fileData[field].length === 1) {
//       fileData[field] = fileData[field][0];
//     }
//   }

//   return fileData;
// };


// ✅ CONTRACT TEMPLATE PREVIEW (HTML)
export const previewContract = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    // Use the renderContractHTML utility
    const html = renderContractHTML(employee);

    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error("Contract preview error:", err);
    res.status(500).json({ message: "Failed to generate contract preview" });
  }
};


// ✅ PATCH: Accept Contract
export const acceptContract = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updated = await Employee.findByIdAndUpdate(
      id,
      {
        $set: {
          'contract_agreement.acceptance.accepted': true,
          'contract_agreement.acceptance.accepted_at': new Date()
        }
      },
      { new: true }
    );

    if (!updated) throw createHttpError(404, 'Employee not found');

    res.status(200).json({
      success: true,
      acceptance: updated.contract_agreement.acceptance
    });
  } catch (err) {
    next(err);
  }
};

// ✅ PUT: Update Contract Data
export const updateContract = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = {};

    // Flatten and set nested contract_agreement fields
    Object.entries(req.body).forEach(([key, val]) => {
      updates[`contract_agreement.${key}`] = val;
    });

    const updated = await Employee.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) throw createHttpError(404, "Employee not found");

    res.status(200).json({
      success: true,
      contract: updated.contract_agreement
    });
  } catch (err) {
    next(err);
  }
};

// controllers/EmployeeController.js
export const downloadContract = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Render HTML from template
    const html = renderContractHTML(employee);

    // PDF generation options
    const options = { 
      format: 'A4',
      border: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    };

    // Generate PDF
    const pdfBuffer = await new Promise((resolve, reject) => {
      pdf.create(html, options).toBuffer((err, buffer) => {
        if (err) reject(err);
        else resolve(buffer);
      });
    });

    // Set response headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=Employment_Contract_${employee.employee_id}.pdf`,
      'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating contract:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate contract PDF'
    });
  }
};