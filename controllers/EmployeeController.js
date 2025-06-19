import Employee from '../models/Employee.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/upload.js';
import fs from 'fs';
import path from 'path';

// Process files and upload to Cloudinary
const processFiles = async (req) => {
    const fileData = {};
    
    if (!req.files) return fileData;
  
    for (const field in req.files) {
      let files = req.files[field];
      
      // Normalize to array
      if (!Array.isArray(files)) {
        files = [files];
      }
  
      if (files.length === 1) {
        try {
          fileData[field] = await uploadToCloudinary(files[0]);
        } catch (error) {
          console.error(`Error uploading ${field}:`, error);
        }
      } else {
        fileData[field] = [];
        for (const file of files) {
          try {
            const uploaded = await uploadToCloudinary(file);
            fileData[field].push(uploaded);
          } catch (error) {
            console.error(`Error uploading file in ${field}:`, error);
          }
        }
      }
    }
    
    return fileData;
  };

export const createEmployee = async (req, res) => {
    try {
      // Debug: Log incoming request
      console.log('Received files:', Object.keys(req.files || {}));
      console.log('Received employeeData:', req.body.employeeData);
      
      if (!req.body.employeeData) {
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
        employeeData.work_experience.forEach((exp, index) => {
          if (fileData.experience_letter[index]) {
            exp.experience_letter = fileData.experience_letter[index];
          }
        });
      }
      
      const employee = new Employee(employeeData);
      await employee.save();
      
      res.status(201).json({
        success: true,
        data: employee
      });
    } catch (error) {
      console.error('Error creating employee:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

// Get All Employees
export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ created_at: -1 });
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
    
    // Find existing employee
    let employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Delete old files if new ones are uploaded
    if (fileData.profile_image) {
      if (employee.profile_image && employee.profile_image.public_id) {
        await deleteFromCloudinary(employee.profile_image.public_id);
      }
      employeeData.profile_image = fileData.profile_image;
    }
    
    if (fileData.aadhar_document) {
      if (employee.aadhar_document && employee.aadhar_document.public_id) {
        await deleteFromCloudinary(employee.aadhar_document.public_id);
      }
      employeeData.aadhar_document = fileData.aadhar_document;
    }
    
    if (fileData.pan_document) {
      if (employee.pan_document && employee.pan_document.public_id) {
        await deleteFromCloudinary(employee.pan_document.public_id);
      }
      employeeData.pan_document = fileData.pan_document;
    }
    
    // Handle documents
    if (fileData.resume) {
      if (employee.documents?.resume?.public_id) {
        await deleteFromCloudinary(employee.documents.resume.public_id);
      }
      employeeData.documents = employeeData.documents || {};
      employeeData.documents.resume = fileData.resume;
    }
    
    if (fileData.offer_letter) {
      if (employee.documents?.offer_letter?.public_id) {
        await deleteFromCloudinary(employee.documents.offer_letter.public_id);
      }
      employeeData.documents = employeeData.documents || {};
      employeeData.documents.offer_letter = fileData.offer_letter;
    }
    
    if (fileData.joining_letter) {
      if (employee.documents?.joining_letter?.public_id) {
        await deleteFromCloudinary(employee.documents.joining_letter.public_id);
      }
      employeeData.documents = employeeData.documents || {};
      employeeData.documents.joining_letter = fileData.joining_letter;
    }
    
    if (fileData.other_docs) {
      employeeData.documents = employeeData.documents || {};
      employeeData.documents.other_docs = [
        ...(employee.documents?.other_docs || []),
        ...fileData.other_docs
      ];
    }
    
    // Handle work experience files
    if (employeeData.work_experience && fileData.experience_letter) {
      employeeData.work_experience.forEach((exp, index) => {
        if (fileData.experience_letter[index]) {
          exp.experience_letter = fileData.experience_letter[index];
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
      data: employee
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
      if (file && file.public_id) {
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
    if (docType === 'other_docs') {
      await Employee.updateOne(
        { _id: employeeId },
        { $pull: { 'documents.other_docs': { public_id } } }
      );
    } else if (docType === 'experience_letter') {
      const expIndex = employee.work_experience.findIndex(
        exp => exp.experience_letter?.public_id === public_id
      );
      
      if (expIndex !== -1) {
        employee.work_experience[expIndex].experience_letter = null;
        await employee.save();
      }
    } else {
      const updatePath = docType.includes('.') ? 
        docType.split('.') : 
        [docType];
      
      const updateObj = {};
      updateObj[updatePath.join('.')] = null;
      
      await Employee.updateOne(
        { _id: employeeId },
        { $unset: updateObj }
      );
    }
    
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