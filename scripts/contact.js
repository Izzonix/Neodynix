// contact.js
import { supabase } from './supabase-config.js';

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const fileInput = document.getElementById('fileInput');
const sendChat = document.getElementById('sendChat');
const attachFile = document.getElementById('attachFile');

let user = null;
let selectedTopic = '';
const VAPID_PUBLIC_KEY = 'B03rZz8NEfC6w8aKYNC2WVKXqkaHK1Gsp8i0LBanfhLjcR4S0eZvA57sYXRtTehshsAxjpDvgeOQfiRaAW6xbbA';

// ----- Topic Popup -----
async function showTopicPopup() {
  return new Promise(resolve => {
    const popup = document.createElement('div');
    popup.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: #1e1e2f; padding: 20px; border-radius: 10px; z-index: 1000;
      box-shadow: 0 4px 10px rgba(0,0,0,0.5); color: #eee; text-align: center;
    `;
    popup.innerHTML = `
      <h3 style="margin-bottom: 15px;">What would you like to talk about?</h3>
      <select id="topicSelect" style="padding: 10px; width: 100%; border-radius: 5px; margin-bottom: 15px;">
        <option value="" disabled selected>Select a topic</option>
        <option value="Templates">Templates</option>
        <option value="Pricing">Pricing</option>
        <option value="Support">Support</option>
        <option value="Other">Other</option>
      </select>
      <button id="submitTopic" style="padding: 10px 20px; background: #4fc3f7; border: none; border-radius: 5px; color: #fff; cursor: pointer;">Start Chat</button>
    `;
    document.body.appendChild(popup);

    document.getElementById('submitTopic').addEventListener('click', () => {
      selectedTopic = document.getElementById('topicSelect').value;
      if (selectedTopic) {
        popup.remove();
        resolve(selectedTopic);
      }
    });
  });
}

// ----- Service Worker & Push Subscription -----
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('Service worker registered:', registration);

    if (!('PushManager' in window)) {
      console.log('Push API not supported in this browser');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notifications permission denied');
      return null;
    }

    const subscription = await registration.pushManager.getSubscription() ||
      await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

    console.log('Push subscription:', subscription);
    return subscription;

  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

// ----- Start Chat -----
async function startChat() {
  const email = prompt('Enter your email:');
  if (!email) return;

  selectedTopic = await showTopicPopup();
  if (!selectedTopic) return;

  const name = prompt('Enter your name:');
  if (!name) return;

  const { data } = await supabase.from('users').select().eq('email', email).single();
  const subscription = await registerServiceWorker();
  const notificationGranted = subscription !== null;

  if (data) {
    user = data;
    if (subscription && user.push_subscription !== JSON.stringify(subscription)) {
      await supabase.from('users').update({
        push_subscription: JSON.stringify(subscription),
        notification_permission: notificationGranted
      }).eq('id', user.id);
    }
    localStorage.setItem('chat_user_id', user.id);
    loadMessages(user.id);
    subscribeToMessages();
  } else {
    const { data: newUser } = await supabase.from('users').insert({
      name,
      email,
      notification_permission: notificationGranted,
      push_subscription: subscription ? JSON.stringify(subscription) : null
    }).select().single();
    user = newUser;
    localStorage.setItem('chat_user_id', user.id);
    loadMessages(user.id);
    subscribeToMessages();
  }
}

// ----- Load Messages -----
async function loadMessages(userId) {
  const { data } = await supabase.from('messages').select().eq('user_id', userId).order('created_at');
  chatMessages.innerHTML = '';
  data.forEach(msg => {
    addLocalMessage(msg.content, msg.sender === 'support' ? 'support' : 'user', msg.created_at);
  });
}

// ----- Add Local Message -----
function addLocalMessage(content, sender = 'user', timestamp = new Date()) {
  const div = document.createElement('div');
  div.classList.add('msg', sender === 'support' ? 'support-msg' : 'user-msg');
  div.innerHTML = `<span class="msg-content">${content}</span>
                   <span class="msg-timestamp">${new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ----- Real-time Subscription -----
function subscribeToMessages() {
  if (!user) return;
  supabase.channel('chat')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `user_id=eq.${user.id}`
    }, payload => {
      const msg = payload.new;
      addLocalMessage(msg.content, msg.sender === 'support' ? 'support' : 'user', msg.created_at);
    })
    .subscribe();
}

// ----- Event Listeners -----
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

sendChat.addEventListener('click', async () => {
  let text = chatInput.value.trim();
  if (text && user) {
    if (selectedTopic) {
      text = `[Topic: ${selectedTopic}] ${text}`;
      selectedTopic = '';
    }
    addLocalMessage(text);
    const { error } = await supabase.from('messages').insert({
      user_id: user.id,
      content: text,
      sender: 'user'
    });
    if (!error) chatInput.value = '';
  }
});

attachFile.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async () => {
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
    if (!error) fileInput.value = '';
  }
});

navigator.serviceWorker.addEventListener('message', event => {
  const { title, body } = event.data;
  addLocalMessage(body, 'support');
});
