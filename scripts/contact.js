import { supabase } from './supabase-config.js';

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const fileInput = document.getElementById('fileInput');
const filePreview = document.getElementById('filePreview');
const sendChat = document.getElementById('sendChat');
const attachFile = document.getElementById('attachFile');
let user = null;
let selectedTopic = '';
let hasSentFirstMessage = false;

async function showStartChatPopup() {
  return new Promise(resolve => {
    const popup = document.createElement('div');
    popup.id = 'startChatPopup';
    popup.style.cssText = `
      position: fixed !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important;
      background: #1e1e2f !important; padding: 20px !important; border-radius: 10px !important; z-index: 1000 !important;
      box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important; color: #eee !important; text-align: center !important;
      width: 80% !important; max-width: 400px !important;
    `;
    popup.innerHTML = `
      <h3 style="margin-bottom: 15px;">Start Chat</h3>
      <input type="email" id="emailInput" placeholder="Enter your email" style="padding: 10px; width: 100%; border-radius: 5px; margin-bottom: 15px; border: 1px solid #4fc3f7; background: #1e1e1e; color: #fff;" required>
      <select id="topicSelect" style="padding: 10px; width: 100%; border-radius: 5px; margin-bottom: 15px; border: 1px solid #4fc3f7; background: #1e1e1e; color: #fff;" required>
        <option value="" disabled selected>Select a topic</option>
        <option value="Templates">Templates</option>
        <option value="Pricing">Pricing</option>
        <option value="Support">Support</option>
        <option value="Other">Other</option>
      </select>
      <input type="text" id="nameInput" placeholder="Enter your name" style="padding: 10px; width: 100%; border-radius: 5px; margin-bottom: 15px; border: 1px solid #4fc3f7; background: #1e1e1e; color: #fff;" required>
      <button id="submitInfo" style="padding: 10px 20px; background: #4fc3f7; border: none; border-radius: 5px; color: #000; cursor: pointer;">Start Chat</button>
    `;
    document.body.appendChild(popup);

    document.getElementById('submitInfo').addEventListener('click', () => {
      const email = document.getElementById('emailInput').value.trim();
      const topic = document.getElementById('topicSelect').value;
      const name = document.getElementById('nameInput').value.trim();
      if (email && topic && name) {
        popup.remove();
        resolve({ email, topic, name });
      } else {
        alert('Please fill in all fields.');
      }
    });
  });
}

async function startChat() {
  try {
    const userInfo = await showStartChatPopup();
    if (!userInfo) return;

    const { email, topic, name } = userInfo;
    selectedTopic = topic;

    // Generate a consistent userId from email (hex-encoded)
    const userId = Array.from(new TextEncoder().encode(email))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    localStorage.setItem('chat_user_id', userId);

    // Check if user exists
    const { data, error } = await supabase.from('users').select().eq('id', userId).single();
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user:', error.message, error.code);
      alert(`Error fetching user data: ${error.message}`);
      return;
    }

    if (data) {
      user = data;
      if (user.name !== name || user.topic !== topic) {
        const { error: updateError } = await supabase.from('users').update({
          name,
          topic
        }).eq('id', user.id);
        if (updateError) {
          console.error('Error updating user:', updateError.message);
          alert(`Error updating user data: ${updateError.message}`);
          return;
        }
      }
    } else {
      const { data: newUser, error: insertError } = await supabase.from('users').insert({
        id: userId,
        name,
        email,
        topic
      }).select().single();
      if (insertError) {
        console.error('Error inserting user:', insertError.message, insertError.code);
        alert(`Error saving user data: ${insertError.message}`);
        return;
      }
      user = newUser;
    }

    loadMessages(user.id);
    subscribeToMessages();

    // Send first auto-reply if not already sent
    const autoReplySent = localStorage.getItem('autoReplySent');
    if (!autoReplySent) {
      const autoReplyMessage = `Thank you for contacting us about ${topic}. Please specify your issue or question related to this topic.`;
      addLocalMessage(autoReplyMessage, 'support');
      const { error } = await supabase.from('messages').insert({
        user_id: user.id,
        content: autoReplyMessage,
        sender: 'support',
        is_auto: true
      });
      if (error) {
        console.error('Error sending first auto-reply:', error.message);
      } else {
        localStorage.setItem('autoReplySent', 'true');
      }
    }
  } catch (err) {
    console.error('Unexpected error in startChat:', err);
    alert('Unexpected error starting chat. Please try again.');
  }
}

async function loadMessages(userId) {
  try {
    const { data, error } = await supabase.from('messages').select().eq('user_id', userId).order('created_at');
    if (error) {
      console.error('Error loading messages:', error.message);
      alert('Failed to load messages. Please try again.');
      return;
    }
    chatMessages.innerHTML = '';
    data.forEach(msg => {
      const div = document.createElement('div');
      div.classList.add('msg', msg.is_auto ? 'auto-msg' : msg.sender === 'support' ? 'support-msg' : 'user-msg');
      const content = msg.file_url ? `${msg.content} <a href="${msg.file_url}" target="_blank">View File</a>` : msg.content;
      div.innerHTML = `<span class="msg-content">${content}</span><span class="msg-timestamp">${new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
      chatMessages.appendChild(div);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } catch (err) {
    console.error('Error in loadMessages:', err);
    alert('Unexpected error loading messages. Please try again.');
  }
}

function addLocalMessage(content, sender = 'user') {
  const div = document.createElement('div');
  div.classList.add('msg', sender === 'support' ? 'support-msg' : sender === 'auto' ? 'auto-msg' : 'user-msg');
  div.innerHTML = `<span class="msg-content">${content}</span><span class="msg-timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function subscribeToMessages() {
  if (!user) return;
  try {
    supabase.channel('chat')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `user_id=eq.${user.id}`
      }, async payload => {
        const msg = payload.new;
        if (msg.user_id === user.id) {
          addLocalMessage(msg.file_url ? `${msg.content} <a href="${msg.file_url}" target="_blank">View File</a>` : msg.content, msg.is_auto ? 'auto' : msg.sender);
          
          // Check for second auto-reply
          if (!msg.is_auto && msg.sender === 'user') {
            const secondAutoReplySent = localStorage.getItem('secondAutoReplySent');
            if (!secondAutoReplySent) {
              const { data: messages, error: messagesError } = await supabase
                .from('messages')
                .select('is_auto')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });
              if (messagesError) {
                console.error('Error checking messages for second auto-reply:', messagesError.message);
                return;
              }
              const hasFirstAutoReply = messages.some(m => m.is_auto);
              const userMessages = messages.filter(m => !m.is_auto && m.sender === 'user');
              if (hasFirstAutoReply && userMessages.length === 1) {
                const secondAutoReplyMessage = 'Thank you for providing details. Our team will review your issue and reply soon. Please check back for updates.';
                addLocalMessage(secondAutoReplyMessage, 'auto');
                const { error } = await supabase.from('messages').insert({
                  user_id: user.id,
                  content: secondAutoReplyMessage,
                  sender: 'support',
                  is_auto: true
                });
                if (error) {
                  console.error('Error sending second auto-reply:', error.message);
                } else {
                  localStorage.setItem('secondAutoReplySent', 'true');
                }
              }
            }
          }
        }
      })
      .subscribe();
  } catch (err) {
    console.error('Error subscribing to messages:', err);
  }
}

window.onload = async () => {
  const userId = localStorage.getItem('chat_user_id');
  if (userId) {
    try {
      const { data, error } = await supabase.from('users').select().eq('id', userId).single();
      if (error) {
        console.error('Error fetching user from localStorage:', error.message);
        localStorage.removeItem('chat_user_id');
        localStorage.removeItem('autoReplySent');
        localStorage.removeItem('secondAutoReplySent');
        startChat();
        return;
      }
      if (data) {
        user = data;
        selectedTopic = data.topic || '';
        loadMessages(userId);
        subscribeToMessages();
      } else {
        localStorage.removeItem('chat_user_id');
        localStorage.removeItem('autoReplySent');
        localStorage.removeItem('secondAutoReplySent');
        startChat();
      }
    } catch (err) {
      console.error('Unexpected error in onload:', err);
      localStorage.removeItem('chat_user_id');
      localStorage.removeItem('autoReplySent');
      localStorage.removeItem('secondAutoReplySent');
      startChat();
    }
  } else {
    startChat();
  }
};

sendChat.addEventListener('click', async () => {
  let text = chatInput.value.trim();
  if (text && user) {
    let content = selectedTopic ? `[Topic: ${selectedTopic}] ${text}` : text;
    addLocalMessage(content);
    try {
      const { error } = await supabase.from('messages').insert({ 
        user_id: user.id, 
        content, 
        sender: 'user',
        is_auto: false
      });
      if (error) {
        console.error('Error sending message:', error.message);
        alert('Failed to send message. Please try again.');
        return;
      }
      chatInput.value = '';
      selectedTopic = ''; // Clear topic after first message
      hasSentFirstMessage = true;
    } catch (err) {
      console.error('Unexpected error sending message:', err);
      alert('Unexpected error sending message. Please try again.');
    }
  }
});

attachFile.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) {
    filePreview.innerHTML = `
      <div class="file-preview-item">
        <span>${file.name}</span>
        <button class="delete-file" title="Remove File">✖</button>
      </div>
    `;
    const deleteButton = filePreview.querySelector('.delete-file');
    deleteButton.addEventListener('click', () => {
      fileInput.value = '';
      filePreview.innerHTML = '';
    });
  }
});

filePreview.addEventListener('click', async (event) => {
  if (event.target.classList.contains('delete-file')) return;
  const file = fileInput.files[0];
  if (file && user) {
    try {
      const { data, error: uploadError } = await supabase.storage.from('chat-files').upload(`${user.id}/${Date.now()}_${file.name}`, file);
      if (uploadError) {
        console.error('Error uploading file:', uploadError.message);
        alert('Failed to upload file. Please try again.');
        return;
      }
      const url = supabase.storage.from('chat-files').getPublicUrl(data.path).data.publicUrl;
      let content = `📎 Sent file: <a href="${url}" target="_blank">${file.name}</a>`;
      if (selectedTopic) {
        content = `[Topic: ${selectedTopic}] ${content}`;
        selectedTopic = '';
      }
      addLocalMessage(content);
      const { error } = await supabase.from('messages').insert({ 
        user_id: user.id, 
        content, 
        sender: 'user',
        is_auto: false,
        file_url: url
      });
      if (error) {
        console.error('Error saving file message:', error.message);
        alert('Failed to save file message. Please try again.');
        return;
      }
      fileInput.value = '';
      filePreview.innerHTML = '';
      hasSentFirstMessage = true;
    } catch (err) {
      console.error('Unexpected error uploading file:', err);
      alert('Unexpected error uploading file. Please try again.');
    }
  }
});
