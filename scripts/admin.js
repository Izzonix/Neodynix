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

  // Valid categories matching the templates table CHECK constraint
  const validCategories = ['business', 'portfolio', 'education', 'ecommerce', 'charity', 'blog', 'healthcare', 'event', 'church', 'nonprofit', 'other'];

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
          <p>Rates: ${template.rate_per_month.toFixed(2)}/month, ${template.rate_per_page.toFixed(2)}/page</p>
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
    const name = uploadForm.name.value.trim();
    const category = uploadForm.category.value.trim().toLowerCase();
    const description = uploadForm.description.value.trim();
    const link = uploadForm.link.value.trim();
    const price_ugx = parseFloat(uploadForm.price_ugx.value) || 0;
    const price_ksh = parseFloat(uploadForm.price_ksh.value) || 0;
    const price_tsh = parseFloat(uploadForm.price_tsh.value) || 0;
    const price_usd = parseFloat(uploadForm.price_usd.value) || 0;
    const rate_per_month = parseFloat(uploadForm.rate_per_month.value) || 0;
    const rate_per_page = parseFloat(uploadForm.rate_per_page.value) || 0;
    const imageFile = uploadForm.imageFile.files[0];

    // Validate inputs
    if (!name) {
      showResult('Template name is required.', false);
      return;
    }
    if (!validCategories.includes(category)) {
      showResult(`Invalid category. Must be one of: ${validCategories.join(', ')}`, false);
      return;
    }
    if (!imageFile) {
      showResult('Please select an image file.', false);
      return;
    }
    if (price_ugx < 0 || price_ksh < 0 || price_tsh < 0 || price_usd < 0 || rate_per_month < 0 || rate_per_page < 0) {
      showResult('Prices and rates must be non-negative.', false);
      return;
    }

    loadingPopup.style.display = 'flex';
    try {
      // Upload image to Supabase storage
      const fileName = `images/${Date.now()}_${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('templates')
        .upload(fileName, imageFile, { cacheControl: '3600', upsert: false, contentType: imageFile.type });
      if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

      // Get public URL for the uploaded image
      const { data: publicUrlData } = supabase.storage
        .from('templates')
        .getPublicUrl(fileName);
      if (!publicUrlData.publicUrl) throw new Error('Failed to get public URL for image');

      // Insert template data into Supabase
      const { error: insertError } = await supabase.from('templates').insert([
        {
          name,
          category,
          description,
          link,
          price_ugx,
          price_ksh,
          price_tsh,
          price_usd,
          rate_per_month,
          rate_per_page,
          image: publicUrlData.publicUrl
        }
      ]);
      if (insertError) throw new Error(`Database insert failed: ${insertError.message}`);

      uploadForm.reset();
      document.getElementById('imagePreview').innerHTML = '';
      showResult('Template uploaded successfully!', true);
      fetchTemplates();
    } catch (error) {
      console.error('Error uploading template:', error);
      showResult(`Failed to upload template: ${error.message}`, false);
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
      editTemplateForm.editRatePerMonth.value = template.rate_per_month || 0;
      editTemplateForm.editRatePerPage.value = template.rate_per_page || 0;
      document.getElementById('editImagePreview').innerHTML = template.image ? `<img src="${template.image}" alt="Current Image">` : '';
      editTemplateModal.style.display = 'flex';
      const newEditTemplateForm = editTemplateForm.cloneNode(true);
      editTemplateForm.replaceWith(newEditTemplateForm);
      newEditTemplateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updatedData = {
          name: newEditTemplateForm.editName.value.trim(),
          category: newEditTemplateForm.editCategory.value.trim().toLowerCase(),
          description: newEditTemplateForm.editDescription.value.trim(),
          link: newEditTemplateForm.editLink.value.trim(),
          price_ugx: parseFloat(newEditTemplateForm.editPriceUgx.value) || 0,
          price_ksh: parseFloat(newEditTemplateForm.editPriceKsh.value) || 0,
          price_tsh: parseFloat(newEditTemplateForm.editPriceTsh.value) || 0,
          price_usd: parseFloat(newEditTemplateForm.editPriceUsd.value) || 0,
          rate_per_month: parseFloat(newEditTemplateForm.editRatePerMonth.value) || 0,
          rate_per_page: parseFloat(newEditTemplateForm.editRatePerPage.value) || 0
        };
        if (!updatedData.name) {
          showResult('Template name is required.', false);
          return;
        }
        if (!validCategories.includes(updatedData.category)) {
          showResult(`Invalid category. Must be one of: ${validCategories.join(', ')}`, false);
          return;
        }
        if (updatedData.price_ugx < 0 || updatedData.price_ksh < 0 || updatedData.price_tsh < 0 || updatedData.price_usd < 0 || updatedData.rate_per_month < 0 || updatedData.rate_per_page < 0) {
          showResult('Prices and rates must be non-negative.', false);
          return;
        }
        let imageUrl = template.image;
        const newImage = newEditTemplateForm.editImageFile.files[0];
        loadingPopup.style.display = 'flex';
        try {
          if (newImage) {
            const fileName = `images/${Date.now()}_${newImage.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('templates')
              .upload(fileName, newImage, { cacheControl: '3600', upsert: false, contentType: newImage.type });
            if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
            const { data: publicUrlData } = supabase.storage
              .from('templates')
              .getPublicUrl(fileName);
            imageUrl = publicUrlData.publicUrl;
            if (template.image) {
              const oldPath = template.image.split('/').slice(-2).join('/');
              await supabase.storage.from('templates').remove([oldPath]);
            }
          }
          const { error } = await supabase.from('templates').update({ ...updatedData, image: imageUrl }).eq('id', id);
          if (error) throw new Error(`Database update failed: ${error.message}`);
          newEditTemplateForm.reset();
          editTemplateModal.style.display = 'none';
          document.getElementById('editImagePreview').innerHTML = '';
          showResult('Template updated successfully!', true);
          fetchTemplates();
        } catch (error) {
          console.error('Error updating template:', error);
          showResult(`Failed to update template: ${error.message}`, false);
        } finally {
          loadingPopup.style.display = 'none';
        }
      });
    } catch (error) {
      console.error('Error in editTemplate:', error);
      showResult(`Failed to load template: ${error.message}`, false);
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
        if (error) throw new Error(`Database delete failed: ${error.message}`);
        showResult('Template deleted successfully!', true);
        fetchTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
        showResult(`Failed to delete template: ${error.message}`, false);
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
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('id, user_id, content, created_at, replied, is_auto, file_url, users(name, email)')
        .order('created_at', { ascending: false });
      if (msgError) throw msgError;
      chatRequestList.innerHTML = '';
      if (messages.length === 0) {
        chatRequestList.innerHTML = '<p>No messages available.</p>';
        return;
      }
      const users = new Map();
      messages.forEach(msg => {
        const userId = msg.user_id;
        if (!users.has(userId)) {
          users.set(userId, { 
            name: msg.users?.name || 'Unknown User', 
            email: msg.users?.email || 'Unknown Email',
            messages: [] 
          });
        }
        users.get(userId).messages.push({
          id: msg.id,
          content: msg.content,
          created_at: msg.created_at,
          replied: msg.replied,
          is_auto: msg.is_auto,
          file_url: msg.file_url
        });
      });
      users.forEach((user, userId) => {
        user.messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        user.messages = user.messages.slice(0, 5);
        const card = document.createElement('div');
        card.className = 'chat-request-card';
        let messagesHtml = '<ul>';
        user.messages.forEach(msg => {
          const content = msg.file_url ? `${msg.content} <a href="${msg.file_url}" target="_blank">View File</a>` : msg.content;
          messagesHtml += `
            <li>
              <p>Message: ${content}</p>
              <p>Sent: ${new Date(msg.created_at).toLocaleString()}</p>
              <p>Status: ${msg.replied ? 'Replied' : 'Pending'}</p>
              ${!msg.is_auto ? `<button class="btn" onclick="replyToChat('${msg.id}', '${user.name}', '${user.email}')" ${msg.replied ? 'disabled' : ''}>Reply</button>` : ''}
            </li>
          `;
        });
        messagesHtml += '</ul>';
        card.innerHTML = `
          <h3>${user.name} (${user.email})</h3>
          ${messagesHtml}
          <button class="btn btn-delete" onclick="deleteChat('${userId}')">Delete Chat</button>
        `;
        chatRequestList.appendChild(card);
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      chatResult.className = 'result error';
      chatResult.textContent = 'Failed to load messages.';
    }
  }

  window.deleteChat = (userId) => {
    showConfirm('Are you sure you want to delete this chat?', async () => {
      loadingPopup.style.display = 'flex';
      try {
        const { data: messages, error: msgError } = await supabase.from('messages').select('file_url').eq('user_id', userId);
        if (msgError) throw msgError;
        for (const msg of messages) {
          if (msg.file_url) {
            const path = msg.file_url.split('/').slice(-2).join('/');
            await supabase.storage.from('chat-files').remove([path]);
          }
        }
        const { error: msgDeleteError } = await supabase.from('messages').delete().eq('user_id', userId);
        if (msgDeleteError) throw msgDeleteError;
        const { error: userError } = await supabase.from('users').delete().eq('id', userId);
        if (userError) throw userError;
        chatResult.className = 'result success';
        chatResult.textContent = 'Chat and user data deleted successfully!';
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
    const messageId = chatReplyForm.replyUserId.value;
    const message = chatReplyForm.replyMessage.value;
    if (!messageId || !message) {
      chatResult.className = 'result error';
      chatResult.textContent = 'Please select a message and enter a reply.';
      return;
    }
    loadingPopup.style.display = 'flex';
    try {
      const { data: messageData, error: fetchError } = await supabase
        .from('messages')
        .select('user_id')
        .eq('id', messageId)
        .single();
      if (fetchError || !messageData) throw new Error('Message not found');
      const userId = messageData.user_id;
      const { error: insertError } = await supabase.from('messages').insert({
        user_id: userId,
        content: message,
        sender: 'support',
        is_auto: false
      });
      if (insertError) throw insertError;
      const { error: updateError } = await supabase.from('messages').update({ replied: true }).eq('id', messageId);
      if (updateError) throw updateError;
      chatReplyForm.reset();
      document.getElementById('replyUserId').value = '';
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

// custom_requests
async function fetchCustomRequests() {
  try {
    const { data, error } = await supabase
      .from('custom_requests')
      .select('id, name, email, category, template, price, currency, message, files, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    customRequestList.innerHTML = '';
    if (data.length === 0) {
      customRequestList.innerHTML = '<p>No custom requests available.</p>';
      return;
    }
    data.forEach(request => {
      const card = document.createElement('div');
      card.className = 'custom-request-card';
      // Group files by type
      const filesByType = {
        logo: [],
        media: [],
        other: [],
        category_doc: []
      };
      if (request.files && Array.isArray(request.files)) {
        request.files.forEach(fileObj => {
          if (filesByType[fileObj.type]) {
            filesByType[fileObj.type].push(fileObj.url);
          }
        });
      }
      const logoList = filesByType.logo.map(file => `
        <li>
          <a href="${file}" download="logo-${request.id}" target="_blank">Logo File</a>
          <button class="btn btn-delete" onclick="deleteFile('${request.id}', '${file}', 'logo')">Delete</button>
        </li>
      `).join('') || '<li>No logo uploaded</li>';
      const mediaList = filesByType.media.map(file => `
        <li>
          <a href="${file}" download="media-${request.id}" target="_blank">${file.split('/').pop()}</a>
          <button class="btn btn-delete" onclick="deleteFile('${request.id}', '${file}', 'media')">Delete</button>
        </li>
      `).join('') || '<li>No media files uploaded</li>';
      const otherList = filesByType.other.map(file => `
        <li>
          <a href="${file}" download="other-${request.id}" target="_blank">${file.split('/').pop()}</a>
          <button class="btn btn-delete" onclick="deleteFile('${request.id}', '${file}', 'other')">Delete</button>
        </li>
      `).join('') || '<li>No other files uploaded</li>';
      const docList = filesByType.category_doc.map(file => `
        <li>
          <a href="${file}" download="doc-${request.id}" target="_blank">Category Document</a>
          <button class="btn btn-delete" onclick="deleteFile('${request.id}', '${file}', 'category_doc')">Delete</button>
        </li>
      `).join('') || '<li>No category document uploaded</li>';
      card.innerHTML = `
        <h3>${request.name}</h3>
        <p>Email: ${request.email}</p>
        <p>Category: ${request.category}</p>
        <p>Template: ${request.template}</p>
        <p>Price: ${request.price.toFixed(2)} ${request.currency}</p>
        <p>Message: ${request.message}</p>
        <h4>Logo Files</h4>
        <ul>${logoList}</ul>
        <h4>Media Files</h4>
        <ul>${mediaList}</ul>
        <h4>Other Files</h4>
        <ul>${otherList}</ul>
        <h4>Category Document</h4>
        <ul>${docList}</ul>
      `;
      customRequestList.appendChild(card);
    });
  } catch (error) {
    console.error('Error fetching custom requests:', error);
    customRequestList.innerHTML = '<p class="error">Failed to load custom requests.</p>';
  }
}

window.deleteFile = async (requestId, fileUrl, fileType) => {
  showConfirm('Are you sure you want to delete this file?', async () => {
    loadingPopup.style.display = 'flex';
    try {
      // Delete from storage
      const path = fileUrl.split('/').slice(-2).join('/');
      const { error: storageError } = await supabase.storage.from('custom_requests').remove([path]);
      if (storageError) throw storageError;
      // Fetch current files
      const { data: request, error: fetchError } = await supabase.from('custom_requests').select('files').eq('id', requestId).single();
      if (fetchError) throw fetchError;
      // Filter out the deleted file based on URL and type
      const updatedFiles = request.files.filter(fileObj => !(fileObj.url === fileUrl && fileObj.type === fileType));
      const { error: updateError } = await supabase.from('custom_requests').update({ files: updatedFiles }).eq('id', requestId);
      if (updateError) throw updateError;
      showResult('File deleted successfully!', true);
      fetchCustomRequests();
    } catch (error) {
      console.error('Error deleting file:', error);
      showResult(`Failed to delete file: ${error.message}`, false);
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
