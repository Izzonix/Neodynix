import { supabase, supabaseUrl } from './supabase-config.js';

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
    // No auto-fetch here
  });

  btnSendEmail.addEventListener('click', () => {
    btnSendEmail.classList.add('active');
    btnTemplates.classList.remove('active');
    sectionSendEmail.style.display = 'block';
    sectionTemplates.style.display = 'none';
  });

  // Image preview
  const imageFile = document.getElementById('imageFile');
  const preview = document.getElementById('imagePreview');
  const uploadForm = document.getElementById('uploadForm');

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

  // Upload template
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(uploadForm);
    const file = imageFile.files[0];
    if (!file) {
      alert('Please select an image.');
      return;
    }

    try {
      // Upload image to Supabase storage
      const { data, error: storageError } = await supabase.storage
        .from('templates')
        .upload(`${Date.now()}-${file.name}`, file, {
          cacheControl: '3600',
          upsert: false
        });
      if (storageError) throw storageError;

      const imageUrl = `${supabaseUrl}/storage/v1/object/public/templates/${data.path}`;

      // Insert template info into DB
      const { error: dbError } = await supabase.from('templates').insert({
        name: formData.get('name'),
        category: formData.get('category'),
        description: formData.get('description'),
        link: formData.get('link'),
        image: imageUrl
      });
      if (dbError) throw dbError;

      alert('Template uploaded successfully!');
      uploadForm.reset();
      preview.innerHTML = '';
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload. Check console for details.');
    }
  });

  // Fetch templates (manual refresh only)
  async function fetchTemplates() {
    try {
      const { data, error } = await supabase.from('templates').select('*');
      if (error) throw error;

      const templateList = document.getElementById('templateList');
      templateList.innerHTML = '';

      if (!data || data.length === 0) {
        templateList.innerHTML = '<p>No templates found.</p>';
        return;
      }

      data.forEach(template => {
        const templateItem = document.createElement('div');
        templateItem.className = 'template-item';
        templateItem.innerHTML = `
          <img src="${template.image}" alt="${template.name}" />
          <p><strong>${template.name}</strong></p>
          <p>Category: ${template.category}</p>
          <p>Description: ${template.description}</p>
          <p><a href="${template.link}" target="_blank">Preview</a></p>
          <button onclick="editTemplate('${template.id}')">Edit</button>
          <button onclick="deleteTemplate('${template.id}')">Delete</button>
        `;
        templateList.appendChild(templateItem);
      });
    } catch (err) {
      console.error('Fetch templates error:', err);
      alert('Failed to load templates. Check console for details.');
    }
  }

  // Add a refresh button
  const refreshBtn = document.createElement('button');
  refreshBtn.textContent = 'Refresh Templates';
  refreshBtn.className = 'btn';
  refreshBtn.addEventListener('click', fetchTemplates);
  document.querySelector('.template-list').insertBefore(refreshBtn, document.getElementById('templateList'));

  // Edit template
  window.editTemplate = async (id) => {
    const { data: existingData } = await supabase.from('templates').select('*').eq('id', id).single();
    const name = prompt('Enter new template name:', existingData.name) || existingData.name;
    const category = prompt('Enter new category:', existingData.category) || existingData.category;
    const description = prompt('Enter new description:', existingData.description) || existingData.description;
    const link = prompt('Enter new preview link:', existingData.link) || existingData.link;
    const file = imageFile.files[0];
    const updateData = { name, category, description, link };

    if (file) {
      const { data, error: storageError } = await supabase.storage
        .from('templates')
        .upload(`${Date.now()}-${file.name}`, file);
      if (storageError) throw storageError;
      updateData.image = `${supabaseUrl}/storage/v1/object/public/templates/${data.path}`;
    } else {
      updateData.image = existingData.image;
    }

    try {
      const { error } = await supabase.from('templates').update(updateData).eq('id', id);
      if (error) throw error;
      alert('Template updated successfully!');
      fetchTemplates();
    } catch (err) {
      console.error('Update error:', err);
      alert('Failed to update. Check console for details.');
    }
  };

  // Delete template
  window.deleteTemplate = async (id) => {
    if (confirm('Are you sure you want to delete this template?')) {
      const { error } = await supabase.from('templates').delete().eq('id', id);
      if (error) throw error;
      alert('Template deleted successfully!');
      fetchTemplates();
    }
  };

  // Email sending with EmailJS
  const emailForm = document.getElementById('emailForm');
  emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(emailForm);

    emailjs.init('YOUR_EMAILJS_USER_ID'); // Replace with your EmailJS User ID
    const templateParams = {
      to_email: formData.get('customerEmail'),
      custom_link: formData.get('customLink'),
      price: formData.get('price'),
      currency: formData.get('currency')
    };

    try {
      await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams);
      alert('Email sent successfully!');
      emailForm.reset();
    } catch (error) {
      console.error('Email send error:', error);
      alert('Failed to send email. Check console for details.');
    }
  });
});
