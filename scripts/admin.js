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
      knowledge: { id: 'sectionKnowledge', btn: 'btnKnowledge', fetch: fetchKnowledge },
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

  // ========== KNOWLEDGE BASE MANAGEMENT ==========
let knowledgeEntries = [];

async function fetchKnowledge() {
  try {
    const knowledgeList = document.getElementById('knowledgeList');
    knowledgeList.innerHTML = '';
    const { data, error } = await supabase.from('knowledge').select('*').order('priority', { ascending: false });
    if (error) throw error;
    knowledgeEntries = data || [];
    if (knowledgeEntries.length === 0) {
      knowledgeList.innerHTML = '<p>No knowledge entries available.</p>';
      return;
    }
    knowledgeEntries.forEach(entry => {
      const card = document.createElement('div');
      card.className = 'knowledge-card';  // Style like template-card in CSS
      const keywords = Array.isArray(entry.keywords) ? entry.keywords.join(', ') : entry.keywords || 'None';
      card.innerHTML = `
        <h4>${entry.question}</h4>
        <p><strong>Category:</strong> ${entry.category}</p>
        <p><strong>Answer Preview:</strong> ${entry.answer.substring(0, 100)}...</p>
        <p><strong>Keywords:</strong> ${keywords}</p>
        <p><strong>Priority:</strong> ${entry.priority || 0} | <strong>Active:</strong> ${entry.is_active ? 'Yes' : 'No'}</p>
        <div class="button-container">
          <button class="btn" onclick="editKnowledge('${entry.id}')">Edit</button>
          <button class="btn btn-delete" onclick="deleteKnowledge('${entry.id}')">Delete</button>
        </div>
      `;
      knowledgeList.appendChild(card);
    });
  } catch (err) {
    console.error('Error fetching knowledge:', err);
    showResult('Failed to load knowledge.', false);
  }
}

// Add Knowledge Form Handler
const addKnowledgeForm = document.getElementById('addKnowledgeForm');
addKnowledgeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const entry = {
    category: formData.get('category'),
    question: formData.get('question').trim(),
    answer: formData.get('answer').trim(),
    keywords: formData.get('keywords') ? formData.get('keywords').split(',').map(k => k.trim()).filter(k => k) : [],
    priority: parseInt(formData.get('priority')) || 0,
    is_active: formData.get('is_active') === 'true'
  };
  if (!entry.question || !entry.answer || !entry.category) {
    showResult('Question, answer, and category are required.', false);
    return;
  }
  loadingPopup.style.display = 'flex';
  try {
    const { error } = await supabase.from('knowledge').insert([entry]);
    if (error) throw error;
    e.target.reset();
    showResult('Knowledge entry added successfully!', true);
    fetchKnowledge();
  } catch (err) {
    console.error('Error adding knowledge:', err);
    showResult(`Failed to add: ${err.message}`, false);
  } finally {
    loadingPopup.style.display = 'none';
  }
});

window.editKnowledge = async (id) => {
  try {
    const { data, error } = await supabase.from('knowledge').select('*').eq('id', id).single();
    if (error || !data) throw new Error('Knowledge entry not found');
    const entry = data;
    document.getElementById('editKnowledgeId').value = id;
    document.getElementById('editKnowledgeCategory').value = entry.category || '';  // Fixed ID
    document.getElementById('editQuestion').value = entry.question || '';
    document.getElementById('editAnswer').value = entry.answer || '';
    document.getElementById('editKeywords').value = Array.isArray(entry.keywords) ? entry.keywords.join(', ') : entry.keywords || '';
    document.getElementById('editPriority').value = entry.priority || 0;
    document.getElementById('editIsActive').value = entry.is_active ? 'true' : 'false';
    const editKnowledgeModal = document.getElementById('editKnowledgeModal');
    editKnowledgeModal.style.display = 'flex';

    // Clone form for fresh listener (like templates)
    const newEditForm = document.getElementById('editKnowledgeForm').cloneNode(true);
    document.getElementById('editKnowledgeForm').replaceWith(newEditForm);

    newEditForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const updatedData = {
        category: newEditForm.editCategory.value,  // Use renamed ID
        question: newEditForm.editQuestion.value.trim(),
        answer: newEditForm.editAnswer.value.trim(),
        keywords: newEditForm.editKeywords.value ? newEditForm.editKeywords.value.split(',').map(k => k.trim()).filter(k => k) : [],
        priority: parseInt(newEditForm.editPriority.value) || 0,
        is_active: newEditForm.editIsActive.value === 'true'
      };
      if (!updatedData.question || !updatedData.answer || !updatedData.category) {
        showResult('Question, answer, and category are required.', false);
        return;
      }
      loadingPopup.style.display = 'flex';
      try {
        const { error } = await supabase.from('knowledge').update(updatedData).eq('id', id);
        if (error) throw error;
        newEditForm.reset();
        editKnowledgeModal.style.display = 'none';
        showResult('Knowledge entry updated successfully!', true);
        fetchKnowledge();
      } catch (err) {
        console.error('Error updating knowledge:', err);
        showResult(`Failed to update: ${err.message}`, false);
      } finally {
        loadingPopup.style.display = 'none';
      }
    });
  } catch (error) {
    console.error('Error in editKnowledge:', error);
    showResult(`Failed to load: ${error.message}`, false);
  }
};

window.deleteKnowledge = (id) => {
  showConfirm('Are you sure you want to delete this knowledge entry?', async () => {
    loadingPopup.style.display = 'flex';
    try {
      const { error } = await supabase.from('knowledge').delete().eq('id', id);
      if (error) throw error;
      showResult('Knowledge entry deleted successfully!', true);
      fetchKnowledge();
    } catch (error) {
      console.error('Error deleting knowledge:', error);
      showResult(`Failed to delete: ${error.message}`, false);
    } finally {
      loadingPopup.style.display = 'none';
    }
  });
};

// Cancel Edit for Knowledge Modal
document.getElementById('cancelKnowledgeEdit').addEventListener('click', () => {
  document.getElementById('editKnowledgeModal').style.display = 'none';
  document.getElementById('editKnowledgeForm').reset();
});
//End of knowledge tab
  
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
window.toggleDetails = (cardId) => {
  const detailsDiv = document.getElementById(`details-${cardId}`);
  const toggleBtn = document.getElementById(`toggle-${cardId}`);
  if (detailsDiv.style.display === 'none' || detailsDiv.style.display === '') {
    detailsDiv.style.display = 'block';
    toggleBtn.textContent = 'Hide Details';
    toggleBtn.className = 'btn btn-cancel';  // Style as delete-like for hide
  } else {
    detailsDiv.style.display = 'none';
    toggleBtn.textContent = 'Show Details';
    toggleBtn.className = 'btn';  // Regular button style
  }
};

async function fetchCustomRequests() {
  try {
    const { data, error } = await supabase
      .from('custom_requests')
      .select('*')  // Fetch all columns
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
      card.id = `card-${request.id}`;
      // Group files by type (from JSONB array)
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
        <p><strong>Email:</strong> ${request.email}</p>
        <button id="toggle-${request.id}" class="btn" onclick="toggleDetails('${request.id}')">Show Details</button>
        <div id="details-${request.id}" style="display: none;">
          <p><strong>Phone:</strong> ${request.phone || 'N/A'}</p>
          <p><strong>Category:</strong> ${request.category}</p>
          <p><strong>Template:</strong> ${request.template || 'N/A'}</p>
          <p><strong>Price:</strong> ${request.price ? request.price.toFixed(2) : 'N/A'} ${request.currency || ''}</p>
          <p><strong>Message:</strong> ${request.message || 'N/A'}</p>
          <p><strong>Social Media:</strong> ${Array.isArray(request.social_media) ? request.social_media.join(', ') : 'N/A'}</p>
          <p><strong>Target Audience:</strong> ${request.target_audience || 'N/A'}</p>
          <p><strong>Country:</strong> ${request.country || 'N/A'}</p>
          <p><strong>Domain Choice:</strong> ${request.domain_choice || 'N/A'}</p>
          <p><strong>Domain Name:</strong> ${request.domain_name || 'N/A'}</p>
          <p><strong>Duration (months):</strong> ${request.duration || 'N/A'}</p>
          <p><strong>Pages:</strong> ${request.pages || 'N/A'}</p>
          <p><strong>Extra Pages:</strong> ${request.extra_pages || 'N/A'}</p>
          <p><strong>Theme Color:</strong> ${request.theme_color || 'N/A'}</p>
          <p><strong>Category Document (Legacy URL):</strong> ${request.category_document ? `<a href="${request.category_document}" target="_blank">View</a>` : 'N/A'}</p>
          <p><strong>Created At:</strong> ${new Date(request.created_at).toLocaleString()}</p>
          <h4>Files (Grouped by Type)</h4>
          <h5>Logo Files</h5>
          <ul>${logoList}</ul>
          <h5>Media Files</h5>
          <ul>${mediaList}</ul>
          <h5>Other Files</h5>
          <ul>${otherList}</ul>
          <h5>Category Document Files</h5>
          <ul>${docList}</ul>
        </div>
      `;
      customRequestList.appendChild(card);
    });
  } catch (error) {
    console.error('Error fetching custom requests:', error);
    customRequestList.innerHTML = '<p class="error">Failed to load custom requests.</p>';
  }
}
// This version adds optimistic UI update (removes the element immediately) and better error handling
window.deleteFile = async (requestId, fileUrl, fileType) => {
  showConfirm('Are you sure you want to delete this file?', async () => {
    // Optimistic UI update: Find and remove the specific <li> element immediately
    const liElement = event.target.closest('li');  // Assumes click is on button inside <li>
    if (liElement) {
      liElement.style.opacity = '0.5';  // Visual feedback
      liElement.innerHTML += '<span style="color: yellow; font-size: 12px;"> Deleting...</span>';
    }

    loadingPopup.style.display = 'flex';
    try {
      // Delete from storage
      const path = fileUrl.split('/').slice(-2).join('/');
      const { error: storageError } = await supabase.storage.from('custom_requests').remove([path]);
      if (storageError) throw new Error(`Storage delete failed: ${storageError.message}`);

      // Update DB: Fetch current files and filter
      const { data: request, error: fetchError } = await supabase.from('custom_requests').select('files').eq('id', requestId).single();
      if (fetchError) throw new Error(`Fetch error: ${fetchError.message}`);

      // Filter out the exact {url, type} match
      const updatedFiles = request.files.filter(fileObj => !(fileObj.url === fileUrl && fileObj.type === fileType));

      const { error: updateError } = await supabase.from('custom_requests').update({ files: updatedFiles }).eq('id', requestId);
      if (updateError) throw new Error(`DB update failed: ${updateError.message}`);

      // If UI element exists, remove it completely (optimistic success)
      if (liElement) {
        liElement.remove();
        // Check if the parent <ul> is now empty, and update message if so
        const ul = liElement.closest('ul');
        if (ul && ul.children.length === 0) {
          const sectionType = liElement.closest('h5').previousElementSibling ? liElement.closest('h5').textContent.toLowerCase().replace(' files', '') : fileType;
          ul.innerHTML = `<li>No ${sectionType} files uploaded</li>`;
        }
      }

      showResult('File deleted successfully!', true);
      // Optional: Re-fetch to ensure sync (but optimistic update should suffice for instant disappearance)
      // fetchCustomRequests();
    } catch (error) {
      console.error('Error deleting file:', error);
      showResult(`Failed to delete file: ${error.message}`, false);
      // Revert UI if error
      if (liElement) {
        liElement.style.opacity = '1';
        liElement.innerHTML = liElement.innerHTML.replace('<span style="color: yellow; font-size: 12px;"> Deleting...</span>', '');
      }
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
