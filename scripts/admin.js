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
        const response = await fetch('https://<your-replit-username>.repl.co/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(template)
        });
        const result = await response.json();
        if (response.ok) {
          alert('Template uploaded successfully!');
          uploadForm.reset();
          preview.innerHTML = '';
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
});
