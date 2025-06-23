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

  // Embedded Contract Agreement
  contract_agreement: {
    company: {
      name: { type: String, default: "Shine Infosolutions" },
      address: { type: String, default: "Gorakhpur UP" },
      contact: {
        phone: { type: String, default: "9876567897" },
        email: { type: String, default: "shineinfo@gmail.com" },
      },
    },
    effective_date: { type: Date },
    job_title: { type: String },
    contract_type: {
      type: String,
      enum: ['Intern', 'Full Time', 'Part Time', 'Freelance', 'Consultant', 'Contract'],
    },
    start_date: { type: Date },
    end_date: { type: Date },
    is_ongoing: { type: Boolean },

    working_hours: {
      timing: { type: String, default: "10 AM – 6 PM" },
      days_per_week: { type: Number, default: 6 },
      location: { type: String, default: "Head Office Gorahpur" },
    },

    compensation: {
      monthly_salary: { type: Number },
      salary_date: { type: String, default: "5th" },
      deductions: { type: [String], default: ['PF', 'TDS', 'Leave without pay'] },
    },

    leave_policy: {
      description: { type: String, default: "As per company policy" },
      unauthorized_absence_note: {
        type: String,
        default: "Unauthorized absences can result in salary deduction or disciplinary action.",
      },
    },

    confidentiality_clause: {
      text: {
        type: String,
        default:
          "The Employee agrees not to disclose or use any confidential information or intellectual property belonging to the Company, during or after employment.",
      },
    },

    code_of_conduct: {
      type: [String],
      default: [
        "Maintain professionalism and punctuality.",
        "Adhere to all workplace rules, policies, and directives.",
        "Avoid conflicts of interest and uphold the company’s reputation.",
      ],
    },

    termination: {
      notice_period_days: { type: Number, default: 30 },
      grounds: { type: [String], default: ['Fraud', 'Theft', 'Misconduct', 'Breach of confidentiality'] },
    },

    return_of_property_clause: {
      type: String,
      default:
        "Upon termination, the Employee must return all company-owned property including laptops, ID cards, documents, and any physical or digital assets.",
    },

    acceptance: {
      accepted: { type: Boolean, default: false },
      accepted_at: { type: Date },
      signature: { type: String },
    },
  },

  terms_and_conditions: {
    accepted: { type: Boolean, default: false },
    accepted_at: { type: Date },
    signature: { type: String },
  },
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Auto-update updated_at on save and embed contract logic
employeeSchema.pre("save", async function (next) {
  // Update timestamp
  this.updated_at = Date.now();

  // Only generate ID & fill contract for new employees
  if (this.isNew) {
    const Employee = mongoose.model("Employee");
    const latestEmployee = await Employee.findOne().sort({ created_at: -1 });
    let nextId = 1;
    if (latestEmployee?.employee_id) {
      const num = parseInt(latestEmployee.employee_id.replace('emp', ''), 10);
      if (!isNaN(num)) nextId = num + 1;
    }
    this.employee_id = `emp${String(nextId).padStart(2, '0')}`;

    // Auto-fill contract fields
    this.contract_agreement.effective_date = this.work_start_date;
    this.contract_agreement.job_title = this.designation;
    this.contract_agreement.contract_type = this.employment_type;
    this.contract_agreement.start_date = this.work_start_date;
    this.contract_agreement.is_ongoing = this.employment_type === 'Full Time';
    this.contract_agreement.compensation.monthly_salary = this.salary_details?.monthly_salary;
  }

  next();
});

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
