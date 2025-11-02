document.addEventListener('DOMContentLoaded', () => {  
  const urlParams = new URLSearchParams(window.location.search);  
  let category = urlParams.get('category');  
  if (category) category = category.trim().toLowerCase();  

  const fieldsContainer = document.getElementById('categoryFields');  
  const docForm = document.getElementById('docForm');  

  const fieldMap = {  
    business: [  
      { id: 'businessName', label: 'Business Name', type: 'text', placeholder: 'Your business legal name', guide: 'Enter the official name of your business.' },  
      { id: 'services', label: 'Services Offered', type: 'textarea', placeholder: 'e.g., Web Design, Consulting', guide: 'List all main services your business provides.' },  
      { id: 'contactPersonBusiness', label: 'Contact Person', type: 'text', placeholder: 'John Doe', guide: 'Full name of primary contact.' },  
      { id: 'industry', label: 'Industry/Sector', type: 'text', placeholder: 'e.g., Technology, Retail', guide: 'Select the industry your business operates in.' },  
      { id: 'targetMarket', label: 'Target Market', type: 'text', placeholder: 'e.g., Small businesses, Students', guide: 'Who are your main customers?' },  
      { id: 'yearsInOperation', label: 'Years in Operation', type: 'number', placeholder: 'e.g., 5', guide: 'How long has your business been running?' },  
      { id: 'businessTagline', label: 'Business Tagline', type: 'text', placeholder: 'Your catchy tagline', guide: 'A short, memorable tagline for your business.' },  
      { id: 'vision', label: 'Vision', type: 'textarea', placeholder: 'Describe your long-term vision', guide: 'What is your ultimate goal for the business?' },  
      { id: 'partners', label: 'Partners (if any)', type: 'textarea', placeholder: 'Partner names', guide: 'List business partners, if any.' },  
      { id: 'numStaff', label: 'Number of Staff', type: 'number', placeholder: 'e.g., 15', guide: 'How many employees work in your business?' },  
      { id: 'additionalInfo', label: 'More About Your Business', type: 'textarea', placeholder: 'Any extra details', guide: 'Anything else important about your business.' }  
    ],  
    education: [  
      { id: 'schoolName', label: 'School Name', type: 'text', placeholder: 'e.g., Isaac Academy', guide: 'Enter the full name of the school.' },  
      { id: 'numStudents', label: 'Number of Students', type: 'number', placeholder: 'e.g., 200', guide: 'Current enrolled students.' },  
      { id: 'programs', label: 'Programs/Courses Offered', type: 'textarea', placeholder: 'Math, Science, English', guide: 'List major programs or courses.' },  
      { id: 'accreditation', label: 'Accreditation Status', type: 'text', placeholder: 'e.g., Nationally Accredited', guide: 'Mention accreditation details.' },  
      { id: 'enrollmentCapacity', label: 'Enrollment Capacity', type: 'number', placeholder: 'e.g., 500', guide: 'Maximum students school can accommodate.' },  
      { id: 'facultyHighlights', label: 'Faculty Highlights', type: 'textarea', placeholder: 'Experienced teachers, PhD holders', guide: 'Notable achievements or strengths of your faculty.' },  
      { id: 'admissionsProcess', label: 'Admissions Process', type: 'textarea', placeholder: 'Application, Interview, Exam', guide: 'Steps required for new students to enroll.' },  
      { id: 'vision', label: 'Vision', type: 'textarea', placeholder: 'Your school vision', guide: 'Long-term goals or mission of your school.' },  
      { id: 'partners', label: 'Partners (if any)', type: 'textarea', placeholder: 'Partner organizations', guide: 'List partners or sponsors if applicable.' },  
      { id: 'numStaff', label: 'Number of Staff', type: 'number', placeholder: 'e.g., 30', guide: 'Include teachers and admin staff.' },  
      { id: 'additionalInfo', label: 'More About Your Institution', type: 'textarea', placeholder: 'Other details', guide: 'Any extra information about your school.' }  
    ]  
    // Add other categories in the same way, each with placeholders and guides  
  };  

  if (!category || !fieldMap[category]) {  
    fieldsContainer.innerHTML = `  
      <p style="color:#ff4444; font-weight:bold;">Invalid category: "<code>${urlParams.get('category') || 'none'}</code>"</p>  
      <p>Valid options: <code>${Object.keys(fieldMap).join(', ')}</code></p>  
      <p><a href="followup.html" style="color:#4fc3f7;">Back to form</a></p>  
    `;  
    return;  
  }  

  const fields = fieldMap[category];  

  fields.forEach(f => {  
    const wrapper = document.createElement('div');  
    wrapper.style.marginBottom = '1.5rem';  

    const label = document.createElement('label');  
    label.htmlFor = f.id;  
    label.textContent = f.label;  
    label.style.display = 'block';  
    label.style.marginBottom = '0.5rem';  
    label.style.fontWeight = '600';  
    label.style.color = '#fff';  

    const input = document.createElement(f.type === 'textarea' ? 'textarea' : 'input');  
    input.id = input.name = f.id;  
    input.type = f.type;  
    input.required = true;  
    input.placeholder = f.placeholder || '';  
    if (f.type === 'textarea') input.rows = 4;  
    input.style.width = '100%';  
    input.style.padding = '12px';  
    input.style.border = '1px solid #444';  
    input.style.borderRadius = '6px';  
    input.style.backgroundColor = '#292929';  
    input.style.color = '#eee';  
    input.style.fontSize = '1rem';  
    input.style.boxSizing = 'border-box';  

    const guide = document.createElement('small');  
    guide.textContent = f.guide || '';  
    guide.style.display = 'block';  
    guide.style.marginTop = '4px';  
    guide.style.fontSize = '0.85rem';  
    guide.style.color = '#aaa';  

    wrapper.appendChild(label);  
    wrapper.appendChild(input);  
    wrapper.appendChild(guide);  
    fieldsContainer.appendChild(wrapper);  
  });  

  docForm.addEventListener('submit', e => {  
    e.preventDefault();  
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
        if (y > 280) { doc.addPage(); y = 20; }  
      }  
    });  

    doc.save(`${category}-document.pdf`);  
    setTimeout(() => location.href = `followup.html?category=${category}`, 800);  
  });  
});
