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
const VAPID_PUBLIC_KEY = 'B03rZz8NEfC6w8aKYNC2WVKXqkaHK1Gsp8i0LBanfhLjcR4S0eZvA57sYXRmTehshsAxjpDvgeOQfiRaAW6xbbA';

async function showStartChatPopup() {
  return new Promise(resolve => {
    const popup = document.createElement('div');
    popup.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: #1e1e2f; padding: 20px; border-radius: 10px; z-index: 1000;
      box-shadow: 0 4px 10px rgba(0,0,0,0.5); color: #eee; text-align: center;
      width: 80%; max-width: 400px;
    `;
    popup.innerHTML = `
      <h3 style="margin-bottom: 15px;">Start Chat</h3>
      <input type="email" id="emailInput" placeholder="Enter your email" style="padding: 10px; width: 100%; border-radius: 5px; margin-bottom: 15px; border: 1px solid #4fc3f7; background: #1e1e1e; color: #fff;">
      <select id="topicSelect" style="padding: 10px; width: 100%; border-radius: 5px; margin-bottom: 15px; border: 1px solid #4fc3f7; background: #1e1e1e; color: #fff;">
        <option value="" disabled selected>Select a topic</option>
        <option value="Templates">Templates</option>
        <option value="Pricing">Pricing</option>
        <option value="Support">Support</option>
        <option value="Other">Other</option>
      </select>
      <input type="text" id="nameInput" placeholder="Enter your name" style="padding: 10px; width: 100%; border-radius: 5px; margin-bottom: 15px; border: 1px solid #4fc3f7; background: #1e1e1e; color: #fff;">
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
      }
    });
  });
}

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      return subscription;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  }
  return null;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

async function startChat() {
  const userInfo = await showStartChatPopup();
  if (!userInfo) return;

  const { email, topic, name } = userInfo;
  selectedTopic = topic;

  const { data } = await supabase.from('users').select().eq('email', email).single();
  const permission = await Notification.requestPermission();
  const subscription = await registerServiceWorker();

  if (data) {
    user = data;
    if (subscription && user.push_subscription !== JSON.stringify(subscription)) {
      await supabase.from('users').update({
        push_subscription: JSON.stringify(subscription),
        notification_permission: permission === 'granted'
      }).eq('id', user.id);
    }
    localStorage.setItem('chat_user_id', user.id);
    loadMessages(user.id);
  } else {
    const { data: newUser } = await supabase.from('users').insert({
      name,
      email,
      notification_permission: permission === 'granted',
      push_subscription: subscription ? JSON.stringify(subscription) : null
    }).select().single();
    user = newUser;
    localStorage.setItem('chat_user_id', user.id);
    loadMessages(user.id);
  }
}

async function loadMessages(userId) {
  const { data } = await supabase.from('messages').select().eq('user_id', userId).order('created_at');
  chatMessages.innerHTML = '';
  data.forEach(msg => {
    const div = document.createElement('div');
    div.classList.add('msg', msg.is_auto || msg.sender === 'support' ? 'support-msg' : 'user-msg');
    div.innerHTML = `<span class="msg-content">${msg.content}</span><span class="msg-timestamp">${new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
    chatMessages.appendChild(div);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addLocalMessage(content, sender = 'user') {
  const div = document.createElement('div');
  div.classList.add('msg', sender === 'support' ? 'support-msg' : 'user-msg');
  div.innerHTML = `<span class="msg-content">${content}</span><span class="msg-timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendDefaultMessage() {
  if (!hasSentFirstMessage && user) {
    hasSentFirstMessage = true;
    const defaultMessage = `Hello ${user.name}, thank you for reaching out! Our team will attend to you shortly. Please check back soon for a response.`;
    addLocalMessage(defaultMessage, 'support');
    await supabase.from('messages').insert({
      user_id: user.id,
      content: defaultMessage,
      sender: 'support',
      is_auto: true
    });
  }
}

window.onload = async () => {
  const userId = localStorage.getItem('chat_user_id');
  if (userId) {
    const { data } = await supabase.from('users').select().eq('id', userId).single();
    if (data) {
      user = data;
      loadMessages(userId);
      subscribeToMessages();
    } else {
      localStorage.removeItem('chat_user_id');
      startChat();
    }
  } else {
    startChat();
  }
};

async function subscribeToMessages() {
  if (!user) return;
  supabase.channel('chat')
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'messages', 
      filter: `user_id=eq.${user.id}`
    }, payload => {
      const msg = payload.new;
      if (msg.user_id === user.id) {
        addLocalMessage(msg.content, msg.sender);
      }
    })
    .subscribe();
}

sendChat.addEventListener('click', async () => {
  let text = chatInput.value.trim();
  if (text && user) {
    if (selectedTopic) {
      text = `[Topic: ${selectedTopic}] ${text}`;
      selectedTopic = '';
    }
    addLocalMessage(text);
    const { error } = await supabase.from('messages').insert({ user_id: user.id, content: text, sender: 'user' });
    if (!error) {
      chatInput.value = '';
      await sendDefaultMessage();
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
    const { data } = await supabase.storage.from('chat-files').upload(`${user.id}/${file.name}`, file);
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
      sender: 'user' 
    });
    if (!error) {
      fileInput.value = '';
      filePreview.innerHTML = '';
      await sendDefaultMessage();
    }
  }
});

navigator.serviceWorker.addEventListener('message', event => {
  const { title, body } = event.data;
  addLocalMessage(body, 'support');
});
