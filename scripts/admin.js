import { supabase } from './supabase-config.js';

const chatRequests = document.getElementById('chatRequests');
const templateList = document.getElementById('templateList');
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

async function showSection(sectionId) {
  sections.forEach(section => {
    section.style.display = section.id === sectionId ? 'block' : 'none';
  });
}

async function fetchChatRequests() {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id, user_id, content, created_at, replied, file_url, users(name, email, topic)')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching chat requests:', error.message, error.code);
      alert(`Failed to load chat requests: ${error.message}`);
      return;
    }
    chatRequests.innerHTML = '';
    const groupedMessages = data.reduce((acc, msg) => {
      if (!acc[msg.user_id]) {
        acc[msg.user_id] = {
          name: msg.users.name,
          email: msg.users.email,
          topic: msg.users.topic || 'None',
          messages: []
        };
      }
      acc[msg.user_id].messages.push(msg);
      return acc;
    }, {});

    Object.entries(groupedMessages).forEach(([userId, { name, email, topic, messages }]) => {
      const div = document.createElement('div');
      div.classList.add('chat-request');
      div.innerHTML = `
        <h3>${name} (${email})</h3>
        <p><strong>Topic:</strong> ${topic}</p>
        <div class="messages">
          ${messages.map(msg => `
            <div class="message ${msg.replied ? 'replied' : ''}">
              <p>${msg.content}</p>
              <p><small>${new Date(msg.created_at).toLocaleString()}</small></p>
              ${msg.file_url ? `<a href="${msg.file_url}" target="_blank">Download File</a>` : ''}
              <button class="reply-btn" data-message-id="${msg.id}" data-user-id="${userId}">Reply</button>
              <button class="delete-btn" data-message-id="${msg.id}">Delete</button>
            </div>
          `).join('')}
        </div>
        <div class="reply-form" style="display: none;">
          <textarea class="reply-text" placeholder="Type your reply..."></textarea>
          <button class="send-reply-btn" data-user-id="${userId}">Send Reply</button>
        </div>
      `;
      chatRequests.appendChild(div);
    });

    document.querySelectorAll('.reply-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const form = btn.closest('.chat-request').querySelector('.reply-form');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
      });
    });

    document.querySelectorAll('.send-reply-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const replyForm = btn.closest('.reply-form');
        const replyText = replyForm.querySelector('.reply-text').value.trim();
        const userId = btn.dataset.userId;
        const messageId = btn.closest('.chat-request').querySelector('.reply-btn').dataset.messageId;
        if (!replyText) {
          alert('Please enter a reply.');
          return;
        }
        if (!userId || !messageId) {
          alert('Missing user or message ID.');
          return;
        }
        await sendReply(messageId, userId, replyText);
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const messageId = btn.dataset.messageId;
        if (!messageId) {
          alert('Invalid message ID.');
          return;
        }
        await deleteChatMessage(messageId);
      });
    });
  } catch (err) {
    console.error('Unexpected error in fetchChatRequests:', err);
    alert('Failed to load chat requests: Unexpected error.');
  }
}

async function sendReply(messageId, userId, replyText) {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    if (userError || !userData) {
      console.error('Error verifying user:', userError?.message || 'User not found');
      alert(`Failed to send reply: User not found.`);
      return;
    }

    const { error: insertError } = await supabase.from('messages').insert({
      user_id: userId,
      content: replyText,
      sender: 'support',
      is_auto: false
    });
    if (insertError) {
      console.error('Error inserting reply:', insertError.message, insertError.code);
      alert(`Failed to send reply: ${insertError.message}`);
      return;
    }

    const { error: updateError } = await supabase
      .from('messages')
      .update({ replied: true })
      .eq('id', messageId);
    if (updateError) {
      console.error('Error updating message status:', updateError.message, updateError.code);
      alert(`Failed to update message status: ${updateError.message}`);
      return;
    }

    await fetchChatRequests();
  } catch (err) {
    console.error('Unexpected error in sendReply:', err);
    alert('Failed to send reply: Unexpected error.');
  }
}

async function deleteChatMessage(messageId) {
  try {
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('file_url')
      .eq('id', messageId)
      .single();
    if (fetchError) {
      console.error('Error fetching message:', fetchError.message);
      alert(`Failed to fetch message: ${fetchError.message}`);
      return;
    }

    if (message.file_url) {
      const filePath = message.file_url.split('/').slice(-2).join('/');
      const { error: storageError } = await supabase.storage
        .from('chat-files')
        .remove([filePath]);
      if (storageError) {
        console.error('Error deleting file:', storageError.message);
        alert(`Failed to delete file: ${storageError.message}`);
        return;
      }
    }

    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);
    if (deleteError) {
      console.error('Error deleting message:', deleteError.message);
      alert(`Failed to delete message: ${deleteError.message}`);
      return;
    }

    await fetchChatRequests();
  } catch (err) {
    console.error('Unexpected error in deleteChatMessage:', err);
    alert('Failed to delete message: Unexpected error.');
  }
}

async function fetchTemplates() {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('id, name, category, price, image_url')
      .order('name');
    if (error) {
      console.error('Error fetching templates:', error.message, error.code);
      alert(`Failed to load templates: ${error.message}`);
      return;
    }
    templateList.innerHTML = '';
    data.forEach(template => {
      const div = document.createElement('div');
      div.classList.add('template-card');
      div.innerHTML = `
        <img src="${template.image_url}" alt="${template.name}" style="max-width: 150px; max-height: 100px;">
        <h3>${template.name}</h3>
        <p>Category: ${template.category}</p>
        <p>Price: ${template.price}</p>
        <button class="edit-template-btn" data-template-id="${template.id}">Edit</button>
        <button class="delete-template-btn" data-template-id="${template.id}">Delete</button>
      `;
      templateList.appendChild(div);
    });

    document.querySelectorAll('.edit-template-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const templateId = btn.dataset.templateId;
        await showEditTemplateModal(templateId);
      });
    });

    document.querySelectorAll('.delete-template-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const templateId = btn.dataset.templateId;
        if (confirm('Are you sure you want to delete this template?')) {
          await deleteTemplate(templateId);
        }
      });
    });
  } catch (err) {
    console.error('Unexpected error in fetchTemplates:', err);
    alert('Failed to load templates: Unexpected error.');
  }
}

async function showEditTemplateModal(templateId) {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('id, name, category, price, image_url')
      .eq('id', templateId)
      .single();
    if (error) {
      console.error('Error fetching template:', error.message);
      alert(`Failed to load template: ${error.message}`);
      return;
    }

    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
      <div class="modal-content" style="max-height: 80vh; overflow-y: auto;">
        <h3>Edit Template</h3>
        <input type="text" id="templateName" value="${data.name}" placeholder="Template Name">
        <input type="text" id="templateCategory" value="${data.category}" placeholder="Category">
        <input type="number" id="templatePrice" value="${data.price}" placeholder="Price">
        <input type="file" id="templateImage" accept="image/*">
        <button id="saveTemplate">Save</button>
        <button id="closeModal">Close</button>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('saveTemplate').addEventListener('click', async () => {
      const name = document.getElementById('templateName').value.trim();
      const category = document.getElementById('templateCategory').value.trim();
      const price = parseFloat(document.getElementById('templatePrice').value);
      const imageFile = document.getElementById('templateImage').files[0];

      if (!name || !category || isNaN(price)) {
        alert('Please fill in all fields with valid data.');
        return;
      }

      let imageUrl = data.image_url;
      if (imageFile) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('templates')
          .upload(`${templateId}/${Date.now()}_${imageFile.name}`, imageFile);
        if (uploadError) {
          console.error('Error uploading image:', uploadError.message);
          alert(`Failed to upload image: ${uploadError.message}`);
          return;
        }
        imageUrl = supabase.storage.from('templates').getPublicUrl(uploadData.path).data.publicUrl;
      }

      const { error: updateError } = await supabase
        .from('templates')
        .update({ name, category, price, image_url: imageUrl })
        .eq('id', templateId);
      if (updateError) {
        console.error('Error updating template:', updateError.message);
        alert(`Failed to update template: ${updateError.message}`);
        return;
      }

      modal.remove();
      await fetchTemplates();
    });

    document.getElementById('closeModal').addEventListener('click', () => {
      modal.remove();
    });
  } catch (err) {
    console.error('Unexpected error in showEditTemplateModal:', err);
    alert('Failed to load template modal: Unexpected error.');
  }
}

async function deleteTemplate(templateId) {
  try {
    const { data, error: fetchError } = await supabase
      .from('templates')
      .select('image_url')
      .eq('id', templateId)
      .single();
    if (fetchError) {
      console.error('Error fetching template:', fetchError.message);
      alert(`Failed to fetch template: ${fetchError.message}`);
      return;
    }

    if (data.image_url) {
      const filePath = data.image_url.split('/').slice(-2).join('/');
      const { error: storageError } = await supabase.storage
        .from('templates')
        .remove([filePath]);
      if (storageError) {
        console.error('Error deleting template image:', storageError.message);
        alert(`Failed to delete template image: ${storageError.message}`);
        return;
      }
    }

    const { error: deleteError } = await supabase
      .from('templates')
      .delete()
      .eq('id', templateId);
    if (deleteError) {
      console.error('Error deleting template:', deleteError.message);
      alert(`Failed to delete template: ${deleteError.message}`);
      return;
    }

    await fetchTemplates();
  } catch (err) {
    console.error('Unexpected error in deleteTemplate:', err);
    alert('Failed to delete template: Unexpected error.');
  }
}

hamburger.addEventListener('click', () => {
  navMenu.classList.toggle('active');
});

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const sectionId = link.getAttribute('href').substring(1);
    showSection(sectionId);
    navMenu.classList.remove('active');
  });
});

window.onload = async () => {
  await fetchChatRequests();
  await fetchTemplates();
  showSection('chat-section');
};