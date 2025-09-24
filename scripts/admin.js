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

  window.logout = async () => {
    loadingPopup.style.display = 'flex';
    await supabase.auth.signOut();
    loadingPopup.style.display = 'none';
    loginSection.style.display = 'block';
    adminContainer.style.display = 'none';
  };

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

  window.showSection = (section) => {
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    const sectionMap = {
      templates: { id: 'sectionTemplates', btn: 'btnTemplates', fetch: fetchTemplates },
      email: { id: 'sectionSendEmail', btn: 'btnSendEmail' },
      chat: { id: 'sectionChat', btn: 'btnChat', fetch: fetchChatRequests },
      custom: { id: 'sectionCustomRequests', btn: 'btnCustomRequests', fetch: fetchCustomRequests }
    };
    const target = sectionMap[section];
    if (target) {
      document.getElementById(target.id).classList.add('active');
      document.getElementById(target.btn).classList.add('active');
      if (target.fetch) target.fetch();
    }
  };

  async function fetchTemplates() {
    try {
      templateList.innerHTML = '';
      const { data, error } = await supabase.from('templates').select('*');
      if (error) throw error;
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
          <p>Prices: UGX ${template.price_ugx.toFixed(2)}, KSH ${template.price_ksh.toFixed(2)}, TSH ${template.price_tsh.toFixed(2)}, USD ${template.price_usd.toFixed(2)}</p>
          <a href="${template.link}" target="_blank">Preview</a>
          <div class="button-container">
            <button class="btn" onclick="editTemplate('${template.id}')">Edit</button>
            <button class="btn btn-delete" onclick="deleteTemplate('${template.id}')">Delete</button>
          </div>
        `;
        templateList.appendChild(card);
      });
    } catch (err) {
      console.error('Error fetching templates:', err);
      showResult('Failed to load templates.', false);
    }
  }

  async function uploadTemplate(e) {
    e.preventDefault();
    const name = uploadForm.name.value;
    const category = uploadForm.category.value;
    const description = uploadForm.description.value;
    const link = uploadForm.link.value;
    const price_ugx = parseFloat(uploadForm.price_ugx.value) || 0;
    const price_ksh = parseFloat(uploadForm.price_ksh.value) || 0;
    const price_tsh = parseFloat(uploadForm.price_tsh.value) || 0;
    const price_usd = parseFloat(uploadForm.price_usd.value) || 0;
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
      showResult('Failed to upload template.', false);
    } finally {
      loadingPopup.style.display = 'none';
    }
  }

  window.editTemplate = async (id) => {
    try {
      const { data, error } = await supabase.from('templates').select('*').eq('id', id).single();
      if (error || !data) throw new Error('Template not found');
      const template = data;
      editTemplateForm.editName.value = template.name || '';
      editTemplateForm.editCategory.value = template.category || '';
      editTemplateForm.editDescription.value = template.description || '';
      editTemplateForm.editLink.value = template.link || '';
      editTemplateForm.editPriceUgx.value = template.price_ugx || 0;
      editTemplateForm.editPriceKsh.value = template.price_ksh || 0;
      editTemplateForm.editPriceTsh.value = template.price_tsh || 0;
      editTemplateForm.editPriceUsd.value = template.price_usd || 0;
      document.getElementById('editImagePreview').innerHTML = template.image ? `<img src="${template.image}" alt="Current Image">` : '';
      editTemplateModal.style.display = 'flex';
      const newEditTemplateForm = editTemplateForm.cloneNode(true);
      editTemplateForm.replaceWith(newEditTemplateForm);
      newEditTemplateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updatedData = {
          name: newEditTemplateForm.editName.value,
          category: newEditTemplateForm.editCategory.value,
          description: newEditTemplateForm.editDescription.value,
          link: newEditTemplateForm.editLink.value,
          price_ugx: parseFloat(newEditTemplateForm.editPriceUgx.value) || 0,
          price_ksh: parseFloat(newEditTemplateForm.editPriceKsh.value) || 0,
          price_tsh: parseFloat(newEditTemplateForm.editPriceTsh.value) || 0,
          price_usd: parseFloat(newEditTemplateForm.editPriceUsd.value) || 0
        };
        let imageUrl = template.image;
        const newImage = newEditTemplateForm.editImageFile.files[0];
        loadingPopup.style.display = 'flex';
        try {
          if (newImage) {
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('templates')
              .upload(`images/${Date.now()}_${newImage.name}`, newImage);
            if (uploadError) throw uploadError;
            imageUrl = supabase.storage.from('templates').getPublicUrl(uploadData.path).data.publicUrl;
            if (template.image) {
              const oldPath = template.image.split('/').slice(-2).join('/');
              await supabase.storage.from('templates').remove([oldPath]);
            }
          }
          const { error } = await supabase.from('templates').update({ ...updatedData, image: imageUrl }).eq('id', id);
          if (error) throw error;
          newEditTemplateForm.reset();
          editTemplateModal.style.display = 'none';
          document.getElementById('editImagePreview').innerHTML = '';
          showResult('Template updated successfully!', true);
          fetchTemplates();
        } catch (error) {
          console.error('Error updating template:', error);
          showResult('Failed to update template.', false);
        } finally {
          loadingPopup.style.display = 'none';
        }
      });
    } catch (error) {
      console.error('Error in editTemplate:', error);
      showResult('Failed to load template.', false);
    }
  };

  window.deleteTemplate = (id) => {
    showConfirm('Are you sure you want to delete this template?', async () => {
      loadingPopup.style.display = 'flex';
      try {
        const template = templates.find(t => t.id === id);
        if (template?.image) {
          const path = template.image.split('/').slice(-2).join('/');
          await supabase.storage.from('templates').remove([path]);
        }
        const { error } = await supabase.from('templates').delete().eq('id', id);
        if (error) throw error;
        showResult('Template deleted successfully!', true);
        fetchTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
        showResult('Failed to delete template.', false);
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
      const { data, error } = await supabase
        .from('messages')
        .select('id, name, email, message, created_at, replied')
        .order('created_at', { ascending: false });
      if (error) throw error;
      chatRequestList.innerHTML = '';
      if (data.length === 0) {
        chatRequestList.innerHTML = '<p>No messages available.</p>';
        return;
      }
      const users = [...new Set(data.map(msg => msg.email))];
      for (const email of users) {
        const userMessages = data.filter(msg => msg.email === email).slice(0, 5);
        const userName = userMessages[0].name;
        const card = document.createElement('div');
        card.className = 'chat-request-card';
        const messagesHtml = userMessages.map(msg => `
          <p>Message (${new Date(msg.created_at).toLocaleString()}): ${msg.message} ${msg.replied ? '(Replied)' : ''}</p>
        `).join('');
        card.innerHTML = `
          <h3>${userName}</h3>
          <p>Email: ${email}</p>
          ${messagesHtml}
          <button class="btn" onclick="replyToChat('${userMessages[0].id}', '${userName}', '${email}')" ${userMessages[0].replied ? 'disabled' : ''}>Reply</button>
          <button class="btn btn-delete" onclick="deleteChat('${email}')">Delete Chat</button>
        `;
        chatRequestList.appendChild(card);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      chatResult.className = 'result error';
      chatResult.textContent = 'Failed to load messages.';
    }
  }

  window.deleteChat = (email) => {
    showConfirm(`Are you sure you want to delete all messages for ${email}?`, async () => {
      loadingPopup.style.display = 'flex';
      try {
        const { error } = await supabase.from('messages').delete().eq('email', email);
        if (error) throw error;
        chatResult.className = 'result success';
        chatResult.textContent = 'Chat deleted successfully!';
        fetchChatRequests();
      } catch (error) {
        console.error('Error deleting chat:', error);
        chatResult.className = 'result error';
        chatResult.textContent = 'Failed to delete chat.';
      } finally {
        loadingPopup.style.display = 'none';
      }
    });
  };

  window.replyToChat = (id, name, email) => {
    document.getElementById('replyUserId').value = id;
    document.getElementById('replyUserInfo').textContent = `Replying to ${name} (${email})`;
    chatReplyForm.replyMessage.focus();
  };

  chatReplyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = chatReplyForm.replyUserId.value;
    const message = chatReplyForm.replyMessage.value;
    if (!userId || !message) {
      chatResult.className = 'result error';
      chatResult.textContent = 'Please select a user and enter a message.';
      return;
    }
    loadingPopup.style.display = 'flex';
    try {
      await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
        to_email: document.getElementById('replyUserInfo').textContent.split('(')[1].slice(0, -1),
        message: message,
        reply_to: 'YOUR_ADMIN_EMAIL'
      }, 'YOUR_EMAILJS_USER_ID');
      const { error } = await supabase.from('messages').update({ replied: true }).eq('id', userId);
      if (error) throw error;
      chatReplyForm.reset();
      document.getElementById('replyUserInfo').textContent = '';
      chatResult.className = 'result success';
      chatResult.textContent = 'Reply sent successfully!';
      fetchChatRequests();
    } catch (error) {
      console.error('Error sending reply:', error);
      chatResult.className = 'result error';
      chatResult.textContent = 'Failed to send reply.';
    } finally {
      loadingPopup.style.display = 'none';
    }
  });

  async function fetchCustomRequests() {
    try {
      const { data, error } = await supabase.from('custom_requests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      customRequestList.innerHTML = '';
      if (data.length === 0) {
        customRequestList.innerHTML = '<p>No custom requests available.</p>';
        return;
      }
      data.forEach(request => {
        const card = document.createElement('div');
        card.className = 'custom-request-card';
        const fileList = request.files?.map(file => `
          <li>
            <a href="${file}" download="${file.split('/').pop()}" target="_blank">${file.split('/').pop()}</a>
            <button class="btn btn-delete" onclick="deleteFile('${request.id}', '${file}')">Delete File</button>
          </li>
        `).join('') || '';
        card.innerHTML = `
          <h3>${request.name}</h3>
          <p>Email: ${request.email}</p>
          <p>Category: ${request.category}</p>
          <p>Template: ${request.template}</p>
          <p>Price: ${request.price.toFixed(2)} ${request.currency}</p>
          <p>Message: ${request.message}</p>
          <ul>${fileList}</ul>
        `;
        customRequestList.appendChild(card);
      });
    } catch (error) {
      console.error('Error fetching custom requests:', error);
      customRequestList.innerHTML = '<p class="error">Failed to load custom requests.</p>';
    }
  }

  window.deleteFile = async (requestId, fileUrl) => {
    showConfirm('Are you sure you want to delete this file?', async () => {
      loadingPopup.style.display = 'flex';
      try {
        const path = fileUrl.split('/').slice(-2).join('/');
        const { error: storageError } = await supabase.storage.from('custom_requests').remove([path]);
        if (storageError) throw storageError;
        const { data: request, error: fetchError } = await supabase.from('custom_requests').select('files').eq('id', requestId).single();
        if (fetchError) throw fetchError;
        const updatedFiles = request.files.filter(file => file !== fileUrl);
        const { error: updateError } = await supabase.from('custom_requests').update({ files: updatedFiles }).eq('id', requestId);
        if (updateError) throw updateError;
        showResult('File deleted successfully!', true);
        fetchCustomRequests();
      } catch (error) {
        console.error('Error deleting file:', error);
        showResult('Failed to delete file.', false);
      } finally {
        loadingPopup.style.display = 'none';
      }
    });
  };

  emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailForm.customerEmail.value;
    const link = emailForm.customLink.value;
    const price = parseFloat(emailForm.price.value) || 0;
    const currency = emailForm.currency.value;
    if (!email || !link || !currency) {
      showResult('Please fill all required fields.', false);
      return;
    }
    loadingPopup.style.display = 'flex';
    try {
      await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
        to_email: email,
        custom_link: link,
        price: price.toFixed(2),
        currency: currency,
        reply_to: 'YOUR_ADMIN_EMAIL'
      }, 'YOUR_EMAILJS_USER_ID');
      emailForm.reset();
      showResult('Email sent successfully!', true);
    } catch (error) {
      console.error('Error sending email:', error);
      showResult('Failed to send email.', false);
    } finally {
      loadingPopup.style.display = 'none';
    }
  });

  document.getElementById('btnTemplates').addEventListener('click', () => showSection('templates'));
  document.getElementById('btnSendEmail').addEventListener('click', () => showSection('email'));
  document.getElementById('btnChat').addEventListener('click', () => showSection('chat'));
  document.getElementById('btnCustomRequests').addEventListener('click', () => showSection('custom'));

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
    const
