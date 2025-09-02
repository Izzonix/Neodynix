import { supabase, supabaseUrl } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  // ----- Tab switching -----
  const btnTemplates = document.getElementById('btnTemplates');
  const btnSendEmail = document.getElementById('btnSendEmail');
  const sectionTemplates = document.getElementById('sectionTemplates');
  const sectionSendEmail = document.getElementById('sectionSendEmail');

  function showSection(section) {
    btnTemplates.classList.remove('active');
    btnSendEmail.classList.remove('active');
    sectionTemplates.style.display = 'none';
    sectionSendEmail.style.display = 'none';
    if (section === 'templates') {
      btnTemplates.classList.add('active');
      sectionTemplates.style.display = 'block';
    } else if (section === 'email') {
      btnSendEmail.classList.add('active');
      sectionSendEmail.style.display = 'block';
    }
  }

  btnTemplates.addEventListener('click', () => {
    console.log('Templates button clicked');
    showSection('templates');
  });
  btnSendEmail.addEventListener('click', () => {
    console.log('Send Email button clicked');
    showSection('email');
  });

  showSection('templates');

  // ----- Image preview -----
  const imageFile = document.getElementById('imageFile');
  const preview = document.getElementById('imagePreview');
  const uploadForm = document.getElementById('uploadForm');
  const result = document.getElementById('result');

  imageFile.addEventListener('change', () => {
    const file = imageFile.files[0];
    if (!file) {
      preview.innerHTML = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.innerHTML = `<img src="${e.target.result}" alt="preview" style="max-width: 100%; border-radius: 6px;">`;
    };
    reader.readAsDataURL(file);
  });

  // ----- Upload template -----
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(uploadForm);
    const file = imageFile.files[0];

    if (!file) {
      showResult('Please select a file.', 'error');
      return;
    }

    try {
      showResult('Uploading file...', 'info');
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from('templates')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });
      if (storageError) throw new Error(`Storage upload failed: ${storageError.message}`);

      const imageUrl = `${supabaseUrl}/storage/v1/object/public/templates/${storageData.path}`;
      console.log('File uploaded, URL:', imageUrl);

      const data = {
        name: formData.get('name'),
        category: formData.get('category'),
        description: formData.get('description'),
        link: formData.get('link'),
        image: imageUrl,
        created_at: new Date().toISOString()
      };
      console.log('Inserting data:', data);

      const { error } = await supabase.from('templates').insert(data);
      if (error) throw new Error(`Database insert failed: ${error.message}`);

      showResult('Data and file posted successfully!', 'success');
      uploadForm.reset();
      preview.innerHTML = '';
    } catch (err) {
      showResult(err.message, 'error');
      console.error('Submission error:', err);
    }
  });

  // ----- Edit template -----
  window.editTemplate = async (id) => {
    const { data: existingData, error: fetchError } = await supabase.from('templates').select('*').eq('id', id).single();
    if (fetchError) {
      showResult('Failed to fetch template.', 'error');
      return;
    }

    const name = prompt('New name:', existingData.name) || existingData.name;
    const category = prompt('New category:', existingData.category) || existingData.category;
    const description = prompt('New description:', existingData.description) || existingData.description;
    const link = prompt('New link:', existingData.link) || existingData.link;

    let updateData = { name, category, description, link };

    const file = imageFile.files[0];
    if (file) {
      showResult('Uploading new image...', 'info');
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data: imgData, error: imgError } = await supabase.storage
        .from('templates')
        .upload(fileName, file, { cacheControl: '3600', upsert: false, contentType: file.type });
      if (imgError) {
        showResult(`Image upload failed: ${imgError.message}`, 'error');
        return;
      }
      updateData.image = `${supabaseUrl}/storage/v1/object/public/templates/${imgData.path}`;
      console.log('Updated image URL:', updateData.image);
    } else {
      updateData.image = existingData.image;
    }

    const { error: updateError } = await supabase.from('templates').update(updateData).eq('id', id);
    if (updateError) {
      showResult(`Update failed: ${updateError.message}`, 'error');
      return;
    }

    showResult('Template updated successfully!', 'success');
  };

  // ----- Delete template -----
  window.deleteTemplate = async (id) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('templates').delete().eq('id', id);
    if (error) {
      showResult(`Delete failed: ${error.message}`, 'error');
      return;
    }
    showResult('Template deleted!', 'success');
  };

  // ----- Email sending -----
  const emailForm = document.getElementById('emailForm');
  emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(emailForm);

    if (!window.emailjs) {
      showResult('EmailJS not loaded!', 'error');
      return;
    }
    emailjs.init('YOUR_EMAILJS_USER_ID');

    const templateParams = {
      to_email: formData.get('customerEmail'),
      custom_link: formData.get('customLink'),
      price: formData.get('price'),
      currency: formData.get('currency')
    };

    try {
      await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams);
      showResult('Email sent successfully!', 'success');
      emailForm.reset();
    } catch (err) {
      showResult('Failed to send email.', 'error');
      console.error('Email error:', err);
    }
  });

  function showResult(message, type) {
    result.textContent = message;
    result.className = type === 'success' ? 'success' : 'error';
    result.style.display = 'block';
    setTimeout(() => result.style.display = 'none', 5000);
  }
});
