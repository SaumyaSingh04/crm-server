import Employee from '../models/Employee.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/upload.js';
import createHttpError from 'http-errors';
import pdf from 'html-pdf';
import { renderContractHTML } from '../utils/contract.utils.js';
import _ from 'lodash';

// Process files and upload to Cloudinary
export const processFiles = async (req) => {
  const fileData = {};
  if (!req.files) return fileData;

  // Helper to pick the right source
  const getSource = (file) =>
    file.path           // multer.diskStorage
    || file.tempFilePath // express-fileupload
    || (file.buffer && Buffer.isBuffer(file.buffer) && file.buffer) // multer.memoryStorage
    || null;

  // Process regular files (non-experience_letter)
  for (const field of Object.keys(req.files)) {
    if (field.startsWith('experience_letter_')) continue;
    
    const files = Array.isArray(req.files[field])
      ? req.files[field]
      : [req.files[field]];

    const uploads = await Promise.all(files.map(file => {
      const src = getSource(file);
      if (!src) {
        console.warn(`Skipping upload for ${field}: no file buffer or path`);
        return null;
      }
      return uploadToCloudinary(src, "employees");
    }));

    // Filter out any nulls, then unwrap singletons
    const results = uploads.filter(r => r !== null);
    fileData[field] = results.length === 1 ? results[0] : results;
  }

  // Process experience_letter_* fields
  const expFields = Object.keys(req.files)
    .filter(f => f.startsWith('experience_letter_'))
    .sort((a, b) => {
      const ai = +a.split('_')[2], bi = +b.split('_')[2];
      return ai - bi;
    });

  if (expFields.length) {
    fileData.experience_letter = [];
    for (const field of expFields) {
      const files = Array.isArray(req.files[field])
        ? req.files[field]
        : [req.files[field]];

      const uploads = await Promise.all(files.map(file => {
        const src = getSource(file);
        if (!src) {
          console.warn(`Skipping upload for ${field}: no file buffer or path`);
          return null;
        }
        return uploadToCloudinary(src, "employees");
      }));

      fileData.experience_letter.push(...uploads.filter(r => r !== null));
    }
  }

  return fileData;
};

export const createEmployee = async (req, res) => {
  try {
    if (!req?.body?.employeeData) {
      return res.status(400).json({
        success: false,
        message: "Missing employeeData in request",
      });
    }

    // ✅ Parse employee data
    let employeeData;
    try {
      employeeData =
        typeof req.body.employeeData === "string"
          ? JSON.parse(req.body.employeeData)
          : req.body.employeeData;
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format in employeeData",
      });
    }

    // 🚫 Remove manually injected employee_id
    delete employeeData.employee_id;

    // 📤 Upload all files
    const fileData = await processFiles(req);

    // 🔗 Map file fields explicitly to employeeData
    employeeData.profile_image = fileData.profile_image || null;
    employeeData.aadhar_document = fileData.aadhar_document || null;
    employeeData.pan_document = fileData.pan_document || null;

    employeeData.documents = {
      resume: fileData.resume || null,
      offer_letter: fileData.offer_letter || null,
      joining_letter: fileData.joining_letter || null,
      other_docs: fileData.other_docs || [],
    };

    // 🧾 Attach experience letters to work_experience array
    if (employeeData.work_experience && fileData.experience_letter) {
      employeeData.work_experience = employeeData.work_experience.map((exp, i) => ({
        ...exp,
        experience_letter: fileData.experience_letter[i] || null,
      }));
    }

    // 💾 Save employee
    const employee = new Employee(employeeData);
    const savedEmployee = await employee.save();

    return res.status(201).json({
      success: true,
      data: savedEmployee,
      message: "Employee created successfully",
    });

  } catch (error) {
    console.error("Error creating employee:", error);

    // Validation error
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: `Validation error: ${messages.join(", ")}`,
        errors: error.errors,
      });
    }

    // Duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    // Generic server error
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
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

    // ✅ FIX: Avoid JSON.parse crash
    let employeeData;
    try {
      employeeData = typeof req.body.employeeData === 'string'
        ? JSON.parse(req.body.employeeData)
        : req.body.employeeData || req.body;
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON format in employeeData'
      });
    }

    delete employeeData.employee_id;

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // File update handlers
    const fileUpdateHandlers = {
      profile_image: async () => {
        if (fileData.profile_image) {
          if (employee.profile_image?.public_id) {
            await deleteFromCloudinary(employee.profile_image.public_id);
          }
          return fileData.profile_image;
        }
        return employee.profile_image;
      },

      aadhar_document: async () => {
        if (fileData.aadhar_document) {
          if (employee.aadhar_document?.public_id) {
            await deleteFromCloudinary(employee.aadhar_document.public_id);
          }
          return fileData.aadhar_document;
        }
        return employee.aadhar_document;
      },

      pan_document: async () => {
        if (fileData.pan_document) {
          if (employee.pan_document?.public_id) {
            await deleteFromCloudinary(employee.pan_document.public_id);
          }
          return fileData.pan_document;
        }
        return employee.pan_document;
      }
    };

    for (const [field, handler] of Object.entries(fileUpdateHandlers)) {
      employeeData[field] = await handler();
    }

    // Handle documents
    employeeData.documents = employeeData.documents || {};
  
    const documentHandlers = {
      resume: async () => {
        if (fileData.resume) {
          if (employee.documents?.resume?.public_id) {
            await deleteFromCloudinary(employee.documents.resume.public_id);
          }
          return fileData.resume;
        }
        return employee.documents?.resume || null;
      },

      offer_letter: async () => {
        if (fileData.offer_letter) {
          if (employee.documents?.offer_letter?.public_id) {
            await deleteFromCloudinary(employee.documents.offer_letter.public_id);
          }
          return fileData.offer_letter;
        }
        return employee.documents?.offer_letter || null;
      },

      joining_letter: async () => {
        if (fileData.joining_letter) {
          if (employee.documents?.joining_letter?.public_id) {
            await deleteFromCloudinary(employee.documents.joining_letter.public_id);
          }
          return fileData.joining_letter;
        }
        return employee.documents?.joining_letter || null;
      }
    };

    for (const [docType, handler] of Object.entries(documentHandlers)) {
      employeeData.documents[docType] = await handler();
    }

    // Other Docs
    if (fileData.other_docs?.length) {
      employeeData.documents.other_docs = [
        ...(employee.documents?.other_docs || []),
        ...fileData.other_docs
      ];
    } else {
      employeeData.documents.other_docs = employee.documents?.other_docs || [];
    }

    // Work experience updates
    if (employeeData.work_experience) {
      const existingWorkExpMap = new Map();
      employee.work_experience.forEach(exp => {
        if (exp._id) existingWorkExpMap.set(exp._id.toString(), exp);
      });

      employeeData.work_experience = await Promise.all(
        employeeData.work_experience.map(async (newExp) => {
          const updatedExp = { ...newExp };
          const existingExp = existingWorkExpMap.get(newExp._id?.toString());

          if (existingExp?.experience_letter && newExp.experience_letter === null) {
            if (existingExp.experience_letter?.public_id) {
              await deleteFromCloudinary(existingExp.experience_letter.public_id);
            }
            updatedExp.experience_letter = null;
          } else if (existingExp?.experience_letter && newExp.experience_letter?.url) {
            updatedExp.experience_letter = existingExp.experience_letter;
          }

          return updatedExp;
        })
      );
    }

    if (fileData.experience_letter) {
      const newFiles = Array.isArray(fileData.experience_letter)
        ? fileData.experience_letter
        : [fileData.experience_letter];

      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        const expIndex = employeeData.work_experience.findIndex(
          exp => !exp._id || !exp.experience_letter
        );

        if (expIndex !== -1) {
          const expId = employeeData.work_experience[expIndex]._id;
          if (expId) {
            const existingExp = employee.work_experience.find(e => e._id.toString() === expId.toString());
            if (existingExp?.experience_letter?.public_id) {
              await deleteFromCloudinary(existingExp.experience_letter.public_id);
            }
          }

          employeeData.work_experience[expIndex].experience_letter = file;
        }
      }
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: employeeData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedEmployee,
      message: 'Employee updated successfully'
    });

  } catch (error) {
    console.error('Error updating employee:', error);
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
        deletePromises.push(deleteFromCloudinary(file.public_id));
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
        employee.documents.other_docs.forEach(deleteIfExists);
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
    console.error('Error deleting employee:', error);
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
    
    // Update operations mapping
    const updateOperations = {
      other_docs: {
        $pull: { 'documents.other_docs': { public_id } }
      },
      
      experience_letter: {
        $set: { 
          'work_experience.$[elem].experience_letter': null 
        }
      },
      
      resume: {
        $unset: { 'documents.resume': 1 }
      },
      
      offer_letter: {
        $unset: { 'documents.offer_letter': 1 }
      },
      
      joining_letter: {
        $unset: { 'documents.joining_letter': 1 }
      },
      
      profile_image: {
        $unset: { 'profile_image': 1 }
      },
      
      aadhar_document: {
        $unset: { 'aadhar_document': 1 }
      },
      
      pan_document: {
        $unset: { 'pan_document': 1 }
      }
    };

    if (!updateOperations[docType]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type'
      });
    }

    let updateOptions = {};
    if (docType === 'experience_letter') {
      updateOptions = {
        arrayFilters: [{ 'elem.experience_letter.public_id': public_id }]
      };
    }

    await Employee.updateOne(
      { _id: employeeId },
      updateOperations[docType],
      updateOptions
    );

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
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

// Contract Template Preview (HTML)
export const previewContract = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const html = renderContractHTML(employee);
    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error("Contract preview error:", err);
    res.status(500).json({ message: "Failed to generate contract preview" });
  }
};

// Accept Contract
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

// Update Contract Data
export const updateContract = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = {};

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

// Download Contract as PDF
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

    const html = renderContractHTML(employee);
    const options = { 
      format: 'A4',
      border: '0.5in'
    };

    const pdfBuffer = await new Promise((resolve, reject) => {
      pdf.create(html, options).toBuffer((err, buffer) => {
        if (err) reject(err);
        else resolve(buffer);
      });
    });

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