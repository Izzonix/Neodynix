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

  // ----- Upload template -----
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(uploadForm);
    const file = imageFile.files[0];
    if (!file) return alert('Please select an image.');

    try {
      const { data: storageData, error: storageError } = await supabase.storage
        .from('templates')
        .upload(`${Date.now()}-${file.name}`, file, { cacheControl: '3600', upsert: false });
      if (storageError) throw storageError;

      const imageUrl = `${supabaseUrl}/storage/v1/object/public/templates/${storageData.path}`;

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
      alert('Failed to upload. Check console.');
    }
  });

  // ----- Fetch and display templates -----
  const templateList = document.getElementById('templateList');

  async function fetchTemplates() {
    try {
      const { data, error } = await supabase.from('templates').select('*').order('id', { ascending: true });
      if (error) throw error;

      templateList.innerHTML = '';
      data.forEach(template => {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.innerHTML = `
          <img src="${template.image}" alt="${template.name}" />
          <h4>${template.name}</h4>
          <p>${template.description}</p>
          <div class="template-actions">
            <button onclick="editTemplate(${template.id})">Edit</button>
            <button onclick="deleteTemplate(${template.id})">Delete</button>
          </div>
        `;
        templateList.appendChild(card);
      });
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  }

  fetchTemplates();

  // ----- Edit template -----
  window.editTemplate = async (id) => {
    const { data: existingData, error: fetchError } = await supabase.from('templates').select('*').eq('id', id).single();
    if (fetchError) return alert('Failed to fetch template.');

    const name = prompt('New name:', existingData.name) || existingData.name;
    const category = prompt('New category:', existingData.category) || existingData.category;
    const description = prompt('New description:', existingData.description) || existingData.description;
    const link = prompt('New link:', existingData.link) || existingData.link;

    let updateData = { name, category, description, link };

    const file = imageFile.files[0];
    if (file) {
      const { data: imgData, error: imgError } = await supabase.storage
        .from('templates')
        .upload(`${Date.now()}-${file.name}`, file);
      if (imgError) return alert('Image upload failed.');
      updateData.image = `${supabaseUrl}/storage/v1/object/public/templates/${imgData.path}`;
    } else {
      updateData.image = existingData.image;
    }

    const { error: updateError } = await supabase.from('templates').update(updateData).eq('id', id);
    if (updateError) return alert('Update failed.');

    alert('Template updated successfully!');
    fetchTemplates();
  };

  // ----- Delete template -----
  window.deleteTemplate = async (id) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('templates').delete().eq('id', id);
    if (error) return alert('Delete failed.');
    alert('Template deleted!');
    fetchTemplates();
  };

  // ----- Email sending -----
  const emailForm = document.getElementById('emailForm');
  emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(emailForm);

    if (!window.emailjs) return alert('EmailJS not loaded!');
    emailjs.init('YOUR_EMAILJS_USER_ID');

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
    } catch (err) {
      console.error('Email error:', err);
      alert('Failed to send email.');
    }
  });
});
