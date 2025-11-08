import { supabase } from './supabase-config.js';

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const fileInput = document.getElementById('fileInput');
const filePreview = document.getElementById('filePreview');
const sendChat = document.getElementById('sendChat');
const attachFile = document.getElementById('attachFile');

let user = null;
let selectedTopic = '';
let isWaitingForAI = false;

// Worker URL - remove .js extension for Cloudflare Pages Functions
const WORKER_URL = '/api/chart';

// ----- Start Chat Popup -----
async function showStartChatPopup() {
  return new Promise(resolve => {
    const popup = document.createElement('div');
    popup.id = 'startChatPopup';
    popup.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1c2526;padding:24px;border-radius:12px;z-index:1000;box-shadow:0 4px 10px rgba(0,0,0,0.5);color:#eceff1;text-align:center;width:90%;max-width:400px;box-sizing:border-box;';

    popup.innerHTML = `
      <h3 style="margin-bottom:20px;color:#80deea;">Start Chat</h3>
      <input type="email" id="emailInput" placeholder="Email" style="padding:12px;width:100%;box-sizing:border-box;border-radius:8px;margin-bottom:15px;border:1px solid #80deea;background:#263238;color:#eceff1;" required>
      <select id="topicSelect" style="padding:12px;width:100%;box-sizing:border-box;border-radius:8px;margin-bottom:15px;border:1px solid #80deea;background:#263238;color:#eceff1;" required>
        <option value="" disabled selected>Select topic</option>
        <option value="Templates">Templates</option>
        <option value="Pricing">Pricing</option>
        <option value="Support">Support</option>
        <option value="Other">Other</option>
      </select>
      <input type="text" id="nameInput" placeholder="Name" style="padding:12px;width:100%;box-sizing:border-box;border-radius:8px;margin-bottom:15px;border:1px solid #80deea;background:#263238;color:#eceff1;" required>
      <button id="submitInfo" style="padding:12px 24px;background:#4fc3f7;border:none;border-radius:8px;color:#121212;cursor:pointer;font-weight:600;">Start Chat</button>
    `;

    document.body.appendChild(popup);

    document.getElementById('submitInfo').onclick = () => {
      const email = document.getElementById('emailInput').value.trim();
      const topic = document.getElementById('topicSelect').value;
      const name = document.getElementById('nameInput').value.trim();
      if (email && topic && name) {
        popup.remove();
        resolve({ email, topic, name });
      } else {
        alert('Please fill all fields');
      }
    };
  });
}

// ----- Initialize Chat -----
async function startChat() {
  try {
    const { email, topic, name } = await showStartChatPopup();
    selectedTopic = topic;

    // Create userId from email hash
    const userId = Array.from(new TextEncoder().encode(email))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem('chat_user_id', userId);

    // Check if user exists
    const { data: existing, error: selectError } = await supabase
      .from('users')
      .select()
      .eq('id', userId)
      .maybeSingle();

    if (existing) {
      user = existing;
      // Update if topic changed
      if (user.name !== name || user.topic !== topic) {
        await supabase.from('users').update({ name, topic }).eq('id', userId);
        user = { ...user, name, topic };
      }
    } else {
      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({ id: userId, name, email, topic })
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ User insert error:', insertError);
        throw insertError;
      }
      user = newUser;

      // Send welcome message through worker for AI response
      await sendMessageViaWorker(`Hello, I'm interested in ${topic.toLowerCase()}.`);
    }

    await loadMessages(userId);
    subscribeToMessages();

  } catch (err) {
    console.error('❌ Start chat error:', err);
    alert('Failed to start chat: ' + err.message);
    localStorage.removeItem('chat_user_id');
  }
}

// ----- Load Messages -----
async function loadMessages(userId) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    chatMessages.innerHTML = '';
    (data || []).forEach(msg => {
      const content = msg.file_url
        ? `${msg.content} <a href="${msg.file_url}" target="_blank" style="color:#4fc3f7;">View File</a>`
        : msg.content;
      addLocalMessage(content, msg.sender === 'support' ? 'support' : 'user', msg.created_at);
    });
  } catch (err) {
    console.error('❌ Load messages error:', err);
  }
}

// ----- Add Message to UI -----
function addLocalMessage(content, sender = 'user', timestamp = null) {
  const div = document.createElement('div');
  div.className = `msg ${sender === 'support' ? 'support-msg' : 'user-msg'}`;
  
  const time = timestamp 
    ? new Date(timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
    : new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  
  div.innerHTML = `
    <span class="msg-content">${content}</span>
    <span class="msg-timestamp">${time}</span>
  `;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ----- Subscribe to Real-time Messages -----
function subscribeToMessages() {
  console.log('🔔 Subscribing to messages for user:', user.id);
  
  supabase.channel('chat')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `user_id=eq.${user.id}`
    }, payload => {
      console.log('📨 New message received:', payload.new);
      const msg = payload.new;
      
      // Only display AI/support messages (user messages are shown immediately when sent)
      if (msg.sender === 'support') {
        const content = msg.file_url
          ? `${msg.content} <a href="${msg.file_url}" target="_blank" style="color:#4fc3f7;">View File</a>`
          : msg.content;
        
        // Remove typing indicator
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
        
        addLocalMessage(content, 'support', msg.created_at);
        isWaitingForAI = false;
      }
    })
    .subscribe(status => {
      console.log('📡 Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to real-time messages');
      }
    });
}

// ----- Send Message via Worker (AI Processing) -----
async function sendMessageViaWorker(content, fileUrl = null) {
  try {
    console.log('📤 Sending to worker:', { userId: user.id, content: content.substring(0, 50) });
    
    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId: user.id, 
        content, 
        fileUrl 
      })
    });
    
    const responseText = await res.text();
    console.log('📥 Worker response:', responseText);
    
    if (!res.ok) {
      console.error('❌ Worker error:', responseText);
      throw new Error(`Worker failed: ${res.status}`);
    }
    
    const data = JSON.parse(responseText);
    console.log('✅ Worker success:', data);
    
  } catch (err) {
    console.error('❌ AI failed:', err);
    
    // Remove typing indicator
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
    
    addLocalMessage('⚠️ Connection issue. Our team will respond soon.', 'support');
    
    // Save fallback message
    await supabase.from('messages').insert({
      user_id: user.id,
      content: "Thanks for your message! Our team will reply soon.",
      sender: 'support',
      is_auto: true
    });
    
    isWaitingForAI = false;
  }
}

// ----- Page Load -----
window.onload = async () => {
  const userId = localStorage.getItem('chat_user_id');
  if (userId) {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('id', userId)
      .maybeSingle();
    
    if (data) {
      user = data;
      selectedTopic = data.topic || '';
      await loadMessages(userId);
      subscribeToMessages();
    } else {
      localStorage.removeItem('chat_user_id');
      startChat();
    }
  } else {
    startChat();
  }
};

// ----- Send Text Message -----
sendChat.onclick = async () => {
  const text = chatInput.value.trim();
  if (!text || !user || isWaitingForAI) return;

  sendChat.disabled = true;
  isWaitingForAI = true;
  
  const content = selectedTopic ? `[Topic: ${selectedTopic}] ${text}` : text;
  chatInput.value = '';
  selectedTopic = '';

  // Show user message immediately (with clean text)
  const displayContent = text; // Don't show [Topic: ...] to user
  addLocalMessage(displayContent, 'user');

  // Show typing indicator
  const indicator = document.createElement('div');
  indicator.id = 'typing-indicator';
  indicator.className = 'msg support-msg';
  indicator.innerHTML = `<span class="msg-content"><em>AI is typing...</em></span>`;
  chatMessages.appendChild(indicator);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    // Send to worker for AI processing
    await sendMessageViaWorker(content);
  } finally {
    sendChat.disabled = false;
  }
};

// ----- Enter Key Support -----
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChat.click();
  }
});

// ----- File Upload -----
attachFile.onclick = () => fileInput.click();

fileInput.onchange = () => {
  const file = fileInput.files[0];
  if (!file) return;

  filePreview.innerHTML = `
    <div style="display:flex;gap:10px;align-items:center;padding:8px;background:#263238;border-radius:8px;">
      <span style="flex:1;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${file.name}</span>
      <button class="delete-file" title="Remove" style="background:none;border:none;color:#ff6b6b;cursor:pointer;font-weight:bold;">✕</button>
      <button class="send-file" style="padding:5px 10px;background:#4fc3f7;border:none;border-radius:5px;color:#000;font-size:12px;font-weight:600;cursor:pointer;">Send</button>
      <span class="loading-spinner" style="display:none;width:14px;height:14px;border:2px solid #ccc;border-top:2px solid #4fc3f7;border-radius:50%;animation:spin 1s linear infinite;"></span>
    </div>
    <style>@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}</style>
  `;

  const deleteBtn = filePreview.querySelector('.delete-file');
  const sendBtn = filePreview.querySelector('.send-file');
  const spinner = filePreview.querySelector('.loading-spinner');

  deleteBtn.onclick = () => {
    fileInput.value = '';
    filePreview.innerHTML = '';
  };

  sendBtn.onclick = async () => {
    if (isWaitingForAI) return;
    
    sendBtn.disabled = true;
    filePreview.style.pointerEvents = 'none';
    sendChat.disabled = true;
    spinner.style.display = 'inline-block';
    isWaitingForAI = true;

    try {
      // Upload file to Supabase storage
      const path = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data, error } = await supabase.storage.from('chat-files').upload(path, file);
      if (error) throw error;

      const url = supabase.storage.from('chat-files').getPublicUrl(data.path).data.publicUrl;
      const content = selectedTopic
        ? `[Topic: ${selectedTopic}] Sent file: ${file.name}`
        : `Sent file: ${file.name}`;

      // Show file message immediately
      addLocalMessage(`${file.name} <a href="${url}" target="_blank" style="color:#4fc3f7;">View File</a>`, 'user');
      
      // Show typing indicator
      const indicator = document.createElement('div');
      indicator.id = 'typing-indicator';
      indicator.className = 'msg support-msg';
      indicator.innerHTML = `<span class="msg-content"><em>AI is typing...</em></span>`;
      chatMessages.appendChild(indicator);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      selectedTopic = '';
      await sendMessageViaWorker(content, url);

      fileInput.value = '';
      filePreview.innerHTML = '';
    } catch (e) {
      console.error('❌ Upload failed:', e);
      alert('Upload failed: ' + e.message);
      isWaitingForAI = false;
    } finally {
      sendBtn.disabled = false;
      filePreview.style.pointerEvents = 'auto';
      sendChat.disabled = false;
      spinner.style.display = 'none';
    }
  };
};
