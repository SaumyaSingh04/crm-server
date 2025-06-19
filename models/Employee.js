import mongoose from "mongoose";

const workExperienceSchema = new mongoose.Schema({
  company_name: String,
  role: String,
  duration: String,
  experience_letter: {
    public_id: String,
    url: String
  }
});

const salaryDetailsSchema = new mongoose.Schema({
  monthly_salary: Number,
  bank_account_number: String,
  ifsc_code: String,
  bank_name: String,
  pf_account_number: String
});

const documentsSchema = new mongoose.Schema({
  resume: { public_id: String, url: String },
  offer_letter: { public_id: String, url: String },
  joining_letter: { public_id: String, url: String },
  other_docs: [{
    public_id: String,
    url: String
  }]
});

const employeeSchema = new mongoose.Schema({
  employee_id: { type: String, unique: true },
  name: { type: String, required: true },
  profile_image: {
    public_id: String,
    url: String
  },
  password: { type: String, required: true },
  
  contact1: { type: String, required: true },
  contact2: String,
  email: { type: String, required: true, unique: true },
  
  address: String,
  city: String,
  state: String,
  pincode: String,
  
  aadhar_number: String,
  aadhar_document: {
    public_id: String,
    url: String
  },
  pan_number: String,
  pan_document: {
    public_id: String,
    url: String
  },
  
  work_start_date: Date,
  tenure: String,
  employment_type: {
    type: String,
    enum: ['Intern', 'Full Time', 'Part Time', 'Freelance', 'Consultant', 'Contract'],
    default: 'Full Time'
  },
  is_current_employee: { type: Boolean, default: true },
  
  work_experience: [workExperienceSchema],

  designation: String,
  department: String,
  reporting_manager: String,
  employee_status: {
    type: String,
    enum: ['Active', 'On Leave', 'Resigned', 'Terminated'],
    default: 'Active'
  },
  
  salary_details: salaryDetailsSchema,

  documents: documentsSchema,

  notes: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

employeeSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
