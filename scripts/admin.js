import { supabase, supabaseUrl } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  // ----- Tab switching -----
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
      // Upload to Supabase storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('templates')
        .upload(`${Date.now()}-${file.name}`, file, { cacheControl: '3600', upsert: false });
      if (storageError) throw storageError;

      const imageUrl = `${supabaseUrl}/storage/v1/object/public/templates/${storageData.path}`;

      // Insert into DB
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
      alert('Failed to upload. Check console.');
    }
  });

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
  };

  // ----- Delete template -----
  window.deleteTemplate = async (id) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('templates').delete().eq('id', id);
    if (error) return alert('Delete failed.');
    alert('Template deleted!');
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
