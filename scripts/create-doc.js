document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get('category');
  const fieldsContainer = document.getElementById('categoryFields');
  const docForm = document.getElementById('docForm');

  const fieldMap = {
    business: [
      { id: 'businessName', label: 'Business Name', type: 'text' },
      { id: 'services', label: 'Services Offered', type: 'textarea' },
      { id: 'contactPersonBusiness', label: 'Contact Person', type: 'text' }
    ],
    portfolio: [
      { id: 'portfolioUrl', label: 'Portfolio URL', type: 'url' },
      { id: 'projects', label: 'Projects', type: 'textarea' },
      { id: 'contactPersonPortfolio', label: 'Contact Person', type: 'text' }
    ],
    education: [
      { id: 'schoolName', label: 'School Name', type: 'text' },
      { id: 'numStudents', label: 'Number of Students', type: 'number' }
    ],
    ecommerce: [
      { id: 'businessName', label: 'Business Name', type: 'text' },
      { id: 'products', label: 'Products Offered', type: 'textarea' },
      { id: 'contactPersonEcommerce', label: 'Contact Person', type: 'text' }
    ],
    charity: [
      { id: 'charityName', label: 'Charity Name', type: 'text' },
      { id: 'mission', label: 'Mission Statement', type: 'textarea' },
      { id: 'contactPersonCharity', label: 'Contact Person', type: 'text' }
    ],
    blog: [
      { id: 'blogName', label: 'Blog Name', type: 'text' },
      { id: 'topics', label: 'Blog Topics', type: 'textarea' },
      { id: 'contactPersonBlog', label: 'Contact Person', type: 'text' }
    ],
    healthcare: [
      { id: 'facilityName', label: 'Facility Name', type: 'text' },
      { id: 'services', label: 'Medical Services', type: 'textarea' },
      { id: 'contactPersonHealthcare', label: 'Contact Person', type: 'text' }
    ],
    event: [
      { id: 'eventName', label: 'Event Name', type: 'text' },
      { id: 'eventDetails', label: 'Event Details', type: 'textarea' },
      { id: 'contactPersonEvent', label: 'Contact Person', type: 'text' }
    ],
    church: [
      { id: 'churchName', label: 'Church Name', type: 'text' },
      { id: 'services', label: 'Services/Events', type: 'textarea' },
      { id: 'contactPersonChurch', label: 'Contact Person', type: 'text' }
    ],
    nonprofit: [
      { id: 'nonprofitName', label: 'Non-profit Name', type: 'text' },
      { id: 'mission', label: 'Mission Statement', type: 'textarea' },
      { id: 'contactPersonNonprofit', label: 'Contact Person', type: 'text' }
    ],
    other: [
      { id: 'otherName', label: 'Organization Name', type: 'text' },
      { id: 'services', label: 'Services/Products', type: 'textarea' },
      { id: 'contactPersonOther', label: 'Contact Person', type: 'text' }
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
