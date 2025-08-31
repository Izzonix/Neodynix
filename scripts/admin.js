import { supabase } from './supabase-config.js';

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
      const { data, error: storageError } = await supabase.storage
        .from('templates')
        .upload(`${Date.now()}-${file.name}`, file, {
          cacheControl: '3600',
          upsert: false
        });
      if (storageError) throw storageError;

      const imageUrl = `${supabaseUrl}/storage/v1/object/public/templates/${data.path}`;

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
      fetchTemplates();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload. Check console for details.');
    }
  });

  // Fetch templates
  async function fetchTemplates() {
    try {
      const { data, error } = await supabase.from('templates').select('*');
      if (error) throw error;

      const templateList = document.getElementById('templateList');
      templateList.innerHTML = '';

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

  // Edit template
  window.editTemplate = async (id) => {
    const name = prompt('Enter new template name:');
    const category = prompt('Enter new category:');
    const description = prompt('Enter new description:');
    const link = prompt('Enter new preview link:');
    const file = imageFile.files[0];
    const updateData = {};

    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (link) updateData.link = link;
    if (file) {
      const { data, error: storageError } = await supabase.storage
        .from('templates')
        .upload(`${Date.now()}-${file.name}`, file);
      if (storageError) throw storageError;
      updateData.image = `${supabaseUrl}/storage/v1/object/public/templates/${data.path}`;
    }

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase.from('templates').update(updateData).eq('id', id);
      if (error) throw error;
      alert('Template updated successfully!');
      fetchTemplates();
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

  // Email sending (mock for now, requires external service)
  const emailForm = document.getElementById('emailForm');
  emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(emailForm);

    console.log('Email data:', {
      to_email: formData.get('customerEmail'),
      custom_link: formData.get('customLink'),
      price: formData.get('price'),
      currency: formData.get('currency')
    });
    alert('Email functionality requires external service setup. Check console.');
    emailForm.reset();
  });

  fetchTemplates();
});
