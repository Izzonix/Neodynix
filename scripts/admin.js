import { supabase } from './supabase-config.js';

const chatRequests = document.getElementById('chatRequests');
const templateRequests = document.getElementById('templateRequests');
const templateEditModal = document.getElementById('templateEditModal');
const templateEditForm = document.getElementById('templateEditForm');

async function fetchChatRequests() {
  try {
    const { data, error } = await supabase.from('messages').select(`
      id,
      user_id,
      content,
      sender,
      is_auto,
      replied,
      file_url,
      created_at,
      users (
        name,
        email,
        topic
      )
    `).order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching chat requests:', error.message, error.code);
      alert(`Failed to load chat requests: ${error.message || 'Unknown error'}`);
      return;
    }
    displayChatRequests(data);
  } catch (err) {
    console.error('Unexpected error fetching chat requests:', err);
    alert('Unexpected error loading chat requests. Please try again.');
  }
}

function displayChatRequests(requests) {
  chatRequests.innerHTML = '';
  const groupedByUser = requests.reduce((acc, msg) => {
    if (!acc[msg.user_id]) {
      acc[msg.user_id] = {
        user: msg.users,
        messages: []
      };
    }
    acc[msg.user_id].messages.push(msg);
    return acc;
  }, {});

  for (const userId in groupedByUser) {
    const { user, messages } = groupedByUser[userId];
    const requestDiv = document.createElement('div');
    requestDiv.classList.add('chat-request');
    requestDiv.innerHTML = `
      <h3>${user.name} (${user.email})</h3>
      <p><strong>Topic:</strong> ${user.topic || 'None'}</p>
      <div class="messages">
        ${messages.map(msg => `
          <div class="message ${msg.sender === 'support' ? 'support' : 'user'}">
            <p>${msg.content}</p>
            ${msg.file_url ? `<a href="${msg.file_url}" target="_blank">Download File</a>` : ''}
            <p><small>${new Date(msg.created_at).toLocaleString()}</small></p>
          </div>
        `).join('')}
      </div>
      <div class="actions">
        <button class="reply" data-user-id="${userId}">Reply</button>
        <button class="delete" data-user-id="${userId}">Delete</button>
      </div>
    `;
    chatRequests.appendChild(requestDiv);
  }

  document.querySelectorAll('.reply').forEach(button => {
    button.addEventListener('click', () => {
      const userId = button.dataset.userId;
      const replyInput = prompt('Enter your reply:');
      if (replyInput) {
        sendReply(userId, replyInput);
      }
    });
  });

  document.querySelectorAll('.delete').forEach(button => {
    button.addEventListener('click', () => {
      const userId = button.dataset.userId;
      deleteChatMessage(userId);
    });
  });
}

async function sendReply(userId, content) {
  try {
    // Insert reply as a new message
    const { error: insertError } = await supabase.from('messages').insert({
      user_id: userId,
      content,
      sender: 'support',
      is_auto: false
    });
    if (insertError) {
      console.error('Error inserting reply:', insertError.message, insertError.code);
      alert(`Failed to send reply: ${insertError.message || 'Unknown error'}`);
      return;
    }

    // Update replied status for user’s messages
    const { error: updateError } = await supabase.from('messages')
      .update({ replied: true })
      .eq('user_id', userId)
      .eq('sender', 'user');
    if (updateError) {
      console.error('Error updating replied status:', updateError.message, updateError.code);
      alert(`Failed to update replied status: ${updateError.message || 'Unknown error'}`);
      return;
    }

    fetchChatRequests(); // Refresh chat requests
  } catch (err) {
    console.error('Unexpected error sending reply:', err);
    alert('Failed to send reply: Unexpected error');
  }
}

async function deleteChatMessage(userId) {
  try {
    // Fetch messages to get file URLs
    const { data: messages, error: fetchError } = await supabase.from('messages').select('file_url').eq('user_id', userId);
    if (fetchError) {
      console.error('Error fetching messages for deletion:', fetchError.message);
      alert(`Failed to delete: ${fetchError.message}`);
      return;
    }

    // Delete files from storage
    for (const msg of messages) {
      if (msg.file_url) {
        const path = msg.file_url.split('/').pop();
        const { error: storageError } = await supabase.storage.from('chat-files').remove([`${userId}/${path}`]);
        if (storageError) {
          console.error('Error deleting file:', storageError.message);
        }
      }
    }

    // Delete messages
    const { error: messageError } = await supabase.from('messages').delete().eq('user_id', userId);
    if (messageError) {
      console.error('Error deleting messages:', messageError.message);
      alert(`Failed to delete messages: ${messageError.message}`);
      return;
    }

    // Delete user
    const { error: userError } = await supabase.from('users').delete().eq('id', userId);
    if (userError) {
      console.error('Error deleting user:', userError.message);
      alert(`Failed to delete user: ${userError.message}`);
      return;
    }

    fetchChatRequests(); // Refresh chat requests
  } catch (err) {
    console.error('Unexpected error deleting chat:', err);
    alert('Failed to delete: Unexpected error');
  }
}

async function fetchTemplates() {
  try {
    const { data, error } = await supabase.from('templates').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching templates:', error.message);
      alert('Failed to load templates');
      return;
    }
    displayTemplates(data);
  } catch (err) {
    console.error('Unexpected error fetching templates:', err);
    alert('Unexpected error loading templates');
  }
}

function displayTemplates(templates) {
  templateRequests.innerHTML = '';
  templates.forEach(template => {
    const templateDiv = document.createElement('div');
    templateDiv.classList.add('template-request');
    templateDiv.innerHTML = `
      <h3>${template.name}</h3>
      <img src="${template.image_url}" alt="${template.name}" style="max-width: 150px; max-height: 100px;">
      <p>Category: ${template.category}</p>
      <p>Price: ${template.price}</p>
      <button class="edit" data-id="${template.id}">Edit</button>
      <button class="delete" data-id="${template.id}">Delete</button>
    `;
    templateRequests.appendChild(templateDiv);
  });

  document.querySelectorAll('.edit').forEach(button => {
    button.addEventListener('click', () => {
      const templateId = button.dataset.id;
      showEditModal(templateId);
    });
  });

  document.querySelectorAll('.delete').forEach(button => {
    button.addEventListener('click', () => {
      const templateId = button.dataset.id;
      deleteTemplate(templateId);
    });
  });
}

async function showEditModal(templateId) {
  try {
    const { data, error } = await supabase.from('templates').select('*').eq('id', templateId).single();
    if (error) {
      console.error('Error fetching template:', error.message);
      alert('Failed to load template');
      return;
    }
    templateEditForm.innerHTML = `
      <label>Name: <input type="text" name="name" value="${data.name}" required></label>
      <label>Category: <input type="text" name="category" value="${data.category}" required></label>
      <label>Price: <input type="number" name="price" value="${data.price}" required></label>
      <label>Image: <input type="file" name="image" accept="image/*"></label>
      <button type="submit">Save</button>
    `;
    templateEditModal.style.display = 'block';
    templateEditForm.dataset.id = templateId;
  } catch (err) {
    console.error('Unexpected error showing edit modal:', err);
    alert('Unexpected error loading template');
  }
}

templateEditForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const templateId = templateEditForm.dataset.id;
  const formData = new FormData(templateEditForm);
  const updates = {
    name: formData.get('name'),
    category: formData.get('category'),
    price: parseFloat(formData.get('price'))
  };
  const file = formData.get('image');

  try {
    if (file && file.size > 0) {
      const { data: oldTemplate, error: fetchError } = await supabase.from('templates').select('image_url').eq('id', templateId).single();
      if (fetchError) {
        console.error('Error fetching old template:', fetchError.message);
      } else if (oldTemplate.image_url) {
        const path = oldTemplate.image_url.split('/').pop();
        await supabase.storage.from('templates').remove([path]);
      }
      const { data: uploadData, error: uploadError } = await supabase.storage.from('templates').upload(`${templateId}/${file.name}`, file);
      if (uploadError) {
        console.error('Error uploading new image:', uploadError.message);
        alert('Failed to upload image');
        return;
      }
      updates.image_url = supabase.storage.from('templates').getPublicUrl(uploadData.path).data.publicUrl;
    }

    const { error } = await supabase.from('templates').update(updates).eq('id', templateId);
    if (error) {
      console.error('Error updating template:', error.message);
      alert('Failed to update template');
      return;
    }
    templateEditModal.style.display = 'none';
    fetchTemplates();
  } catch (err) {
    console.error('Unexpected error updating template:', err);
    alert('Unexpected error updating template');
  }
});

async function deleteTemplate(templateId) {
  try {
    const { data, error: fetchError } = await supabase.from('templates').select('image_url').eq('id', templateId).single();
    if (fetchError) {
      console.error('Error fetching template for deletion:', fetchError.message);
    } else if (data.image_url) {
      const path = data.image_url.split('/').pop();
      await supabase.storage.from('templates').remove([path]);
    }

    const { error } = await supabase.from('templates').delete().eq('id', templateId);
    if (error) {
      console.error('Error deleting template:', error.message);
      alert('Failed to delete template');
      return;
    }
    fetchTemplates();
  } catch (err) {
    console.error('Unexpected error deleting template:', err);
    alert('Unexpected error deleting template');
  }
}

window.onload = () => {
  fetchChatRequests();
  fetchTemplates();
};