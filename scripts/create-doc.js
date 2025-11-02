document.addEventListener('DOMContentLoaded', () => {
  // Get category from URL
  const urlParams = new URLSearchParams(window.location.search);
  let category = urlParams.get('category');

  console.log('Category from URL:', category);

  const fieldsContainer = document.getElementById('categoryFields');
  const docForm = document.getElementById('docForm');

  if (category) category = category.trim().toLowerCase();

  // Mapping of fields per category with placeholders
  const fieldMap = {
    business: [
      { id: 'businessName', label: 'Business Name', type: 'text', placeholder: 'Enter your business name' },
      { id: 'services', label: 'Services Offered', type: 'textarea', placeholder: 'List the services your business offers' },
      { id: 'contactPersonBusiness', label: 'Contact Person', type: 'text', placeholder: 'Enter full name of contact person' },
      { id: 'industry', label: 'Industry/Sector', type: 'text', placeholder: 'E.g., Technology, Retail, Education' },
      { id: 'targetMarket', label: 'Target Market', type: 'text', placeholder: 'Describe your target customers' },
      { id: 'yearsInOperation', label: 'Years in Operation', type: 'number', placeholder: 'Enter number of years' },
      { id: 'businessTagline', label: 'Business Tagline', type: 'text', placeholder: 'Your slogan or tagline' },
      { id: 'vision', label: 'Vision', type: 'textarea', placeholder: 'Describe your business vision' },
      { id: 'partners', label: 'Partners (if any)', type: 'textarea', placeholder: 'List business partners if applicable' },
      { id: 'numStaff', label: 'Number of Staff', type: 'number', placeholder: 'Enter number of employees' },
      { id: 'additionalInfo', label: 'More About Your Business', type: 'textarea', placeholder: 'Add any additional information' }
    ],
    portfolio: [
      { id: 'portfolioUrl', label: 'Portfolio URL', type: 'url', placeholder: 'Enter the URL of your portfolio' },
      { id: 'projects', label: 'Projects', type: 'textarea', placeholder: 'Describe your projects or work samples' },
      { id: 'contactPersonPortfolio', label: 'Contact Person', type: 'text', placeholder: 'Enter full name of contact person' },
      { id: 'skills', label: 'Skills/Expertise', type: 'textarea', placeholder: 'List your skills or expertise areas' },
      { id: 'testimonials', label: 'Client Testimonials', type: 'textarea', placeholder: 'Add testimonials from clients if available' },
      { id: 'contactMethod', label: 'Preferred Contact Method', type: 'text', placeholder: 'E.g., email, phone' },
      { id: 'featuredProject', label: 'Featured Project', type: 'text', placeholder: 'Highlight your key project' },
      { id: 'vision', label: 'Vision', type: 'textarea', placeholder: 'Describe your vision as a professional' },
      { id: 'partners', label: 'Partners/Collaborators (if any)', type: 'textarea', placeholder: 'List collaborators or partners' },
      { id: 'numStaff', label: 'Number of Staff (if applicable)', type: 'number', placeholder: 'Enter number of contributors if applicable' },
      { id: 'additionalInfo', label: 'More About Yourself', type: 'textarea', placeholder: 'Add any extra information about yourself' }
    ],
    education: [
      { id: 'schoolName', label: 'School Name', type: 'text', placeholder: 'Enter the full name of the school' },
      { id: 'numStudents', label: 'Number of Students', type: 'number', placeholder: 'Enter total number of students' },
      { id: 'programs', label: 'Programs/Courses Offered', type: 'textarea', placeholder: 'List the programs or courses offered' },
      { id: 'accreditation', label: 'Accreditation Status', type: 'text', placeholder: 'Enter accreditation details' },
      { id: 'enrollmentCapacity', label: 'Enrollment Capacity', type: 'number', placeholder: 'Maximum number of students allowed' },
      { id: 'facultyHighlights', label: 'Faculty Highlights', type: 'textarea', placeholder: 'Briefly highlight notable faculty members' },
      { id: 'admissionsProcess', label: 'Admissions Process', type: 'textarea', placeholder: 'Describe how students are admitted' },
      { id: 'vision', label: 'Vision', type: 'textarea', placeholder: 'Enter the vision of the institution' },
      { id: 'partners', label: 'Partners (if any)', type: 'textarea', placeholder: 'Mention any partner institutions or organizations' },
      { id: 'numStaff', label: 'Number of Staff', type: 'number', placeholder: 'Enter total staff count' },
      { id: 'additionalInfo', label: 'More About Your Institution', type: 'textarea', placeholder: 'Add any other relevant details' }
    ]
    // Add other categories similarly with placeholder texts
  };

  // Validate category
  if (!category || !fieldMap[category]) {
    fieldsContainer.innerHTML = `
      <p style="color:#ff4444; font-weight:bold;">Invalid category: "<code>${urlParams.get('category') || 'none'}</code>"</p>
      <p>Valid options: <code>${Object.keys(fieldMap).join(', ')}</code></p>
      <p><a href="followup.html" style="color:#4fc3f7;">Back to form</a></p>
    `;
    return;
  }

  const fields = fieldMap[category];

  // Generate form fields dynamically with placeholders
  fields.forEach(f => {
    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '1.5rem';
    wrapper.style.padding = '0 5px';

    const label = document.createElement('label');
    label.htmlFor = f.id;
    label.textContent = f.label;

    const input = document.createElement(f.type === 'textarea' ? 'textarea' : 'input');
    input.id = input.name = f.id;
    if (f.type !== 'textarea') input.type = f.type;
    input.placeholder = f.placeholder;
    input.required = true;
    if (f.type === 'textarea') input.rows = 4;

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    fieldsContainer.appendChild(wrapper);
  });

  // Handle form submission
  docForm.addEventListener('submit', e => {
    e.preventDefault(); // prevent page reload

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(16);
    doc.text(`${category.charAt(0).toUpperCase() + category.slice(1)} Document`, 20, y);
    y += 20;

    const formData = new FormData(docForm);

    fields.forEach(f => {
      const val = formData.get(f.id)?.trim();
      if (val) {
        doc.setFontSize(12);
        const lines = doc.splitTextToSize(`${f.label}: ${val}`, 170);
        doc.text(lines, 20, y);
        y += lines.length * 7 + 5;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      }
    });

    // Download PDF
    doc.save(`${category}-document.pdf`);
  });
});
