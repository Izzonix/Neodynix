import { supabase } from './supabase-config.js';

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const fileInput = document.getElementById('fileInput');
const sendChat = document.getElementById('sendChat');
const attachFile = document.getElementById('attachFile');
let user = null;

async function startChat() {
  const email = prompt('Enter your email:');
  if (!email) return;
  const { data } = await supabase.from('users').select().eq('email', email).single();
  if (data) {
    user = data;
    localStorage.setItem('chat_user_id', user.id);
    loadMessages(user.id);
  } else {
    const name = prompt('Enter your name:');
    if (name) {
      const permission = await Notification.requestPermission();
      const { data: newUser } = await supabase.from('users').insert({
        name,
        email,
        notification_permission: permission === 'granted'
      }).select().single();
      user = newUser;
      localStorage.setItem('chat_user_id', user.id);
      loadMessages(user.id);
    }
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

function addLocalMessage(content) {
  const div = document.createElement('div');
  div.classList.add('msg', 'user-msg');
  div.innerHTML = `<span class="msg-content">${content}</span><span class="msg-timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

window.onload = async () => {
  const userId = localStorage.getItem('chat_user_id');
  if (userId) {
    const { data } = await supabase.from('users').select().eq('id', userId).single();
    if (data) {
      user = data;
      loadMessages(userId);
    } else {
      localStorage.removeItem('chat_user_id');
      startChat();
    }
  } else {
    startChat();
  }
};

sendChat.addEventListener('click', async () => {
  const text = chatInput.value.trim();
  if (text && user) {
    // Add message locally before sending
    addLocalMessage(text);
    await supabase.from('messages').insert({ user_id: user.id, content: text, sender: 'user' });
    chatInput.value = '';
  }
});

attachFile.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (file && user) {
    const { data } = await supabase.storage.from('chat-files').upload(`${user.id}/${file.name}`, file);
    const url = supabase.storage.from('chat-files').getPublicUrl(data.path).data.publicUrl;
    addLocalMessage(`📎 Sent file: <a href="${url}" target="_blank">${file.name}</a>`);
    await supabase.from('messages').insert({ 
      user_id: user.id, 
      content: `📎 Sent file: <a href="${url}" target="_blank">${file.name}</a>`, 
      sender: 'user' 
    });
    fileInput.value = '';
  }
});

supabase.channel('chat').on('postgres_changes', { 
  event: 'INSERT', 
  schema: 'public', 
  table: 'messages', 
  filter: `user_id=eq.${user?.id}`
}, payload => {
  const msg = payload.new;
  if (msg.user_id === user?.id) {
    const div = document.createElement('div');
    div.classList.add('msg', msg.is_auto || msg.sender === 'support' ? 'support-msg' : 'user-msg');
    div.innerHTML = `<span class="msg-content">${msg.content}</span><span class="msg-timestamp">${new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    if (msg.sender === 'support' && user?.notification_permission) {
      new Notification('New Reply', {
        body: 'Our team has responded. Check the chat!',
        icon: '/favicon.ico'
      });
    }
  }
}).subscribe();
