document.addEventListener('DOMContentLoaded', () => {
  // Get category from URL
  const urlParams = new URLSearchParams(window.location.search);
  let category = urlParams.get('category');

  console.log('Category from URL:', category);

  const fieldsContainer = document.getElementById('categoryFields');
  const docForm = document.getElementById('docForm');

  if (category) category = category.trim().toLowerCase();

  // Mapping of fields per category
  const fieldMap = {
    business: [
      { id: 'businessName', label: 'Business Name', type: 'text' },
      { id: 'services', label: 'Services Offered', type: 'textarea' },
      { id: 'contactPersonBusiness', label: 'Contact Person', type: 'text' },
      { id: 'industry', label: 'Industry/Sector', type: 'text' },
      { id: 'targetMarket', label: 'Target Market', type: 'text' },
      { id: 'yearsInOperation', label: 'Years in Operation', type: 'number' },
      { id: 'businessTagline', label: 'Business Tagline', type: 'text' },
      { id: 'vision', label: 'Vision', type: 'textarea' },
      { id: 'partners', label: 'Partners (if any)', type: 'textarea' },
      { id: 'numStaff', label: 'Number of Staff', type: 'number' },
      { id: 'additionalInfo', label: 'More About Your Business', type: 'textarea' }
    ],
    portfolio: [
      { id: 'portfolioUrl', label: 'Portfolio URL', type: 'url' },
      { id: 'projects', label: 'Projects', type: 'textarea' },
      { id: 'contactPersonPortfolio', label: 'Contact Person', type: 'text' },
      { id: 'skills', label: 'Skills/Expertise', type: 'textarea' },
      { id: 'testimonials', label: 'Client Testimonials', type: 'textarea' },
      { id: 'contactMethod', label: 'Preferred Contact Method', type: 'text' },
      { id: 'featuredProject', label: 'Featured Project', type: 'text' },
      { id: 'vision', label: 'Vision', type: 'textarea' },
      { id: 'partners', label: 'Partners/Collaborators (if any)', type: 'textarea' },
      { id: 'numStaff', label: 'Number of Staff (if applicable)', type: 'number' },
      { id: 'additionalInfo', label: 'More About Yourself', type: 'textarea' }
    ],
    education: [
      { id: 'schoolName', label: 'School Name', type: 'text' },
      { id: 'numStudents', label: 'Number of Students', type: 'number' },
      { id: 'programs', label: 'Programs/Courses Offered', type: 'textarea' },
      { id: 'accreditation', label: 'Accreditation Status', type: 'text' },
      { id: 'enrollmentCapacity', label: 'Enrollment Capacity', type: 'number' },
      { id: 'facultyHighlights', label: 'Faculty Highlights', type: 'textarea' },
      { id: 'admissionsProcess', label: 'Admissions Process', type: 'textarea' },
      { id: 'vision', label: 'Vision', type: 'textarea' },
      { id: 'partners', label: 'Partners (if any)', type: 'textarea' },
      { id: 'numStaff', label: 'Number of Staff', type: 'number' },
      { id: 'additionalInfo', label: 'More About Your Institution', type: 'textarea' }
    ],
    ecommerce: [
      { id: 'businessName', label: 'Business Name', type: 'text' },
      { id: 'products', label: 'Products Offered', type: 'textarea' },
      { id: 'contactPersonEcommerce', label: 'Contact Person', type: 'text' },
      { id: 'paymentMethods', label: 'Payment Methods', type: 'textarea' },
      { id: 'shippingOptions', label: 'Shipping Options', type: 'textarea' },
      { id: 'inventorySize', label: 'Inventory Size', type: 'number' },
      { id: 'productCategories', label: 'Product Categories', type: 'textarea' },
      { id: 'returnPolicy', label: 'Return Policy', type: 'textarea' },
      { id: 'vision', label: 'Vision', type: 'textarea' },
      { id: 'partners', label: 'Partners (if any)', type: 'textarea' },
      { id: 'numStaff', label: 'Number of Staff', type: 'number' },
      { id: 'additionalInfo', label: 'More About Your Business', type: 'textarea' }
    ],
    charity: [
      { id: 'charityName', label: 'Charity Name', type: 'text' },
      { id: 'mission', label: 'Mission Statement', type: 'textarea' },
      { id: 'contactPersonCharity', label: 'Contact Person', type: 'text' },
      { id: 'foundedYear', label: 'Founded Year', type: 'number' },
      { id: 'keyPrograms', label: 'Key Programs', type: 'textarea' },
      { id: 'fundingSources', label: 'Funding Sources', type: 'textarea' },
      { id: 'successStories', label: 'Success Stories', type: 'textarea' },
      { id: 'donationGoals', label: 'Donation Goals', type: 'textarea' },
      { id: 'vision', label: 'Vision', type: 'textarea' },
      { id: 'partners', label: 'Partners (if any)', type: 'textarea' },
      { id: 'numStaff', label: 'Number of Staff/Volunteers', type: 'number' },
      { id: 'additionalInfo', label: 'More About Your Charity', type: 'textarea' }
    ]
    // Add other categories as needed
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

  // Generate form fields dynamically
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
