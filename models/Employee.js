import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  employee_id: { type: String, unique: true },
  name: { type: String, required: true },
  profile_image: {
    public_id: String,
    url: String,
  },
  password: { type: String, required: true },

  contact1: { type: String, required: true },
  contact2: { type: String },
  email: { type: String, required: true, unique: true },

  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },

  aadhar_number: { type: String },
  aadhar_document: {
    public_id: String,
    url: String,
  },
  pan_number: { type: String },
  pan_document: {
    public_id: String,
    url: String,
  },

  work_start_date: { type: Date },
  tenure: { type: String },
  employment_type: {
    type: String,
    enum: ['Intern', 'Full Time', 'Part Time', 'Freelance', 'Consultant', 'Contract'],
    default: 'Full Time',
  },
  is_current_employee: { type: Boolean, default: true },

  work_experience: [
    {
      company_name: String,
      role: String,
      duration: String,
      experience_letter: {
        public_id: String,
        url: String,
      },
    },
  ],

  designation: { type: String },
  department: { type: String },
  reporting_manager: { type: String },

  employee_status: {
    type: String,
    enum: ['Active', 'On Leave', 'Resigned', 'Terminated'],
    default: 'Active',
  },

  salary_details: {
    monthly_salary: Number,
    bank_account_number: String,
    ifsc_code: String,
    bank_name: String,
    pf_account_number: String,
  },

  documents: {
    resume: {
      public_id: String,
      url: String,
    },
    offer_letter: {
      public_id: String,
      url: String,
    },
    joining_letter: {
      public_id: String,
      url: String,
    },
    other_docs: [
      {
        public_id: String,
        url: String,
      },
    ],
  },

  notes: { type: String },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Auto-update updated_at on save
employeeSchema.pre("save", async function (next) {
  // Update timestamp
  this.updated_at = Date.now();
  
  // Only generate ID for new employees
  if (!this.isNew) return next();
  
  try {
    // Find the latest employee
    const latestEmployee = await Employee.findOne().sort({ created_at: -1 });
     // Generate next ID
     let nextId = 1;
     if (latestEmployee && latestEmployee.employee_id) {
       const lastNum = parseInt(latestEmployee.employee_id.replace('emp', ''));
       if (!isNaN(lastNum)) nextId = lastNum + 1;
     }
     
     // Format ID with leading zeros
     this.employee_id = `emp${nextId.toString().padStart(2, '0')}`;
     next();
   } catch (error) {
     next(error);
   }
 });

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
