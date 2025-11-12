import { supabase } from './supabase-config.js';

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const fileInput = document.getElementById('fileInput');
const filePreview = document.getElementById('filePreview');
const sendChat = document.getElementById('sendChat');
const attachFile = document.getElementById('attachFile');
let user = null;
let selectedTopic = '';
let knowledgeBase = [];
let isSubscribed = false; // ← Prevents double subscription

// Fetch knowledge base from Supabase
async function loadKnowledgeBase() {
  try {
    const { data, error } = await supabase
      .from('knowledge')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });
    
    if (error) throw error;
    knowledgeBase = data || [];
    console.log('Knowledge base loaded:', knowledgeBase.length, 'entries');
  } catch (err) {
    console.error('Error loading knowledge base:', err);
  }
}

// Generate AI response using Cloudflare Workers AI
async function getAIResponse(userMessage, topic) {
  try {
    // Wait for knowledge to load
    while (knowledgeBase.length === 0) {
      console.log('Waiting for knowledge...');
      await new Promise(r => setTimeout(r, 100));
    }

    const relevantKnowledge = knowledgeBase.filter(k => 
      !topic || k.category.toLowerCase() === topic.toLowerCase() || k.category === 'General'
    );

    console.log(`Sending ${relevantKnowledge.length} knowledge items to AI`);

    const response = await fetch('/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        topic,
        knowledgeBase: relevantKnowledge
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    return data.success ? data.message : "I'll connect you with a human agent.";

  } catch (err) {
    console.error('AI Error:', err);
    return "I'm having trouble right now. A human agent will assist you shortly.";
  }
}

async function showStartChatPopup() {
  return new Promise(resolve => {
    const popup = document.createElement('div');
    popup.id = 'startChatPopup';
    popup.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: #1c2526; padding: 24px; border-radius: 12px; z-index: 1000;
      box-shadow: 0 4px 10px rgba(0,0,0,0.5); color: #eceff1; text-align: center;
      width: 90%; max-width: 400px; box-sizing: border-box;
    `;

    popup.innerHTML = `
      <h3 style="margin-bottom: 20px; color: #80deea; font-size: clamp(1.5rem, 3.5vw, 1.8rem);">Start Chat</h3>
      <input type="email" id="emailInput" placeholder="Enter your email" required
        style="padding: 12px; width: 100%; box-sizing: border-box; border-radius: 8px; margin-bottom: 15px;
        border: 1px solid #80deea; background: #263238; color: #eceff1; font-size: clamp(0.9rem, 2.5vw, 1rem);">
      <select id="topicSelect" required
        style="padding: 12px; width: 100%; box-sizing: border-box; border-radius: 8px; margin-bottom: 15px;
        border: 1px solid #80deea; background: #263238; color: #eceff1; font-size: clamp(0.9rem, 2.5vw, 1rem);">
        <option value="" disabled selected>Select a topic</option>
        <option value="Templates">Templates</option>
        <option value="Pricing">Pricing</option>
        <option value="Support">Support</option>
        <option value="Other">Other</option>
      </select>
      <input type="text" id="nameInput" placeholder="Enter your name" required
        style="padding: 12px; width: 100%; box-sizing: border-box; border-radius: 8px; margin-bottom: 15px;
        border: 1px solid #80deea; background: #263238; color: #eceff1; font-size: clamp(0.9rem, 2.5vw, 1rem);">
      <button id="submitInfo"
        style="padding: 12px 24px; background: #4fc3f7; border: none; border-radius: 8px; color: #121212;
        cursor: pointer; font-size: clamp(0.9rem, 2.5vw, 1rem); transition: background 0.3s;">
        Start Chat
      </button>
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

    const userId = Array.from(new TextEncoder().encode(email))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem('chat_user_id', userId);

    const { data, error } = await supabase.from('users').select().eq('id', userId).single();
    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      user = data;
      if (user.name !== name || user.topic !== topic) {
        await supabase.from('users').update({ name, topic }).eq('id', userId);
      }
    } else {
      const { data: newUser } = await supabase.from('users').insert({
        id: userId, name, email, topic
      }).select().single();
      user = newUser;
    }

    const autoReplySent = localStorage.getItem('autoReplySent');
    if (!autoReplySent) {
      const autoReplyMessage = `Hello ${name}, thank you for contacting us about ${topic}. I'm your AI assistant and I'm here to help!`;
      await supabase.from('messages').insert({
        user_id: user.id,
        content: autoReplyMessage,
        sender: 'support',
        is_auto: true
      });
      localStorage.setItem('autoReplySent', 'true');
      addLocalMessage(autoReplyMessage, 'auto');
    }

    await loadMessages(user.id);
    subscribeToMessages(); // ← Only once

  } catch (err) {
    console.error('Error in startChat:', err);
    alert('Error starting chat. Please try again.');
  }
}

async function loadMessages(userId) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;

    chatMessages.innerHTML = '';
    data.forEach(msg => {
      const content = msg.file_url
        ? `${msg.content} <a href="${msg.file_url}" target="_blank">View File</a>`
        : msg.content;
      addLocalMessage(content, msg.is_auto ? 'auto' : msg.sender);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } catch (err) {
    console.error('Error loading messages:', err);
  }
}

function addLocalMessage(content, sender = 'user') {
  const existing = Array.from(chatMessages.children).some(el => 
    el.querySelector('.msg-content')?.textContent === content.trim()
  );
  if (existing) return; // ← Prevents duplicates

  const div = document.createElement('div');
  div.classList.add('msg', 
    sender === 'support' ? 'support-msg' : 
    sender === 'auto' ? 'auto-msg' : 'user-msg'
  );
  div.innerHTML = `
    <span class="msg-content">${content}</span>
    <span class="msg-timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
  `;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function subscribeToMessages() {
  if (isSubscribed || !user) return;
  isSubscribed = true;

  supabase.channel('chat')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `user_id=eq.${user.id}`
    }, payload => {
      const msg = payload.new;
      if (msg.user_id === user.id) {
        const content = msg.file_url
          ? `${msg.content} <a href="${msg.file_url}" target="_blank">View File</a>`
          : msg.content;
        addLocalMessage(content, msg.is_auto ? 'auto' : msg.sender);
      }
    })
    .subscribe();
}

window.onload = async () => {
  await loadKnowledgeBase();

  const userId = localStorage.getItem('chat_user_id');
  if (userId) {
    try {
      const { data, error } = await supabase.from('users').select().eq('id', userId).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        user = data;
        selectedTopic = data.topic || '';
        await loadMessages(userId);
        subscribeToMessages();
      } else {
        startChat();
      }
    } catch (err) {
      localStorage.clear();
      startChat();
    }
  } else {
    startChat();
  }
};

sendChat.addEventListener('click', async () => {
  let text = chatInput.value.trim();
  if (text && user) {
    sendChat.disabled = true;
    let content = selectedTopic ? `[Topic: ${selectedTopic}] ${text}` : text;
    addLocalMessage(content);
    chatInput.value = '';

    try {
      await supabase.from('messages').insert({
        user_id: user.id,
        content,
        sender: 'user',
        is_auto: false
      });

      const typingDiv = document.createElement('div');
      typingDiv.classList.add('msg', 'auto-msg', 'typing-indicator');
      typingDiv.innerHTML = `<span class="msg-content">AI is typing...</span>`;
      chatMessages.appendChild(typingDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      const aiResponse = await getAIResponse(text, selectedTopic);
      typingDiv.remove();

      await supabase.from('messages').insert({
        user_id: user.id,
        content: aiResponse,
        sender: 'support',
        is_auto: true
      });

      addLocalMessage(aiResponse, 'auto');
      selectedTopic = '';

    } catch (err) {
      console.error('Error sending message:', err);
      const typingIndicator = chatMessages.querySelector('.typing-indicator');
      if (typingIndicator) typingIndicator.remove();
    } finally {
      sendChat.disabled = false;
    }
  }
});

// File upload logic (unchanged)
attachFile.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file || !user) return;

  filePreview.innerHTML = `
    <div class="file-preview-item" style="display: flex; align-items: center; gap: 10px;">
      <span>${file.name}</span>
      <button class="delete-file" title="Remove">X</button>
      <button class="send-file">Send</button>
      <span class="loading-spinner" style="display: none; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #4fc3f7; border-radius: 50%; animation: spin 1s linear infinite;"></span>
    </div>
    <style>@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }</style>
  `;

  filePreview.querySelector('.delete-file').onclick = () => {
    fileInput.value = ''; filePreview.innerHTML = '';
  };

  filePreview.querySelector('.send-file').onclick = async () => {
    const btn = filePreview.querySelector('.send-file');
    const spinner = filePreview.querySelector('.loading-spinner');
    btn.disabled = true; spinner.style.display = 'inline-block';

    try {
      const filePath = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data } = await supabase.storage.from('chat-files').upload(filePath, file);
      const url = supabase.storage.from('chat-files').getPublicUrl(data.path).data.publicUrl;

      const content = selectedTopic ? `[Topic: ${selectedTopic}] 📎 Sent file: <a href="${url}" target="_blank">${file.name}</a>` : `📎 Sent file: <a href="${url}" target="_blank">${file.name}</a>`;
      addLocalMessage(content);

      await supabase.from('messages').insert({
        user_id: user.id,
        content,
        sender: 'user',
        is_auto: false,
        file_url: url
      });

      fileInput.value = ''; filePreview.innerHTML = '';
      selectedTopic = '';
    } catch (err) {
      alert('Upload failed');
    } finally {
      btn.disabled = false; spinner.style.display = 'none';
    }
  };
});
