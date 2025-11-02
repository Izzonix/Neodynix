document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get('category');
  const fieldsContainer = document.getElementById('categoryFields');
  const docForm = document.getElementById('docForm');

  const fieldMap = {
    business: [
      { id: 'businessName', label: 'Business Name', type: 'text', placeholder: 'Acme Corp' },
      { id: 'description', label: 'Business Description', type: 'textarea', placeholder: 'We provide innovative solutions in tech consulting, helping startups scale efficiently.' },
      { id: 'services', label: 'Services Offered', type: 'textarea', placeholder: 'Consulting, Development, Marketing\n\n- Custom software\n- Digital strategy' },
      { id: 'industry', label: 'Industry/Sector', type: 'text', placeholder: 'Technology' },
      { id: 'targetMarket', label: 'Target Market', type: 'text', placeholder: 'Startups and SMEs' },
      { id: 'yearsOperating', label: 'Years in Operation', type: 'number', placeholder: '5' },
      { id: 'address', label: 'Business Address', type: 'text', placeholder: '123 Main St, City, Country' },
      { id: 'testimonials', label: 'Client Testimonials', type: 'textarea', placeholder: '"Great service!" - John Doe\n\n"Highly recommended." - Jane Smith' },
      { id: 'contactPerson', label: 'Contact Person', type: 'text', placeholder: 'John Doe, CEO' },
      { id: 'uniqueFeatures', label: 'Unique Website Features Needed', type: 'textarea', placeholder: 'Booking calendar, client portal' }
    ],
    portfolio: [
      { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Jane Doe' },
      { id: 'profession', label: 'Profession', type: 'text', placeholder: 'Graphic Designer' },
      { id: 'about', label: 'About Me', type: 'textarea', placeholder: 'Creative designer with 5+ years experience in branding and UI/UX.' },
      { id: 'skills', label: 'Skills/Expertise', type: 'textarea', placeholder: 'Photoshop, Illustrator, Figma\n\nHTML/CSS, JavaScript' },
      { id: 'projects', label: 'Projects (List with Descriptions)', type: 'textarea', placeholder: 'Project 1: Logo Design - Redesigned brand for startup.\n\nProject 2: Website - Built responsive site.' },
      { id: 'testimonials', label: 'Client Testimonials', type: 'textarea', placeholder: '"Outstanding work!" - Client A' },
      { id: 'contactMethod', label: 'Preferred Contact Method', type: 'text', placeholder: 'Email or LinkedIn' },
      { id: 'resumeUrl', label: 'Resume/CV URL', type: 'url', placeholder: 'https://linkedin.com/in/janedoe' },
      { id: 'uniqueFeatures', label: 'Unique Website Features Needed', type: 'textarea', placeholder: 'Project gallery, contact form' }
    ],
    education: [
      { id: 'schoolName', label: 'School/Institution Name', type: 'text', placeholder: 'ABC University' },
      { id: 'description', label: 'Institution Description', type: 'textarea', placeholder: 'Leading university offering degrees in sciences and humanities.' },
      { id: 'programs', label: 'Programs/Courses Offered', type: 'textarea', placeholder: 'Bachelor of Science in Computer Science\n\nMaster of Arts in Education' },
      { id: 'accreditation', label: 'Accreditation Status', type: 'text', placeholder: 'Accredited by National Board' },
      { id: 'numStudents', label: 'Number of Students', type: 'number', placeholder: '5000' },
      { id: 'enrollmentCapacity', label: 'Enrollment Capacity', type: 'text', placeholder: 'Annual intake: 1000' },
      { id: 'address', label: 'Address', type: 'text', placeholder: '456 Campus Rd, City' },
      { id: 'faculty', label: 'Key Faculty Highlights', type: 'textarea', placeholder: '20 PhD holders, research-focused' },
      { id: 'uniqueFeatures', label: 'Unique Website Features Needed', type: 'textarea', placeholder: 'Course catalog, admission form' }
    ],
    ecommerce: [
      { id: 'businessName', label: 'Business Name', type: 'text', placeholder: 'ShopEasy' },
      { id: 'description', label: 'Store Description', type: 'textarea', placeholder: 'Online retailer for fashion and accessories.' },
      { id: 'products', label: 'Products Offered', type: 'textarea', placeholder: 'Clothing, Shoes, Bags\n\nCategories: Men, Women, Kids' },
      { id: 'paymentMethods', label: 'Payment Methods', type: 'textarea', placeholder: 'Credit Card, PayPal, Mobile Money' },
      { id: 'shippingOptions', label: 'Shipping Options', type: 'textarea', placeholder: 'Standard (3-5 days), Express (1-2 days)' },
      { id: 'inventorySize', label: 'Inventory Size', type: 'text', placeholder: '500+ items' },
      { id: 'address', label: 'Business Address', type: 'text', placeholder: 'Warehouse: 789 Industrial Area' },
      { id: 'promotions', label: 'Promotions/Discounts', type: 'textarea', placeholder: '10% off first order, Free shipping over $50' },
      { id: 'contactPerson', label: 'Contact Person', type: 'text', placeholder: 'Support Team' },
      { id: 'uniqueFeatures', label: 'Unique Website Features Needed', type: 'textarea', placeholder: 'Shopping cart, product filters, reviews' }
    ],
    charity: [
      { id: 'charityName', label: 'Charity Name', type: 'text', placeholder: 'Hope Foundation' },
      { id: 'description', label: 'About the Charity', type: 'textarea', placeholder: 'Empowering underprivileged children through education.' },
      { id: 'mission', label: 'Mission Statement', type: 'textarea', placeholder: 'To provide access to quality education for all.' },
      { id: 'foundedYear', label: 'Founded Year', type: 'number', placeholder: '2010' },
      { id: 'keyPrograms', label: 'Key Programs', type: 'textarea', placeholder: 'Scholarships, Workshops, Mentorship' },
      { id: 'fundingSources', label: 'Funding Sources', type: 'textarea', placeholder: 'Donations, Grants, Events' },
      { id: 'impactMetrics', label: 'Impact Metrics', type: 'textarea', placeholder: 'Educated 1000+ children, 90% success rate' },
      { id: 'address', label: 'Address', type: 'text', placeholder: '101 Charity St' },
      { id: 'uniqueFeatures', label: 'Unique Website Features Needed', type: 'textarea', placeholder: 'Donation form, volunteer signup' }
    ],
    blog: [
      { id: 'blogName', label: 'Blog Name', type: 'text', placeholder: 'Tech Insights' },
      { id: 'description', label: 'Blog Description', type: 'textarea', placeholder: 'Daily updates on technology trends.' },
      { id: 'topics', label: 'Blog Topics', type: 'textarea', placeholder: 'AI, Gadgets, Coding Tutorials' },
      { id: 'postingFrequency', label: 'Posting Frequency', type: 'text', placeholder: 'Weekly' },
      { id: 'nicheFocus', label: 'Niche Focus', type: 'text', placeholder: 'Technology' },
      { id: 'monetization', label: 'Monetization Plans', type: 'textarea', placeholder: 'Ads, Sponsorships, Affiliate links' },
      { id: 'authorBio', label: 'Author Bio', type: 'textarea', placeholder: 'Experienced tech writer with 10 years in industry.' },
      { id: 'address', label: 'Contact Address/Email', type: 'text', placeholder: 'blog@techinsights.com' },
      { id: 'uniqueFeatures', label: 'Unique Website Features Needed', type: 'textarea', placeholder: 'Comment system, newsletter signup' }
    ],
    healthcare: [
      { id: 'facilityName', label: 'Facility Name', type: 'text', placeholder: 'City Clinic' },
      { id: 'description', label: 'Facility Description', type: 'textarea', placeholder: 'Comprehensive healthcare services for families.' },
      { id: 'services', label: 'Medical Services', type: 'textarea', placeholder: 'General Checkups, Vaccinations, Emergency Care' },
      { id: 'specialties', label: 'Specialties', type: 'textarea', placeholder: 'Cardiology, Pediatrics' },
      { id: 'certifications', label: 'Certifications', type: 'text', placeholder: 'ISO Certified, Licensed by Health Board' },
      { id: 'appointmentSystem', label: 'Appointment System', type: 'text', placeholder: 'Online booking available' },
      { id: 'address', label: 'Address', type: 'text', placeholder: '202 Health Ave' },
      { id: 'doctors', label: 'Key Doctors/Staff', type: 'textarea', placeholder: 'Dr. Smith - General Physician' },
      { id: 'uniqueFeatures', label: 'Unique Website Features Needed', type: 'textarea', placeholder: 'Appointment scheduler, patient portal' }
    ],
    event: [
      { id: 'eventName', label: 'Event Name', type: 'text', placeholder: 'Annual Tech Conference' },
      { id: 'description', label: 'Event Description', type: 'textarea', placeholder: 'Gathering for tech innovators and speakers.' },
      { id: 'eventDetails', label: 'Event Details (Date, Time, Venue)', type: 'textarea', placeholder: 'Date: Dec 15, 2025\nTime: 9AM-5PM\nVenue: Convention Center' },
      { id: 'expectedAttendance', label: 'Expected Attendance', type: 'number', placeholder: '500' },
      { id: 'sponsorshipNeeds', label: 'Sponsorship Needs', type: 'textarea', placeholder: 'Booths, Speakers, Catering' },
      { id: 'agenda', label: 'Agenda/Itinerary', type: 'textarea', placeholder: '9AM: Keynote\n11AM: Workshops' },
      { id: 'contactPerson', label: 'Contact Person', type: 'text', placeholder: 'Event Coordinator' },
      { id: 'tickets', label: 'Ticket Info', type: 'text', placeholder: '$50 early bird' },
      { id: 'uniqueFeatures', label: 'Unique Website Features Needed', type: 'textarea', placeholder: 'Registration form, live stream' }
    ],
    church: [
      { id: 'churchName', label: 'Church Name', type: 'text', placeholder: 'Grace Community Church' },
      { id: 'description', label: 'Church Description', type: 'textarea', placeholder: 'A welcoming place for worship and fellowship.' },
      { id: 'services', label: 'Services/Events', type: 'textarea', placeholder: 'Sunday Worship 10AM, Bible Study Wednesdays' },
      { id: 'denomination', label: 'Denomination', type: 'text', placeholder: 'Evangelical' },
      { id: 'membershipSize', label: 'Membership Size', type: 'number', placeholder: '300' },
      { id: 'upcomingEvents', label: 'Upcoming Events', type: 'textarea', placeholder: 'Christmas Service Dec 25' },
      { id: 'address', label: 'Address', type: 'text', placeholder: '777 Faith Rd' },
      { id: 'leadership', label: 'Leadership Team', type: 'textarea', placeholder: 'Pastor John - Senior Pastor' },
      { id: 'uniqueFeatures', label: 'Unique Website Features Needed', type: 'textarea', placeholder: 'Event calendar, donation portal' }
    ],
    nonprofit: [
      { id: 'nonprofitName', label: 'Non-profit Name', type: 'text', placeholder: 'Green Earth NGO' },
      { id: 'description', label: 'About the Non-profit', type: 'textarea', placeholder: 'Dedicated to environmental conservation.' },
      { id: 'mission', label: 'Mission Statement', type: 'textarea', placeholder: 'Protecting ecosystems for future generations.' },
      { id: 'legalStatus', label: 'Legal Status', type: 'text', placeholder: 'Registered 501(c)(3)' },
      { id: 'impactMetrics', label: 'Impact Metrics', type: 'textarea', placeholder: 'Planted 10,000 trees, Saved 5 habitats' },
      { id: 'volunteerOpportunities', label: 'Volunteer Opportunities', type: 'textarea', placeholder: 'Tree planting events, Office help' },
      { id: 'address', label: 'Address', type: 'text', placeholder: '303 Eco St' },
      { id: 'funding', label: 'Funding Sources', type: 'textarea', placeholder: 'Grants, Crowdfunding' },
      { id: 'uniqueFeatures', label: 'Unique Website Features Needed', type: 'textarea', placeholder: 'Volunteer signup, impact dashboard' }
    ],
    other: [
      { id: 'orgName', label: 'Organization Name', type: 'text', placeholder: 'Custom Org' },
      { id: 'type', label: 'Type of Organization', type: 'text', placeholder: 'Community Group' },
      { id: 'description', label: 'Description', type: 'textarea', placeholder: 'Brief overview of your organization.' },
      { id: 'services', label: 'Services/Products', type: 'textarea', placeholder: 'Custom services here' },
      { id: 'goals', label: 'Key Goals', type: 'textarea', placeholder: 'Achieve X, Y, Z in next year' },
      { id: 'uniqueRequirements', label: 'Unique Requirements', type: 'textarea', placeholder: 'Special needs for website' },
      { id: 'address', label: 'Address', type: 'text', placeholder: 'Your address' },
      { id: 'contactPerson', label: 'Contact Person', type: 'text', placeholder: 'Your name' },
      { id: 'targetAudience', label: 'Target Audience', type: 'text', placeholder: 'Local community' },
      { id: 'uniqueFeatures', label: 'Unique Website Features Needed', type: 'textarea', placeholder: 'Custom sections, integrations' }
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
    if (field.placeholder) input.placeholder = field.placeholder;
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
