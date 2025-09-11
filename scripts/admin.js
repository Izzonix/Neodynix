import { supabase, supabaseUrl } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', async () => {
  const loginSection = document.getElementById('login-section');
  const adminContainer = document.getElementById('admin-container');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');

  // Check session
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    loginSection.style.display = 'none';
    adminContainer.style.display = 'block';
    initAdmin();
  } else {
    loginSection.style.display = 'block';
    adminContainer.style.display = 'none';
  }

  // Login form submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      loginError.textContent = error.message;
      loginError.style.display = 'block';
    } else {
      loginSection.style.display = 'none';
      adminContainer.style.display = 'block';
      initAdmin();
    }
  });

  // Logout
  logoutBtn.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      window.location.reload();
    }
  });

  // Initialize admin functionality
  function initAdmin() {
    // ----- Tab switching -----
    const btnTemplates = document.getElementById('btnTemplates');
    const btnSendEmail = document.getElementById('btnSendEmail');
    const btnChat = document.getElementById('btnChat');
    const sectionTemplates = document.getElementById('sectionTemplates');
    const sectionSendEmail = document.getElementById('sectionSendEmail');
    const sectionChat = document.getElementById('sectionChat');

    function showSection(section) {
      btnTemplates.classList.remove('active');
      btnSendEmail.classList.remove('active');
      btnChat.classList.remove('active');
      sectionTemplates.style.display = 'none';
      sectionSendEmail.style.display = 'none';
      sectionChat.style.display = 'none';
      if (section === 'templates') {
        btnTemplates.classList.add('active');
        sectionTemplates.style.display = 'block';
      } else if (section === 'email') {
        btnSendEmail.classList.add('active');
        sectionSendEmail.style.display = 'block';
      } else if (section === 'chat') {
        btnChat.classList.add('active');
        sectionChat.style.display = 'block';
      }
    }

    btnTemplates.addEventListener('click', () => showSection('templates'));
    btnSendEmail.addEventListener('click', () => showSection('email'));
    btnChat.addEventListener('click', () => showSection('chat'));

    showSection('templates');

    // ----- Fetch and display templates -----
    const templateList = document.getElementById('templateList');
    async function fetchTemplates() {
      try {
        const { data, error } = await supabase.from('templates').select('*');
        if (error) throw error;

        templateList.innerHTML = '';

        if (!data || data.length === 0) {
          templateList.innerHTML = `<p>No templates available.</p>`;
          return;
        }

        data.forEach(template => {
          const card = document.createElement('div');
          card.className = 'template-card';
          card.innerHTML = `
            <img src="${template.image}" alt="${template.name} Template" style="max-width: 100%; border-radius: 6px;" />
            <h3>${template.name}</h3>
            <p>Category: ${template.category}</p>
            <p>${template.description || ''}</p>
            <a href="${template.link}" target="_blank">Preview</a>
            <button onclick="editTemplate(${template.id})" class="btn">Edit</button>
            <button onclick="deleteTemplate(${template.id})" class="btn btn-delete">Delete</button>
          `;
          templateList.appendChild(card);
        });
      } catch (error) {
        console.error('Error fetching templates:', error);
        templateList.innerHTML = `<p class="error">Failed to load templates.</p>`;
      }
    }

    // Initial load
    fetchTemplates();

    // ----- Image preview -----
    const imageFile = document.getElementById('imageFile');
    const preview = document.getElementById('imagePreview');
    const uploadForm = document.getElementById('uploadForm');
    const result = document.getElementById('result');
    const loadingPopup = document.getElementById('loading-popup');
    const uploadBtn = document.getElementById('upload-btn');
    const emailBtn = document.getElementById('email-btn');

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
      if (!confirm('Double-check everything before submission?')) return;

      loadingPopup.style.display = 'flex';
      uploadBtn.disabled = true;

      const formData = new FormData(uploadForm);
      const file = imageFile.files[0];

      if (!file) {
        showResult('Please select a file.', 'error');
        loadingPopup.style.display = 'none';
        uploadBtn.disabled = false;
        return;
      }

      try {
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

        const data = {
          name: formData.get('name'),
          category: formData.get('category'),
          description: formData.get('description'),
          link: formData.get('link'),
          image: imageUrl,
          created_at: new Date().toISOString()
        };

        const { error } = await supabase.from('templates').insert(data);
        if (error) throw new Error(`Database insert failed: ${error.message}`);

        showResult('Data and file posted successfully!', 'success');
        uploadForm.reset();
        preview.innerHTML = '';
        fetchTemplates();
      } catch (err) {
        showResult(err.message, 'error');
        console.error('Submission error:', err);
      } finally {
        loadingPopup.style.display = 'none';
        uploadBtn.disabled = false;
      }
    });

    // ----- Edit template -----
    window.editTemplate = async (id) => {
      if (!confirm('Double-check everything before submission?')) return;

      loadingPopup.style.display = 'flex';

      const { data: existingData, error: fetchError } = await supabase.from('templates').select('*').eq('id', id).single();
      if (fetchError) {
        showResult('Failed to fetch template.', 'error');
        loadingPopup.style.display = 'none';
        return;
      }

      const name = prompt('New name:', existingData.name) || existingData.name;
      const category = prompt('New category:', existingData.category) || existingData.category;
      const description = prompt('New description:', existingData.description) || existingData.description;
      const link = prompt('New link:', existingData.link) || existingData.link;

      let updateData = { name, category, description, link };

      const file = imageFile.files[0];
      if (file) {
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { data: imgData, error: imgError } = await supabase.storage
          .from('templates')
          .upload(fileName, file, { cacheControl: '3600', upsert: false, contentType: file.type });
        if (imgError) {
          showResult(`Image upload failed: ${imgError.message}`, 'error');
          loadingPopup.style.display = 'none';
          return;
        }
        updateData.image = `${supabaseUrl}/storage/v1/object/public/templates/${imgData.path}`;
      } else {
        updateData.image = existingData.image;
      }

      const { error: updateError } = await supabase.from('templates').update(updateData).eq('id', id);
      if (updateError) {
        showResult(`Update failed: ${updateError.message}`, 'error');
      } else {
        showResult('Template updated successfully!', 'success');
        fetchTemplates();
      }
      loadingPopup.style.display = 'none';
    };

    // ----- Delete template -----
    window.deleteTemplate = async (id) => {
      if (!confirm('Are you sure?')) return;
      loadingPopup.style.display = 'flex';
      const { error } = await supabase.from('templates').delete().eq('id', id);
      loadingPopup.style.display = 'none';
      if (error) {
        showResult(`Delete failed: ${error.message}`, 'error');
        return;
      }
      showResult('Template deleted!', 'success');
      fetchTemplates();
    };

    // ----- Email sending -----
    const emailForm = document.getElementById('emailForm');
    emailForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!confirm('Double-check everything before submission?')) return;

      loadingPopup.style.display = 'flex';
      emailBtn.disabled = true;

      const formData = new FormData(emailForm);

      if (!window.emailjs) {
        showResult('EmailJS not loaded!', 'error');
        loadingPopup.style.display = 'none';
        emailBtn.disabled = false;
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
      } finally {
        loadingPopup.style.display = 'none';
        emailBtn.disabled = false;
      }
    });

    // ----- Fetch and display chat requests -----
    const chatRequestList = document.getElementById('chatRequestList');
    const chatReplyForm = document.getElementById('chatReplyForm');
    const replyUserId = document.getElementById('replyUserId');
    const replyUserInfo = document.getElementById('replyUserInfo');
    const replyMessage = document.getElementById('replyMessage');
    const replyBtn = document.getElementById('reply-btn');
    const chatResult = document.getElementById('chatResult');

    async function fetchChatRequests() {
      try {
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id, name, email')
          .gte('created_at', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString());
        if (userError) throw userError;

        chatRequestList.innerHTML = '';

        if (!users || users.length === 0) {
          chatRequestList.innerHTML = `<p>No pending chat requests.</p>`;
          return;
        }

        for (const user of users) {
          const { data: messages, error: msgError } = await supabase
            .from('messages')
            .select('id, content, created_at, sender')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          if (msgError) throw msgError;

          const userMessages = messages.filter(msg => msg.sender === 'user');
          if (userMessages.length > 0) {
            const card = document.createElement('div');
            card.className = 'chat-request-card';
            card.innerHTML = `
              <h3>${user.name}</h3>
              <p>Email: ${user.email}</p>
              ${userMessages.map(msg => `
                <p>Message: ${msg.content}</p>
                <p>Time: ${new Date(msg.created_at).toLocaleString()}</p>
              `).join('')}
              <button onclick="selectUserForReply('${user.id}', '${user.name}', '${user.email}')" class="btn">Reply</button>
            `;
            chatRequestList.appendChild(card);
          }
        }
      } catch (error) {
        console.error('Error fetching chat requests:', error);
        chatRequestList.innerHTML = `<p class="error">Failed to load chat requests.</p>`;
      }
    }

    // Subscribe to real-time updates
    supabase.channel('chat_admin')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: 'sender=eq.user'
      }, () => {
        fetchChatRequests();
      })
      .subscribe();

    // Initial load and periodic refresh
    fetchChatRequests();
    setInterval(fetchChatRequests, 30000);

    // Select user for reply
    window.selectUserForReply = (userId, name, email) => {
      replyUserId.value = userId;
      replyUserInfo.textContent = `Replying to ${name} (${email})`;
      replyMessage.value = '';
      chatResult.style.display = 'none';
    };

    // Send reply
    chatReplyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!confirm('Send reply?')) return;

      loadingPopup.style.display = 'flex';
      replyBtn.disabled = true;

      const userId = replyUserId.value;
      const message = replyMessage.value.trim();

      if (!userId || !message) {
        showChatResult('Please select a user and enter a message.', 'error');
        loadingPopup.style.display = 'none';
        replyBtn.disabled = false;
        return;
      }

      try {
        const { error } = await supabase.from('messages').insert({
          user_id: userId,
          content: message,
          sender: 'support',
          is_auto: false
        });
        if (error) throw error;

        showChatResult('Reply sent successfully!', 'success');
        chatReplyForm.reset();
        replyUserInfo.textContent = '';
        fetchChatRequests();
      } catch (error) {
        showChatResult(`Failed to send reply: ${error.message}`, 'error');
      } finally {
        loadingPopup.style.display = 'none';
        replyBtn.disabled = false;
      }
    });

    // Show chat result
    function showChatResult(message, type) {
      chatResult.textContent = message;
      chatResult.className = type === 'success' ? 'success' : 'error';
      chatResult.style.display = 'block';
      setTimeout(() => chatResult.style.display = 'none', 5000);
    }

    // Show result for templates and email
    function showResult(message, type) {
      result.textContent = message;
      result.className = type === 'success' ? 'success' : 'error';
      result.style.display = 'block';
      setTimeout(() => result.style.display = 'none', 5000);
    }
  }
});
