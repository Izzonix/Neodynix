import { supabase } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('login-section');
  const adminContainer = document.getElementById('admin-container');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');
  const uploadForm = document.getElementById('uploadForm');
  const templateList = document.getElementById('templateList');
  const result = document.getElementById('result');
  const editTemplateModal = document.getElementById('editTemplateModal');
  const editTemplateForm = document.getElementById('editTemplateForm');
  const cancelEditBtn = document.getElementById('cancelEdit');
  const confirmModal = document.getElementById('confirmModal');
  const confirmMessage = document.getElementById('confirmMessage');
  const confirmYes = document.getElementById('confirmYes');
  const confirmNo = document.getElementById('confirmNo');
  const loadingPopup = document.getElementById('loading-popup');
  const emailForm = document.getElementById('emailForm');
  const chatReplyForm = document.getElementById('chatReplyForm');
  const chatRequestList = document.getElementById('chatRequestList');
  const chatResult = document.getElementById('chatResult');
  const customRequestList = document.getElementById('customRequestList');
  let templates = [];

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      loginSection.style.display = 'none';
      adminContainer.style.display = 'block';
      fetchTemplates();
      fetchChatRequests();
      fetchCustomRequests();
    } else {
      loginSection.style.display = 'block';
      adminContainer.style.display = 'none';
    }
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.email.value;
    const password = loginForm.password.value;
    loadingPopup.style.display = 'flex';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    loadingPopup.style.display = 'none';
    if (error) {
      loginError.style.display = 'block';
      loginError.textContent = error.message;
    } else {
      loginSection.style.display = 'none';
      adminContainer.style.display = 'block';
      fetchTemplates();
      fetchChatRequests();
      fetchCustomRequests();
    }
  });

  logoutBtn.addEventListener('click', async () => {
    loadingPopup.style.display = 'flex';
    await supabase.auth.signOut();
    loadingPopup.style.display = 'none';
    loginSection.style.display = 'block';
    adminContainer.style.display = 'none';
  });

  function showConfirm(message, callback) {
    confirmMessage.textContent = message;
    confirmModal.style.display = 'flex';
    confirmYes.onclick = () => {
      callback();
      confirmModal.style.display = 'none';
    };
    confirmNo.onclick = () => {
      confirmModal.style.display = 'none';
    };
  }

  function showResult(message, isSuccess) {
    result.className = `result ${isSuccess ? 'success' : 'error'}`;
    result.textContent = message;
    setTimeout(() => {
      result.textContent = '';
      result.className = 'result';
    }, 5000);
  }

  async function fetchTemplates() {
    try {
      templateList.innerHTML = '';
      const { data, error } = await supabase.from('templates').select('*');
      if (error) {
        console.error('Error fetching templates:', error);
        showResult('Failed to load templates: ' + error.message, false);
        return;
      }
      templates = data || [];
      if (templates.length === 0) {
        templateList.innerHTML = '<p>No templates available.</p>';
        return;
      }
      templates.forEach(template => {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.innerHTML = `
          <img src="${template.image || 'https://via.placeholder.com/150'}" alt="${template.name}">
          <h3>${template.name}</h3>
          <p>Category: ${template.category}</p>
          <p>Prices: UGX ${template.price_ugx}, KSH ${template.price_ksh}, TSH ${template.price_tsh}, USD ${template.price_usd}</p>
          <a href="${template.link}" target="_blank">Preview</a>
          <button class="btn" onclick="editTemplate('${template.id}')">Edit</button>
          <button class="btn btn-delete" onclick="deleteTemplate('${template.id}')">Delete</button>
        `;
        templateList.appendChild(card);
      });
    } catch (err) {
      console.error('Unexpected error fetching templates:', err);
      showResult('Unexpected error loading templates.', false);
    }
  }

  async function uploadTemplate(e) {
    e.preventDefault();
    const name = uploadForm.name.value;
    const category = uploadForm.category.value;
    const description = uploadForm.description.value;
    const link = uploadForm.link.value;
    const price_ugx = parseFloat(uploadForm.price_ugx.value);
    const price_ksh = parseFloat(uploadForm.price_ksh.value);
    const price_tsh = parseFloat(uploadForm.price_tsh.value);
    const price_usd = parseFloat(uploadForm.price_usd.value);
    const imageFile = uploadForm.imageFile.files[0];
    if (!imageFile) {
      showResult('Please select an image file.', false);
      return;
    }
    loadingPopup.style.display = 'flex';
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('templates')
        .upload(`images/${Date.now()}_${imageFile.name}`, imageFile);
      if (uploadError) throw uploadError;
      const { publicUrl } = supabase.storage.from('templates').getPublicUrl(uploadData.path).data;
      const { error: insertError } = await supabase.from('templates').insert([
        { name, category, description, link, price_ugx, price_ksh, price_tsh, price_usd, image: publicUrl }
      ]);
      if (insertError) throw insertError;
      uploadForm.reset();
      document.getElementById('imagePreview').innerHTML = '';
      showResult('Template uploaded successfully!', true);
      fetchTemplates();
    } catch (error) {
      console.error('Error uploading template:', error);
      showResult('Failed to upload template: ' + error.message, false);
    } finally {
      loadingPopup.style.display = 'none';
    }
  }

  window.editTemplate = async (id) => {
    const template = templates.find(t => t.id === id);
    if (!template) {
      showResult('Template not found.', false);
      return;
    }
    editTemplateForm.editName.value = template.name;
    editTemplateForm.editCategory.value = template.category;
    editTemplateForm.editDescription.value = template.description || '';
    editTemplateForm.editLink.value = template.link;
    editTemplateForm.editPriceUgx.value = template.price_ugx;
    editTemplateForm.editPriceKsh.value = template.price_ksh;
    editTemplateForm.editPriceTsh.value = template.price_tsh;
    editTemplateForm.editPriceUsd.value = template.price_usd;
    document.getElementById('editImagePreview').innerHTML = template.image ? `<img src="${template.image}" alt="Current Image">` : '';
    editTemplateModal.style.display = 'flex';
    editTemplateForm.onsubmit = async (e) => {
      e.preventDefault();
      const updatedData = {
        name: editTemplateForm.editName.value,
        category: editTemplateForm.editCategory.value,
        description: editTemplateForm.editDescription.value,
        link: editTemplateForm.editLink.value,
        price_ugx: parseFloat(editTemplateForm.editPriceUgx.value),
        price_ksh: parseFloat(editTemplateForm.editPriceKsh.value),
        price_tsh: parseFloat(editTemplateForm.editPriceTsh.value),
        price_usd: parseFloat(editTemplateForm.editPriceUsd.value)
      };
      let imageUrl = template.image;
      const newImage = editTemplateForm.editImageFile.files[0];
      loadingPopup.style.display = 'flex';
      try {
        if (newImage) {
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('templates')
            .upload(`images/${Date.now()}_${newImage.name}`, newImage);
          if (uploadError) throw uploadError;
          imageUrl = supabase.storage.from('templates').getPublicUrl(uploadData.path).data.publicUrl;
          if (template.image) {
            const oldPath = template.image.split('/').pop();
            await supabase.storage.from('templates').remove([`images/${oldPath}`]);
          }
        }
        const { error } = await supabase.from('templates').update({ ...updatedData, image: imageUrl }).eq('id', id);
        if (error) throw error;
        editTemplateModal.style.display = 'none';
        editTemplateForm.reset();
        document.getElementById('editImagePreview').innerHTML = '';
        showResult('Template updated successfully!', true);
        fetchTemplates();
      } catch (error) {
        console.error('Error updating template:', error);
        showResult('Failed to update template: ' + error.message, false);
      } finally {
        loadingPopup.style.display = 'none';
      }
    };
  };

  window.deleteTemplate = (id) => {
    showConfirm('Are you sure you want to delete this template?', async () => {
      loadingPopup.style.display = 'flex';
      try {
        const template = templates.find(t => t.id === id);
        if (template.image) {
          const path = template.image.split('/').pop();
          await supabase.storage.from('templates').remove([`images/${path}`]);
        }
        const { error } = await supabase.from('templates').delete().eq('id', id);
        if (error) throw error;
        showResult('Template deleted successfully!', true);
        fetchTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
        showResult('Failed to delete template: ' + error.message, false);
      } finally {
        loadingPopup.style.display = 'none';
      }
    });
  };

  cancelEditBtn.addEventListener('click', () => {
    editTemplateModal.style.display = 'none';
    editTemplateForm.reset();
    document.getElementById('editImagePreview').innerHTML = '';
  });

  async function fetchChatRequests() {
    try {
      const { data, error } = await supabase.from('chat_requests').select('*');
      if (error) throw error;
      chatRequestList.innerHTML = '';
      if (data.length === 0) {
        chatRequestList.innerHTML = '<p>No chat requests available.</p>';
        return;
      }
      data.forEach(request => {
        const card = document.createElement('div');
        card.className = 'chat-request-card';
        card.innerHTML = `
          <h3>${request.name}</h3>
          <p>Email: ${request.email}</p>
          <p>Message: ${request.message}</p>
          <button class="btn" onclick="replyToChat('${request.id}', '${request.name}', '${request.email}')">Reply</button>
        `;
        chatRequestList.appendChild(card);
      });
    } catch (error) {
      console.error('Error fetching chat requests:', error);
      chatResult.className = 'result error';
      chatResult.textContent = 'Failed to load chat requests: ' + error.message;
    }
  }

  window.replyToChat = (id, name, email) => {
    document.getElementById('replyUserId').value = id;
    document.getElementById('replyUserInfo').textContent = `Replying to ${name} (${email})`;
  };

  chatReplyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = chatReplyForm.replyUserId.value;
    const message = chatReplyForm.replyMessage.value;
    loadingPopup.style.display = 'flex';
    try {
      await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
        to_email: document.getElementById('replyUserInfo').textContent.split('(')[1].slice(0, -1),
        message: message
      }, 'YOUR_EMAILJS_USER_ID');
      const { error } = await supabase.from('chat_requests').update({ replied: true }).eq('id', userId);
      if (error) throw error;
      chatReplyForm.reset();
      document.getElementById('replyUserInfo').textContent = '';
      chatResult.className = 'result success';
      chatResult.textContent = 'Reply sent successfully!';
      fetchChatRequests();
    } catch (error) {
      console.error('Error sending reply:', error);
      chatResult.className = 'result error';
      chatResult.textContent = 'Failed to send reply: ' + error.message;
    } finally {
      loadingPopup.style.display = 'none';
    }
  });

  async function fetchCustomRequests() {
    try {
      const { data, error } = await supabase.from('custom_requests').select('*');
      if (error) throw error;
      customRequestList.innerHTML = '';
      if (data.length === 0) {
        customRequestList.innerHTML = '<p>No custom requests available.</p>';
        return;
      }
      data.forEach(request => {
        const card = document.createElement('div');
        card.className = 'custom-request-card';
        const fileList = request.files ? request.files.map(file => `<li><a href="${file}" target="_blank">${file.split('/').pop()}</a></li>`).join('') : '';
        card.innerHTML = `
          <h3>${request.name}</h3>
          <p>Email: ${request.email}</p>
          <p>Category: ${request.category}</p>
          <p>Template: ${request.template}</p>
          <p>Price: ${request.price} ${request.currency}</p>
          <p>Message: ${request.message}</p>
          <ul>${fileList}</ul>
        `;
        customRequestList.appendChild(card);
      });
    } catch (error) {
      console.error('Error fetching custom requests:', error);
      customRequestList.innerHTML = '<p class="error">Failed to load custom requests: ' + error.message + '</p>';
    }
  }

  emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailForm.customerEmail.value;
    const link = emailForm.customLink.value;
    const price = emailForm.price.value;
    const currency = emailForm.currency.value;
    loadingPopup.style.display = 'flex';
    try {
      await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
        to_email: email,
        custom_link: link,
        price: price,
        currency: currency
      }, 'YOUR_EMAILJS_USER_ID');
      emailForm.reset();
      showResult('Email sent successfully!', true);
    } catch (error) {
      console.error('Error sending email:', error);
      showResult('Failed to send email: ' + error.message, false);
    } finally {
      loadingPopup.style.display = 'none';
    }
  });

  document.getElementById('btnTemplates').addEventListener('click', () => {
    document.querySelectorAll('.admin-section').forEach(section => section.style.display = 'none');
    document.getElementById('sectionTemplates').style.display = 'block';
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btnTemplates').classList.add('active');
    fetchTemplates();
  });

  document.getElementById('btnSendEmail').addEventListener('click', () => {
    document.querySelectorAll('.admin-section').forEach(section => section.style.display = 'none');
    document.getElementById('sectionSendEmail').style.display = 'block';
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btnSendEmail').classList.add('active');
  });

  document.getElementById('btnChat').addEventListener('click', () => {
    document.querySelectorAll('.admin-section').forEach(section => section.style.display = 'none');
    document.getElementById('sectionChat').style.display = 'block';
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btnChat').classList.add('active');
    fetchChatRequests();
  });

  document.getElementById('btnCustomRequests').addEventListener('click', () => {
    document.querySelectorAll('.admin-section').forEach(section => section.style.display = 'none');
    document.getElementById('sectionCustomRequests').style.display = 'block';
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btnCustomRequests').classList.add('active');
    fetchCustomRequests();
  });

  uploadForm.addEventListener('submit', uploadTemplate);

  document.getElementById('imageFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        document.getElementById('imagePreview').innerHTML = `<img src="${e.target.result}" alt="Preview">`;
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('editImageFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        document.getElementById('editImagePreview').innerHTML = `<img src="${e.target.result}" alt="Preview">`;
      };
      reader.readAsDataURL(file);
    }
  });

  checkAuth();
});