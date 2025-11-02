document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  let category = urlParams.get('category');
  category = category ? category.toLowerCase() : null;
  const fieldsContainer = document.getElementById('categoryFields');
  const docForm = document.getElementById('docForm');

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
    ],
    blog: [
      { id: 'blogName', label: 'Blog Name', type: 'text' },
      { id: 'topics', label: 'Blog Topics', type: 'textarea' },
      { id: 'contactPersonBlog', label: 'Contact Person', type: 'text' },
      { id: 'postingFrequency', label: 'Posting Frequency', type: 'text' },
      { id: 'nicheFocus', label: 'Niche Focus', type: 'text' },
      { id: 'monetizationPlans', label: 'Monetization Plans', type: 'textarea' },
      { id: 'authorBio', label: 'Author Bio', type: 'textarea' },
      { id: 'relatedCategories', label: 'Related Categories', type: 'textarea' },
      { id: 'vision', label: 'Vision', type: 'textarea' },
      { id: 'partners', label: 'Partners (if any)', type: 'textarea' },
      { id: 'numStaff', label: 'Number of Staff/Contributors', type: 'number' },
      { id: 'additionalInfo', label: 'More About Your Blog', type: 'textarea' }
    ],
    healthcare: [
      { id: 'facilityName', label: 'Facility Name', type: 'text' },
      { id: 'services', label: 'Medical Services', type: 'textarea' },
      { id: 'contactPersonHealthcare', label: 'Contact Person', type: 'text' },
      { id: 'specialties', label: 'Specialties', type: 'textarea' },
      { id: 'certifications', label: 'Certifications', type: 'textarea' },
      { id: 'patientResources', label: 'Patient Resources', type: 'textarea' },
      { id: 'emergencyContacts', label: 'Emergency Contacts', type: 'textarea' },
      { id: 'vision', label: 'Vision', type: 'textarea' },
      { id: 'partners', label: 'Partners (if any)', type: 'textarea' },
      { id: 'numStaff', label: 'Number of Staff', type: 'number' },
      { id: 'additionalInfo', label: 'More About Your Facility', type: 'textarea' }
    ],
    event: [
      { id: 'eventName', label: 'Event Name', type: 'text' },
      { id: 'eventDetails', label: 'Event Details', type: 'textarea' },
      { id: 'contactPersonEvent', label: 'Contact Person', type: 'text' },
      { id: 'dateLocation', label: 'Date/Location', type: 'text' },
      { id: 'expectedAttendance', label: 'Expected Attendance', type: 'number' },
      { id: 'sponsorshipNeeds', label: 'Sponsorship Needs', type: 'textarea' },
      { id: 'agenda', label: 'Agenda/Schedule', type: 'textarea' },
      { id: 'registrationDetails', label: 'Registration Details', type: 'textarea' },
      { id: 'vision', label: 'Vision for the Event', type: 'textarea' },
      { id: 'partners', label: 'Partners (if any)', type: 'textarea' },
      { id: 'numStaff', label: 'Number of Staff/Volunteers', type: 'number' },
      { id: 'additionalInfo', label: 'More About the Event', type: 'textarea' }
    ],
    church: [
      { id: 'churchName', label: 'Church Name', type: 'text' },
      { id: 'services', label: 'Services/Events', type: 'textarea' },
      { id: 'contactPersonChurch', label: 'Contact Person', type: 'text' },
      { id: 'denomination', label: 'Denomination', type: 'text' },
      { id: 'membershipSize', label: 'Membership Size', type: 'number' },
      { id: 'upcomingEvents', label: 'Upcoming Events', type: 'textarea' },
      { id: 'sermonArchives', label: 'Sermon Archives', type: 'textarea' },
      { id: 'communityOutreach', label: 'Community Outreach', type: 'textarea' },
      { id: 'vision', label: 'Vision', type: 'textarea' },
      { id: 'partners', label: 'Partners (if any)', type: 'textarea' },
      { id: 'numStaff', label: 'Number of Staff/Volunteers', type: 'number' },
      { id: 'additionalInfo', label: 'More About Your Church', type: 'textarea' }
    ],
    nonprofit: [
      { id: 'nonprofitName', label: 'Non-profit Name', type: 'text' },
      { id: 'mission', label: 'Mission Statement', type: 'textarea' },
      { id: 'contactPersonNonprofit', label: 'Contact Person', type: 'text' },
      { id: 'legalStatus', label: 'Legal Status', type: 'text' },
      { id: 'impactMetrics', label: 'Impact Metrics', type: 'textarea' },
      { id: 'volunteerOpportunities', label: 'Volunteer Opportunities', type: 'textarea' },
      { id: 'annualReports', label: 'Annual Reports', type: 'textarea' },
      { id: 'partnershipInfo', label: 'Partnership Info', type: 'textarea' },
      { id: 'vision', label: 'Vision', type: 'textarea' },
      { id: 'partners', label: 'Partners (if any)', type: 'textarea' },
      { id: 'numStaff', label: 'Number of Staff/Volunteers', type: 'number' },
      { id: 'additionalInfo', label: 'More About Your Non-profit', type: 'textarea' }
    ],
    other: [
      { id: 'otherName', label: 'Organization Name', type: 'text' },
      { id: 'services', label: 'Services/Products', type: 'textarea' },
      { id: 'contactPersonOther', label: 'Contact Person', type: 'text' },
      { id: 'orgType', label: 'Type of Organization', type: 'text' },
      { id: 'keyGoals', label: 'Key Goals', type: 'textarea' },
      { id: 'uniqueRequirements', label: 'Unique Requirements', type: 'textarea' },
      { id: 'customSections', label: 'Custom Sections Needed', type: 'textarea' },
      { id: 'integrations', label: 'Integration Needs (e.g., forms, maps)', type: 'textarea' },
      { id: 'vision', label: 'Vision', type: 'textarea' },
      { id: 'partners', label: 'Partners (if any)', type: 'textarea' },
      { id: 'numStaff', label: 'Number of Staff', type: 'number' },
      { id: 'additionalInfo', label: 'More About Your Organization', type: 'textarea' }
    ]
  };

  if (!category || !fieldMap[category]) {
    fieldsContainer.innerHTML = '<p>Invalid category.</p>';
    return;
  }

  const fields = fieldMap[category];
  fields.forEach(field => {
    const label = document.createElement('label');
    label.setAttribute('for', field.id);
    label.textContent = field.label;
    const input = document.createElement(field.type === 'textarea' ? 'textarea' : 'input');
    input.id = field.id;
    input.name = field.id;
    input.type = field.type;
    input.required = true;
    fieldsContainer.appendChild(label);
    fieldsContainer.appendChild(input);
  });

  docForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(docForm);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let yPos = 20;
    doc.text(`Category Document: ${category.charAt(0).toUpperCase() + category.slice(1)}`, 20, yPos);
    yPos += 20;
    fields.forEach(field => {
      const value = formData.get(field.id);
      if (value) {
        doc.text(`${field.label}: ${value}`, 20, yPos);
        yPos += 20;
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
      }
    });
    doc.save(`${category}-document.pdf`);
    window.location.href = 'followup.html';
  });
});
