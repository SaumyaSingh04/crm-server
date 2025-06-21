import Handlebars from 'handlebars';

// Helper function to format dates
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

// Embedded Handlebars template
const contractTemplateSource = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Employment Contract</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
        .section { margin-bottom: 15px; }
        .section-title { font-weight: bold; margin-bottom: 5px; }
        .signature-block { margin-top: 30px; }
        .footer { text-align: center; margin-top: 40px; font-size: 0.8em; color: #666; }
        .contract-title { text-align: center; font-size: 1.5em; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h2>{{companyName}}</h2>
        <p>{{companyAddress}}</p>
        <p>Contact: {{companyContact}}</p>
        <p>Effective Date: {{effectiveDate}}</p>
    </div>

    <div class="contract-title">Employment Agreement</div>
    
    <p>This Employment Agreement ("Agreement") is made between:</p>
    <p><strong>Employer:</strong> {{companyName}}</p>
    <p><strong>And</strong></p>
    <p><strong>Employee:</strong> {{employeeName}}</p>
    <p><strong>Address:</strong> {{employeeAddress}}</p>
    <p><strong>Employee ID:</strong> {{employeeId}}</p>

    <div class="section">
        <div class="section-title">1. Position & Responsibilities</div>
        <p>The Employee agrees to serve as a {{jobTitle}}, performing all duties as assigned by the company in accordance with company standards and professional conduct.</p>
    </div>

    <div class="section">
        <div class="section-title">2. Type of Employment</div>
        <p>Employment Type: {{contractType}}</p>
        <p>This role begins on {{startDate}} and will be:</p>
        {{#if isFullTime}}
        <p>For full-time roles: Ongoing until terminated by either party.</p>
        {{else}}
        <p>Valid until {{endDate}} unless extended in writing.</p>
        {{/if}}
    </div>

    <div class="section">
        <div class="section-title">3. Working Hours & Location</div>
        <p>Working hours: {{workingHours}}, {{daysPerWeek}} per week.</p>
        <p>Work Location: {{workLocation}}.</p>
    </div>

    <div class="section">
        <div class="section-title">4. Compensation</div>
        <p>Monthly Salary: ₹{{monthlySalary}} (before deductions).</p>
        <p>Salary will be paid on or before the {{salaryDate}} of every month.</p>
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
        <p>The Employee agrees to:</p>
        <ul>
            <li>Maintain professionalism and punctuality.</li>
            <li>Adhere to all workplace rules, policies, and directives.</li>
            <li>Avoid conflicts of interest and uphold the company’s reputation.</li>
        </ul>
    </div>

    <div class="section">
        <div class="section-title">8. Termination</div>
        <p>Either party may terminate the agreement with {{noticePeriodDays}} days' written notice.</p>
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
            <li>They understand and agree to all the terms and conditions listed above.</li>
            <li>They have provided accurate information and submitted valid documents during onboarding.</li>
        </ul>
        
        <div class="signature-block">
            {{#if acceptanceDate}}
            <p>✅ Accepted on: {{acceptanceDate}}</p>
            <p>Employee Name: {{employeeName}}</p>
            {{else}}
            <p>✅ [ ] I Accept the Terms & Conditions</p>
            <p>(Signature is optional if checkbox + timestamp is used)</p>
            <p>Employee Name: {{employeeName}}</p>
            <p>Date: {{today}}</p>
            <p>Signature (if required): ___________________________</p>
            {{/if}}
        </div>
    </div>

    <div class="footer">
        <p>Generated on {{today}} | {{companyName}} Employment Agreement</p>
    </div>
</body>
</html>
`;

export const renderContractHTML = (employee) => {
  const contract = employee.contract_agreement || {};
  
  const template = Handlebars.compile(contractTemplateSource);

  const today = new Date();
  const todayFormatted = formatDate(today);

  const data = {
    companyName: contract.company?.name || 'Shine Infosolutions',
    companyAddress: contract.company?.address || 'Gorakhpur UP',
    companyContact: `${contract.company?.contact?.phone || '9876567897'} | ${contract.company?.contact?.email || 'shineinfo@gmail.com'}`,
    effectiveDate: formatDate(contract.effective_date),
    employeeName: employee.name,
    employeeAddress: employee.address,
    employeeId: employee.employee_id,
    jobTitle: contract.job_title || employee.designation || 'N/A',
    contractType: contract.contract_type || employee.employment_type || 'Full Time',
    isFullTime: (contract.contract_type || employee.employment_type) === 'Full Time',
    startDate: formatDate(contract.start_date),
    endDate: formatDate(contract.end_date),
    workingHours: contract.working_hours?.timing || '10 AM – 6 PM',
    daysPerWeek: contract.working_hours?.days_per_week || 6,
    workLocation: contract.working_hours?.location || 'Head Office Gorahpur',
    monthlySalary: contract.compensation?.monthly_salary || employee.salary_details?.monthly_salary || 0,
    salaryDate: contract.compensation?.salary_date || '5th',
    noticePeriodDays: contract.termination?.notice_period_days || 30,
    acceptanceDate: contract.acceptance?.accepted_at ? formatDate(contract.acceptance.accepted_at) : null,
    today: todayFormatted
  };

  return template(data);
};