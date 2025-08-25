document.addEventListener('DOMContentLoaded', () => {
  // Toggle sections
  const btnTemplates = document.getElementById('btnTemplates');
  const btnSendEmail = document.getElementById('btnSendEmail');
  const sectionTemplates = document.getElementById('sectionTemplates');
  const sectionSendEmail = document.getElementById('sectionSendEmail');

  btnTemplates.addEventListener('click', () => {
    btnTemplates.classList.add('active');
    btnSendEmail.classList.remove('active');
    sectionTemplates.style.display = 'block';
    sectionSendEmail.style.display = 'none';
    fetchTemplates();
  });

  btnSendEmail.addEventListener('click', () => {
    btnSendEmail.classList.add('active');
    btnTemplates.classList.remove('active');
    sectionSendEmail.style.display = 'block';
    sectionTemplates.style.display = 'none';
  });

  // Template upload preview and form submit
  const imageFile = document.getElementById('imageFile');
  const preview = document.getElementById('imagePreview');
  const uploadForm = document.getElementById('uploadForm');
  const adminPassInput = document.getElementById('admin-pass');

  imageFile.addEventListener('change', () => {
    const file = imageFile.files[0];
    if (!file) {
      preview.innerHTML = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.innerHTML = `<img src="${e.target.result}" alt="preview" style="max-width: 100%; border-radius: 8px;">`;
    };
    reader.readAsDataURL(file);
  });

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pass = adminPassInput.value.trim();
    if (!pass) {
      alert('Enter admin password before uploading.');
      return;
    }

    const formData = new FormData(uploadForm);
    const file = imageFile.files[0];
    if (!file) {
      alert('Please select an image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageBase64 = e.target.result;
      const template = {
        name: formData.get('name'),
        category: formData.get('category'),
        link: formData.get('link'),
        image: imageBase64,
        password: pass
      };

      try {
        const response = await fetch('https://a68abc6c-3dfa-437e-b7ed-948853cc9716-00-2psgdbnpe98f6.worf.replit.dev/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(template)
        });
        const result = await response.json();
        if (response.ok) {
          alert('Template uploaded successfully!');
          uploadForm.reset();
          preview.innerHTML = '';
          fetchTemplates(); // Refresh template list
        } else {
          alert(result.error || 'Upload failed');
        }
      } catch (err) {
        console.error('Upload error', err);
        alert('Failed to upload. Check console for details.');
      }
    };
    reader.readAsDataURL(file);
  });

  // Fetch and display templates for deletion
  async function fetchTemplates() {
    try {
      const response = await fetch('https://a68abc6c-3dfa-437e-b7ed-948853cc9716-00-2psgdbnpe98f6.worf.replit.dev/api/templates');
      const templates = await response.json();
      const templateList = document.getElementById('templateList');
      templateList.innerHTML = '';

      templates.forEach(template => {
        const templateItem = document.createElement('div');
        templateItem.className = 'template-item';
        templateItem.innerHTML = `
          <img src="${template.image}" alt="${template.name}" />
          <p><strong>${template.name}</strong></p>
          <p>Category: ${template.category}</p>
          <p><a href="${template.link}" target="_blank">Preview</a></p>
          <button onclick="deleteTemplate('${template.id}')">Delete</button>
        `;
        templateList.appendChild(templateItem);
      });
    } catch (err) {
      console.error('Fetch templates error', err);
      alert('Failed to load templates. Check console for details.');
    }
  }

  // Delete template
  window.deleteTemplate = async (id) => {
    const pass = prompt('Enter admin password to delete:');
    if (!pass) {
      alert('Password required to delete.');
      return;
    }

    try {
      const response = await fetch(`https://a68abc6c-3dfa-437e-b7ed-948853cc9716-00-2psgdbnpe98f6.worf.replit.dev/api/templates/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass })
      });
      if (response.ok) {
        alert('Template deleted successfully!');
        fetchTemplates(); // Refresh template list
      } else {
        const result = await response.json();
        alert(result.error || 'Deletion failed');
      }
    } catch (err) {
      console.error('Delete error', err);
      alert('Failed to delete. Check console for details.');
    }
  };

  // Send email form logic
  const emailForm = document.getElementById('emailForm');
  emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    emailjs.init('YOUR_EMAILJS_USER_ID'); // Replace with your EmailJS user ID

    const templateParams = {
      to_email: emailForm.customerEmail.value,
      custom_link: emailForm.customLink.value,
      price: emailForm.price.value,
      currency: emailForm.currency.value
    };

    try {
      const response = await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams);
      alert('Email sent successfully!');
      emailForm.reset();
    } catch (error) {
      console.error('Email send error:', error);
      alert('Failed to send email. Check console for details.');
    }
  });

  // Load templates on page load
  fetchTemplates();
});
