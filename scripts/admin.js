import { supabase, supabaseUrl } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', async () => {
  const loginSection = document.getElementById('login-section');
  const adminContainer = document.getElementById('admin-container');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');

  // Check session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    showResult('Session error: ' + sessionError.message, 'error');
  }

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
    showConfirm('Are you sure you want to logout?', async (confirmed) => {
      if (!confirmed) return;
      const { error } = await supabase.auth.signOut();
      if (error) {
        showResult('Logout failed: ' + error.message, 'error');
        return;
      }
      window.location.reload();
    });
  });

  window.logout = () => {
    logoutBtn.click();
  };

  // Initialize admin functionality
  function initAdmin() {
    // Tab switching
    const btnTemplates = document.getElementById('btnTemplates');
    const btnSendEmail = document.getElementById('btnSendEmail');
    const btnChat = document.getElementById('btnChat');
    const btnCustomRequests = document.getElementById('btnCustomRequests');
    const sectionTemplates = document.getElementById('sectionTemplates');
    const sectionSendEmail = document.getElementById('sectionSendEmail');
    const sectionChat = document.getElementById('sectionChat');
    const sectionCustomRequests = document.getElementById('sectionCustomRequests');

    window.showSection = function(section) {
      btnTemplates.classList.remove('active');
      btnSendEmail.classList.remove('active');
      btnChat.classList.remove('active');
      btnCustomRequests.classList.remove('active');
      sectionTemplates.style.display = 'none';
      sectionSendEmail.style.display = 'none';
      sectionChat.style.display = 'none';
      sectionCustomRequests.style.display = 'none';
      if (section === 'templates') {
        btnTemplates.classList.add('active');
        sectionTemplates.style.display = 'block';
      } else if (section === 'email') {
        btnSendEmail.classList.add('active');
        sectionSendEmail.style.display = 'block';
      } else if (section === 'chat') {
        btnChat.classList.add('active');
        sectionChat.style.display = 'block';
      } else if (section === 'custom') {
        btnCustomRequests.classList.add('active');
        sectionCustomRequests.style.display = 'block';
      }
    };

    btnTemplates.addEventListener('click', () => showSection('templates'));
    btnSendEmail.addEventListener('click', () => showSection('email'));
    btnChat.addEventListener('click', () => showSection('chat'));
    btnCustomRequests.addEventListener('click', () => showSection('custom'));

    showSection('templates');

    // Fetch and display templates
    const templateList = document.getElementById('templateList');
    async function fetchTemplates() {
      try {
        const { data, error } = await supabase.from('templates').select('*');
        if (error) throw new Error(`Failed to fetch templates: ${error.message}`);

        templateList.innerHTML = '';

        if (!data || data.length === 0) {
          templateList.innerHTML = `<p>No templates available.</p>`;
          return;
        }

        data.forEach(template => {
          const card = document.createElement('div');
          card.className = 'template-card';
          card.innerHTML = `
            <img src="${template.image}" alt="${template.name} Template" style="max-width: 150px; border-radius: 6px;" />
            <h3>${template.name}</h3>
            <p>Category: ${template.category}</p>
            <p>Price: $${template.price.toFixed(2)}</p>
            <p>${template.description || ''}</p>
            <a href="${template.link}" target="_blank">Preview</a>
            <button onclick="editTemplate('${template.id}')" class="btn">Edit</button>
            <button onclick="deleteTemplate('${template.id}', '${template.image}')" class="btn btn-delete">Delete</button>
          `;
          templateList.appendChild(card);
        });
      } catch (error) {
        showResult(`Failed to load templates: ${error.message}`, 'error');
      }
    }

    fetchTemplates();

    // Image preview for upload
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
        preview.innerHTML = `<img src="${e.target.result}" alt="preview" style="max-width: 150px; border-radius: 6px;">`;
      };
      reader.readAsDataURL(file);
    });

    // Upload template
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      showConfirm('Double-check everything before submission?', async (confirmed) => {
        if (!confirmed) return;

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
            price: parseFloat(formData.get('price')),
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
          showResult(`Upload failed: ${err.message}`, 'error');
        } finally {
          loadingPopup.style.display = 'none';
          uploadBtn.disabled = false;
        }
      });
    });

    // Edit template
    window.editTemplate = async (id) => {
      const modal = document.getElementById('editTemplateModal');
      const form = document.getElementById('editTemplateForm');
      const nameInput = document.getElementById('editName');
      const categoryInput = document.getElementById('editCategory');
      const descriptionInput = document.getElementById('editDescription');
      const linkInput = document.getElementById('editLink');
      const priceInput = document.getElementById('editPrice');
      const imageFile = document.getElementById('editImageFile');
      const imagePreview = document.getElementById('editImagePreview');
      const loadingPopup = document.getElementById('loading-popup');

      try {
        const { data: existingData, error: fetchError } = await supabase.from('templates').select('*').eq('id', id).single();
        if (fetchError) throw new Error(`Failed to fetch template: ${fetchError.message}`);

        nameInput.value = existingData.name;
        categoryInput.value = existingData.category;
        descriptionInput.value = existingData.description || '';
        linkInput.value = existingData.link;
        priceInput.value = existingData.price.toFixed(2);
        imagePreview.innerHTML = existingData.image ? `<img src="${existingData.image}" alt="preview" style="max-width: 150px; border-radius: 6px;">` : '';

        modal.style.display = 'flex';

        imageFile.addEventListener('change', () => {
          const file = imageFile.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              imagePreview.innerHTML = `<img src="${e.target.result}" alt="preview" style="max-width: 150px; border-radius: 6px;">`;
            };
            reader.readAsDataURL(file);
          } else {
            imagePreview.innerHTML = existingData.image ? `<img src="${existingData.image}" alt="preview" style="max-width: 150px; border-radius: 6px;">` : '';
          }
        }, { once: true });

        form.onsubmit = async (e) => {
          e.preventDefault();
          showConfirm('Save changes to the template?', async (confirmed) => {
            if (!confirmed) return;
            loadingPopup.style.display = 'flex';

            let updateData = {
              name: nameInput.value,
              category: categoryInput.value,
              description: descriptionInput.value,
              link: linkInput.value,
              price: parseFloat(priceInput.value)
            };

            try {
              if (imageFile.files[0]) {
                const fileName = `${Date.now()}-${imageFile.files[0].name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                const { data: imgData, error: imgError } = await supabase.storage
                  .from('templates')
                  .upload(fileName, imageFile.files[0], { cacheControl: '3600', upsert: false, contentType: imageFile.files[0].type });
                if (imgError) throw new Error(`Image upload failed: ${imgError.message}`);
                updateData.image = `${supabaseUrl}/storage/v1/object/public/templates/${imgData.path}`;
              } else {
                updateData.image = existingData.image;
              }

              const { error: updateError } = await supabase.from('templates').update(updateData).eq('id', id);
              if (updateError) throw new Error(`Update failed: ${updateError.message}`);

              showResult('Template updated successfully!', 'success');
              fetchTemplates();
              modal.style.display = 'none';
            } catch (error) {
              showResult(`Edit failed: ${error.message}`, 'error');
            } finally {
              loadingPopup.style.display = 'none';
            }
          });
        };
      } catch (error) {
        showResult(`Failed to load template for editing: ${error.message}`, 'error');
      }
    };

    window.closeEditModal = () => {
      document.getElementById('editTemplateModal').style.display = 'none';
    };

    // Delete template
    window.deleteTemplate = async (id, imageUrl) => {
      showConfirm('Are you sure you want to delete this template?', async (confirmed) => {
        if (!confirmed) return;
        const loadingPopup = document.getElementById('loading-popup');
        loadingPopup.style.display = 'flex';
        try {
          // Delete the associated image from storage
          if (imageUrl) {
            const path = new URL(imageUrl).pathname.split('/storage/v1/object/public/templates/')[1];
            const { error: storageError } = await supabase.storage.from('templates').remove([path]);
            if (storageError) throw new Error(`Failed to delete image: ${storageError.message}`);
          }

          // Delete the template from the database
          const { error: dbError } = await supabase.from('templates').delete().eq('id', id);
          if (dbError) throw new Error(`Failed to delete template: ${dbError.message}`);

          showResult('Template deleted successfully!', 'success');
          fetchTemplates();
        } catch (error) {
          showResult(`Delete failed: ${error.message}`, 'error');
        } finally {
          loadingPopup.style.display = 'none';
        }
      });
    };

    // Email sending
    const emailForm = document.getElementById('emailForm');
    emailForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      showConfirm('Double-check email details before sending?', async (confirmed) => {
        if (!confirmed) return;
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
          showResult('Failed to send email: ' + err.message, 'error');
        } finally {
          loadingPopup.style.display = 'none';
          emailBtn.disabled = false;
        }
      });
    });

    // Fetch and display chat requests
    const chatRequestList = document.getElementById('chatRequestList');
    const chatReplyForm = document.getElementById('chatReplyForm');
    const replyUserId = document.getElementById('replyUserId');
    const replyUserInfo = document.getElementById('replyUserInfo');
    const replyMessage = document.getElementById('replyMessage');
    const replyBtn = document.getElementById('reply-btn');
    const chatResult = document.getElementById('chatResult');

    async function fetchChatRequests() {
      try {
        const cutoffDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id, name, email, created_at')
          .gte('created_at', cutoffDate);
        if (userError) throw new Error(`User fetch error: ${userError.message}`);

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
            .order('created_at', { ascending: false })
            .limit(5);
          if (msgError) throw new Error(`Message fetch error: ${msgError.message}`);

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
              <button onclick="deleteConversation('${user.id}')" class="btn btn-delete">Delete Conversation</button>
            `;
            chatRequestList.appendChild(card);
          }
        }
      } catch (error) {
        showResult(`Failed to load chat requests: ${error.message}`, 'error');
      }
    }

    // Delete conversation and user
    window.deleteConversation = async (userId) => {
      showConfirm('Are you sure you want to delete this conversation and user data?', async (confirmed) => {
        if (!confirmed) return;
        const loadingPopup = document.getElementById('loading-popup');
        loadingPopup.style.display = 'flex';
        try {
          const { error: msgError } = await supabase
            .from('messages')
            .delete()
            .eq('user_id', userId);
          if (msgError) throw new Error(`Failed to delete messages: ${msgError.message}`);

          const { error: userError } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);
          if (userError) throw new Error(`Failed to delete user: ${userError.message}`);

          showChatResult('Conversation and user deleted successfully!', 'success');
          fetchChatRequests();
        } catch (error) {
          showChatResult(`Failed to delete conversation: ${error.message}`, 'error');
        } finally {
          loadingPopup.style.display = 'none';
        }
      });
    };

    // Subscribe to real-time updates for chat
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

    // Subscribe to real-time updates for custom requests
    supabase.channel('custom_requests_admin')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'custom_requests'
      }, () => {
        fetchCustomRequests();
      })
      .subscribe();

    // Initial load and periodic refresh
    fetchChatRequests();
    setInterval(fetchChatRequests, 30000);
    fetchCustomRequests();

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
      showConfirm('Send reply?', async (confirmed) => {
        if (!confirmed) return;
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
          if (error) throw new Error(`Failed to send reply: ${error.message}`);

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
    });

    // Fetch and display custom requests
    const customRequestList = document.getElementById('customRequestList');
    async function fetchCustomRequests() {
      try {
        const { data, error } = await supabase.from('custom_requests').select('*').order('created_at', { ascending: false });
        if (error) throw new Error(`Failed to fetch custom requests: ${error.message}`);

        customRequestList.innerHTML = '';

        if (!data || data.length === 0) {
          customRequestList.innerHTML = `<p>No custom requests available.</p>`;
          return;
        }

        data.forEach(request => {
          const card = document.createElement('div');
          card.className = 'custom-request-card';
          card.innerHTML = `
            <h3>${request.first_name} ${request.last_name}</h3>
            <p>Email: ${request.email}</p>
            <p>Created At: ${new Date(request.created_at).toLocaleString()}</p>
            <button onclick="toggleDetails('${request.id}')" class="btn">Show/Hide Details</button>
            <div id="details-${request.id}" style="display: none;">
              <p>Category: ${request.category}</p>
              <p>Template: ${request.template}</p>
              <p>Social Media: ${request.social_media ? request.social_media.join(', ') : 'None'}</p>
              <p>Phone: ${request.phone || 'None'}</p>
              <p>Purpose: ${request.purpose || 'None'}</p>
              <p>Target Audience: ${request.target_audience || 'None'}</p>
              <p>Country: ${request.country}</p>
              <p>Domain Choice: ${request.domain_choice}</p>
              <p>Domain Name: ${request.domain_name || 'None'}</p>
              <p>Duration: ${request.duration} months</p>
              <p>Pages: ${request.pages}</p>
              <p>Extra Pages: ${request.extra_pages || 'None'}</p>
              <p>Logo: ${request.logo_url ? `<a href="${request.logo_url}" target="_blank">View Logo</a> <button onclick="downloadFile('${request.logo_url}')">Download</button> <button onclick="deleteFile('${request.logo_url}', '${request.id}')">Delete</button>` : 'None'}</p>
              <p>Media Files:</p>
              <ul>
                ${request.media_urls ? request.media_urls.map(url => `<li><a href="${url}" target="_blank">View Media</a> <button onclick="downloadFile('${url}')">Download</button> <button onclick="deleteFile('${url}', '${request.id}')">Delete</button></li>`).join('') : '<li>None</li>'}
              </ul>
              <p>Other Files:</p>
              <ul>
                ${request.other_urls ? request.other_urls.map(url => `<li><a href="${url}" target="_blank">View File</a> <button onclick="downloadFile('${url}')">Download</button> <button onclick="deleteFile('${url}', '${request.id}')">Delete</button></li>`).join('') : '<li>None</li>'}
              </ul>
              <p>Theme Color: ${request.theme_color}</p>
            </div>
            <button onclick="deleteRequest('${request.id}')" class="btn btn-delete">Delete Request</button>
          `;
          customRequestList.appendChild(card);
        });
      } catch (error) {
        showResult(`Failed to load custom requests: ${error.message}`, 'error');
      }
    }

    // Toggle details
    window.toggleDetails = (id) => {
      const details = document.getElementById(`details-${id}`);
      details.style.display = details.style.display === 'none' ? 'block' : 'none';
    };

    // Download file
    window.downloadFile = async (url) => {
      try {
        const path = new URL(url).pathname.split('/storage/v1/object/public/custom_requests/')[1];
        const { data, error } = await supabase.storage.from('custom_requests').download(path);
        if (error) throw new Error(`Download failed: ${error.message}`);

        const blob = new Blob([data]);
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = path.split('/').pop() || 'file';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        showResult(`Download failed: ${error.message}`, 'error');
      }
    };

    // Delete file
    window.deleteFile = async (url, requestId) => {
      showConfirm('Are you sure you want to delete this file?', async (confirmed) => {
        if (!confirmed) return;
        try {
          const path = new URL(url).pathname.split('/storage/v1/object/public/custom_requests/')[1];
          const { error } = await supabase.storage.from('custom_requests').remove([path]);
          if (error) throw new Error(`Delete failed: ${error.message}`);
          showResult('File deleted successfully!', 'success');
          fetchCustomRequests();
        } catch (error) {
          showResult(`Delete failed: ${error.message}`, 'error');
        }
      });
    };

    // Delete entire request
    window.deleteRequest = async (id) => {
      showConfirm('Are you sure you want to delete this request and all associated files?', async (confirmed) => {
        if (!confirmed) return;
        loadingPopup.style.display = 'flex';
        try {
          const { data: request, error: fetchError } = await supabase.from('custom_requests').select('logo_url, media_urls, other_urls').eq('id', id).single();
          if (fetchError) throw new Error(`Failed to fetch request: ${fetchError.message}`);

          const paths = [];
          if (request.logo_url) paths.push(new URL(request.logo_url).pathname.split('/storage/v1/object/public/custom_requests/')[1]);
          if (request.media_urls) request.media_urls.forEach(url => paths.push(new URL(url).pathname.split('/storage/v1/object/public/custom_requests/')[1]));
          if (request.other_urls) request.other_urls.forEach(url => paths.push(new URL(url).pathname.split('/storage/v1/object/public/custom_requests/')[1]));

          if (paths.length > 0) {
            const { error: storageError } = await supabase.storage.from('custom_requests').remove(paths);
            if (storageError) throw new Error(`Failed to delete files: ${storageError.message}`);
          }

          const { error: deleteError } = await supabase.from('custom_requests').delete().eq('id', id);
          if (deleteError) throw new Error(`Failed to delete request: ${deleteError.message}`);

          showResult('Request and files deleted successfully!', 'success');
          fetchCustomRequests();
        } catch (error) {
          showResult(`Delete failed: ${error.message}`, 'error');
        } finally {
          loadingPopup.style.display = 'none';
        }
      });
    };

    // Show result for templates and email
    function showResult(message, type) {
      result.textContent = message;
      result.className = type === 'success' ? 'success' : 'error';
      result.style.display = 'block';
      setTimeout(() => result.style.display = 'none', 5000);
    }

    // Show chat result
    function showChatResult(message, type) {
      chatResult.textContent = message;
      chatResult.className = type === 'success' ? 'success' : 'error';
      chatResult.style.display = 'block';
      setTimeout(() => chatResult.style.display = 'none', 5000);
    }

    // Show confirmation modal
    window.showConfirm = (message, callback) => {
      const modal = document.getElementById('confirmModal');
      const messageElement = document.getElementById('confirmMessage');
      const yesBtn = document.getElementById('confirmYes');
      const noBtn = document.getElementById('confirmNo');

      messageElement.textContent = message;
      modal.style.display = 'flex';

      yesBtn.onclick = () => {
        callback(true);
        modal.style.display = 'none';
      };
      noBtn.onclick = () => {
        callback(false);
        modal.style.display = 'none';
      };
    };
  }
});