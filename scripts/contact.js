import { supabase } from './supabase-config.js';

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const fileInput = document.getElementById('fileInput');
const filePreview = document.getElementById('filePreview');
const sendChat = document.getElementById('sendChat');
const attachFile = document.getElementById('attachFile');

let user = null;
let selectedTopic = '';
// FIX #1: Remove .js extension - Cloudflare Pages Functions don't use extensions
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
      <button id="submitInfo" style="padding:12px 24px;background:#4fc3f7;border:none;border-radius:8px;color:#121212;cursor:pointer;">Start Chat</button>
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

    const userId = Array.from(new TextEncoder().encode(email))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem('chat_user_id', userId);

    const { data: existing, error: selectError } = await supabase
      .from('users')
      .select()
      .eq('id', userId)
      .maybeSingle(); // FIX #2: Use maybeSingle() to avoid error if no rows

    if (existing) {
      user = existing;
      if (user.name !== name || user.topic !== topic) {
        await supabase.from('users').update({ name, topic }).eq('id', userId);
      }
    } else {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({ id: userId, name, email, topic })
        .select()
        .single();
      
      if (insertError) {
        console.error('User insert error:', insertError);
        throw insertError;
      }
      user = newUser;

      // Welcome message
      const welcomeText = `Hi ${name}! Welcome to Neodynix Technologies support. How can I help you with ${topic.toLowerCase()} today?`;
      await supabase.from('messages').insert({
        user_id: userId,
        content: welcomeText,
        sender: 'support',
        is_auto: true,
      });
    }

    await loadMessages(userId);
    subscribeToMessages();

  } catch (err) {
    console.error('Start chat error:', err);
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
      addLocalMessage(content, msg.is_auto ? 'auto' : msg.sender);
    });
  } catch (err) {
    console.error('Load messages error:', err);
  }
}

// ----- Add Message to UI -----
function addLocalMessage(content, sender = 'user') {
  const div = document.createElement('div');
  div.className = `msg ${sender === 'support' ? 'support-msg' : sender === 'auto' ? 'auto-msg' : 'user-msg'}`;
  div.innerHTML = `
    <span class="msg-content">${content}</span>
    <span class="msg-timestamp">${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
  `;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// FIX #3: Track if we're waiting for a response to prevent duplicate display
let waitingForResponse = false;

// ----- Subscribe to Messages -----
function subscribeToMessages() {
  supabase.channel('chat')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `user_id=eq.${user.id}`
    }, payload => {
      const msg = payload.new;
      
      // FIX #4: Only show messages from support (AI responses)
      // User messages are already shown when sent
      if (msg.sender === 'user' && waitingForResponse) {
        // Skip - we already showed this
        return;
      }
      
      const content = msg.file_url
        ? `${msg.content} <a href="${msg.file_url}" target="_blank" style="color:#4fc3f7;">View File</a>`
        : msg.content;
      addLocalMessage(content, msg.is_auto ? 'auto' : msg.sender);
      
      // Reset waiting flag when we get AI response
      if (msg.sender === 'support') {
        waitingForResponse = false;
      }
    })
    .subscribe(status => {
      if (status === 'SUBSCRIBED') console.log('Subscribed to real-time messages');
    });
}

// ----- Send Message via Worker -----
async function sendMessageViaWorker(content, fileUrl = null) {
  try {
    console.log('Sending to worker:', { userId: user.id, content, fileUrl });
    
    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, content, fileUrl })
    });
    
    const responseText = await res.text();
    console.log('Worker response:', responseText);
    
    if (!res.ok) {
      console.error('Worker error response:', responseText);
      throw new Error('Worker failed: ' + responseText);
    }
    
    // Try to parse JSON
    try {
      const data = JSON.parse(responseText);
      console.log('Worker success:', data);
    } catch (e) {
      console.warn('Response not JSON:', responseText);
    }
    
  } catch (err) {
    console.error('AI failed, using fallback:', err);
    addLocalMessage('⚠️ Connection issue. Our team will respond soon.', 'auto');
    
    // Still save fallback to database
    await supabase.from('messages').insert({
      user_id: user.id,
      content: "Thanks! Our team will reply soon.",
      sender: 'support',
      is_auto: true
    });
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
  if (!text || !user) return;

  sendChat.disabled = true;
  const content = selectedTopic ? `[Topic: ${selectedTopic}] ${text}` : text;
  chatInput.value = '';
  selectedTopic = '';

  // FIX #5: Show user message immediately (don't wait for real-time)
  addLocalMessage(content.replace(/\[Topic:[^\]]+\]\s*/g, ''), 'user');
  waitingForResponse = true;

  const indicator = document.createElement('div');
  indicator.id = 'sending-indicator';
  indicator.innerHTML = `<span style="color:#888;font-style:italic;">AI is typing...</span>`;
  chatMessages.appendChild(indicator);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    await sendMessageViaWorker(content);
  } finally {
    indicator.remove();
    sendChat.disabled = false;
  }
};

// FIX #6: Add Enter key support
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
      <button class="delete-file" title="Remove" style="background:none;border:none;color:#ff6b6b;cursor:pointer;font-weight:bold;">X</button>
      <button class="send-file" style="padding:5px 10px;background:#4fc3f7;border:none;border-radius:5px;color:#000;font-size:12px;">Send</button>
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
    sendBtn.disabled = true;
    filePreview.style.pointerEvents = 'none';
    sendChat.disabled = true;
    spinner.style.display = 'inline-block';

    try {
      const path = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data, error } = await supabase.storage.from('chat-files').upload(path, file);
      if (error) throw error;

      const url = supabase.storage.from('chat-files').getPublicUrl(data.path).data.publicUrl;
      const content = selectedTopic
        ? `[Topic: ${selectedTopic}] Sent file: ${file.name}`
        : `Sent file: ${file.name}`;

      // Show file message immediately
      addLocalMessage(`${content} <a href="${url}" target="_blank" style="color:#4fc3f7;">View File</a>`, 'user');
      waitingForResponse = true;

      selectedTopic = '';
      await sendMessageViaWorker(content, url);

      fileInput.value = '';
      filePreview.innerHTML = '';
    } catch (e) {
      console.error('Upload failed:', e);
      alert('Upload failed: ' + e.message);
    } finally {
      sendBtn.disabled = false;
      filePreview.style.pointerEvents = 'auto';
      sendChat.disabled = false;
      spinner.style.display = 'none';
    }
  };
};
