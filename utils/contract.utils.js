import Handlebars from "handlebars";

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const contractTemplateSource = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Employment Contract</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Times New Roman', serif;
      font-size: 11px;
    }

    body {
      background: #fff;
      padding: 10px;
    }

    .contract-container {
  width: 100%;
  max-width: 740px; /* changed from 700px */
  margin: auto;
  border: 1px solid #d1d5db;
  padding: 12px;
}
    .contract-header {
      background: #5a4fff;
      color: white;
      text-align: center;
      padding: 10px 6px;
      margin-bottom: 12px;
    }

    .contract-header h1 {
      font-size: 16px;
      margin-bottom: 4px;
    }

    .header-details {
      font-size: 10px;
    }

    .contract-title {
      text-align: center;
      font-weight: bold;
      font-size: 14px;
      text-decoration: underline;
      margin: 8px 0;
    }

.parties {
  font-size: 0; /* fix inline-block spacing */
  margin: 10px 0;
}

.party {
  display: inline-block;
  width: 48%;
  vertical-align: top;
  background: #f9fafb;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 10px; /* reset child font-size */
  box-sizing: border-box;
  margin-right: 2%; /* optional spacing */
}
.party:last-child {
  margin-right: 0;
}

    .party-title {
      font-weight: bold;
      color: #5a4fff;
      margin-bottom: 4px;
    }

    .section {
      margin-bottom: 8px;
    }

    .section-title {
      font-weight: bold;
      font-size: 12px;
      border-bottom: 1px solid #5a4fff;
      margin-bottom: 4px;
    }

    p, li {
      margin: 3px 0;
      line-height: 1.4;
    }

    ul {
      padding-left: 16px;
    }

    ul li {
      margin-bottom: 3px;
    }

    .signature-line {
      margin-top: 5px;
      border-top: 1px solid #ccc;
      padding-top: 4px;
      font-size: 9.5px;
    }

    .footer {
      text-align: center;
      font-size: 8.5px;
      margin-top: 8px;
      padding-top: 4px;
      color: #777;
      border-top: 1px solid #ddd;
    }

    .checkbox {
      font-size: 11px;
      margin-top: 8px;
    }

  </style>
</head>
<body>
  <div class="contract-container">
    <div class="contract-header">
      <h1>{{companyName}}</h1>
      <div class="header-details">
        <p>{{companyAddress}}</p>
        <p>Contact: {{companyContact}}</p>
        <p><strong>Effective Date:</strong> {{effectiveDate}}</p>
      </div>
    </div>

    <div class="contract-title">Employment Contract Agreement</div>
    <p>This Employment Agreement ("Agreement") is made between:</p>

    <div class="parties">
  <div class="party">
    <div class="party-title">Employer</div>
    <p><strong>{{companyName}}</strong></p>
    <p>{{companyAddress}}</p>
    <p>Contact: {{companyContact}}</p>
  </div>
  <div class="party">
    <div class="party-title">Employee</div>
    <p><strong>{{employeeName}}</strong></p>
    <p>{{employeeAddress}}</p>
    <p>Employee ID: {{employeeId}}</p>
  </div>
</div>

    <div class="section">
      <div class="section-title">1. Position & Responsibilities</div>
      <p>The Employee agrees to serve as a <strong>{{jobTitle}}</strong>, performing all duties as assigned by the company in accordance with company standards and professional conduct.</p>
    </div>

    <div class="section">
      <div class="section-title">2. Type of Employment</div>
      <p><strong>Employment Type:</strong> {{contractType}}</p>
      <p>This role begins on <strong>{{startDate}}</strong> and will be:</p>
      {{#if isFullTime}}
        <p>For full-time roles: Ongoing until terminated by either party.</p>
      {{else}}
        <p>For internships or freelance roles: Valid until <strong>{{endDate}}</strong> unless extended in writing.</p>
      {{/if}}
    </div>

    <div class="section">
      <div class="section-title">3. Working Hours & Location</div>
      <p><strong>Working hours:</strong> {{workingHours}}, {{daysPerWeek}} days per week.</p>
      <p><strong>Work Location:</strong> {{workLocation}}</p>
    </div>

    <div class="section">
      <div class="section-title">4. Compensation</div>
      <p><strong>Monthly Salary:</strong> ₹{{monthlySalary}} (before deductions).</p>
      <p>Salary will be paid on or before the <strong>{{salaryDate}}</strong> of every month.</p>
      <p>Deductions (PF, TDS, Leave without pay) will apply as per company policy.</p>
    </div>

    <div class="section">
      <div class="section-title">5. Leave Policy</div>
      <p>Annual leave entitlement and procedure will follow the company’s leave policy.</p>
      <p>Unauthorized absences can result in salary deduction or disciplinary action.</p>
    </div>

    <div class="section">
      <div class="section-title">6. Confidentiality Clause</div>
      <p>The Employee agrees not to disclose or use any confidential information or intellectual property belonging to the Company, during or after employment.</p>
    </div>

    <div class="section">
      <div class="section-title">7. Code of Conduct</div>
      <ul>
        <li>Maintain professionalism and punctuality</li>
        <li>Adhere to all workplace rules, policies, and directives</li>
        <li>Avoid conflicts of interest and uphold the company’s reputation</li>
      </ul>
    </div>

    <div class="section">
      <div class="section-title">8. Termination</div>
      <p>Either party may terminate the agreement with {{noticePeriodDays}} days’ written notice.</p>
      <p>Grounds for immediate termination include fraud, theft, misconduct, or breach of confidentiality.</p>
    </div>

    <div class="section">
      <div class="section-title">9. Return of Property</div>
      <p>Upon termination, the Employee must return all company-owned property including laptops, ID cards, documents, and any physical or digital assets.</p>
    </div>

    <div class="section">
      <div class="section-title">10. Acceptance & Acknowledgement</div>
      <p>By signing this agreement or clicking "Accept" below, the Employee confirms that:</p>
      <ul>
        <li>They understand and agree to all the terms and conditions listed above</li>
        <li>They have provided accurate information and submitted valid documents during onboarding</li>
      </ul>
      <div class="checkbox">
        ✅ [ ] I Accept the Terms & Conditions
      </div>
      <div class="signature-line">
        <p>Employee Name: {{employeeName}}</p>
        <p>Date: {{today}}</p>
        <p>Signature: ___________________________</p>
      </div>
    </div>

    <div class="footer">
      Generated on {{today}} | {{companyName}} | Confidential
    </div>
  </div>
</body>
</html>
`;

export const renderContractHTML = (employee) => {
  const contract = employee.contract_agreement || {};
  const template = Handlebars.compile(contractTemplateSource);
  const todayFormatted = formatDate(new Date());

  const data = {
    companyName: contract.company?.name || "Shine Infosolutions",
    companyAddress: contract.company?.address || "Gorakhpur, UP",
    companyContact: `${contract.company?.contact?.phone || "9876567897"} | ${
      contract.company?.contact?.email || "shineinfo@gmail.com"
    }`,
    effectiveDate: formatDate(contract.effective_date),
    employeeName: employee.name,
    employeeAddress: employee.address,
    employeeId: employee.employee_id,
    jobTitle: contract.job_title || employee.designation || "Software Engineer",
    contractType: contract.contract_type || employee.employment_type || "Full Time",
    isFullTime: (contract.contract_type || employee.employment_type) === "Full Time",
    startDate: formatDate(contract.start_date),
    endDate: formatDate(contract.end_date),
    workingHours: contract.working_hours?.timing || "10 AM – 6 PM",
    daysPerWeek: contract.working_hours?.days_per_week || 6,
    workLocation: contract.working_hours?.location || "Head Office, Gorakhpur",
    monthlySalary:
      contract.compensation?.monthly_salary ||
      employee.salary_details?.monthly_salary ||
      0,
    salaryDate: contract.compensation?.salary_date || "5th",
    noticePeriodDays: contract.termination?.notice_period_days || 30,
    acceptanceDate: contract.acceptance?.accepted_at
      ? formatDate(contract.acceptance.accepted_at)
      : null,
    today: todayFormatted,
  };

  return template(data);
};
