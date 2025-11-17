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
const displayedMessageIds = new Set();
let notificationPermission = 'default';
let hasHumanIntervened = false;
let isKnowledgeLoaded = false;

// Show loading message in chat
function showLoadingMessage(message = 'Loading...') {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'msg auto-msg loading-message';
  loadingDiv.innerHTML = `<span class="msg-content">${message}</span>`;
  chatMessages.appendChild(loadingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return loadingDiv;
}

// Remove loading message
function removeLoadingMessage() {
  const loading = chatMessages.querySelector('.loading-message');
  if (loading) loading.remove();
}

// Request notification permission
async function requestNotificationPermission() {
  if ('Notification' in window) {
    if (notificationPermission === 'default') {
      const perm = await Notification.requestPermission();
      notificationPermission = perm;
    }
  }
}

// Show browser notification
function showNotification(title, body, icon = 'images/attach-icon.png') {
  if (notificationPermission === 'granted') {
    new Notification(title, {
      body: body.substring(0, 100) + (body.length > 100 ? '...' : ''),
      icon: icon,
      tag: 'chat-notification'
    });
  }
}

// Fetch knowledge base from Supabase with retry
async function loadKnowledgeBase(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Loading knowledge base (attempt ${i + 1}/${retries})...`);
      const { data, error } = await supabase
        .from('knowledge')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });
      
      if (error) throw error;
      
      knowledgeBase = data || [];
      isKnowledgeLoaded = true;
      console.log('Knowledge base loaded:', knowledgeBase.length, 'entries');
      return true;
    } catch (err) {
      console.error(`Error loading knowledge base (attempt ${i + 1}):`, err);
      if (i === retries - 1) {
        console.error('Failed to load knowledge base after', retries, 'attempts');
        return false;
      }
      // Wait 1 second before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

// Generate AI response using Cloudflare Workers AI
async function getAIResponse(userMessage, topic) {
  try {
    // Wait for knowledge to load with timeout
    let waitTime = 0;
    while (!isKnowledgeLoaded && waitTime < 5000) {
      console.log('Waiting for knowledge base...');
      await new Promise(resolve => setTimeout(resolve, 100));
      waitTime += 100;
    }

    if (!isKnowledgeLoaded) {
      console.warn('Knowledge base not loaded, proceeding with empty knowledge');
    }

    // Filter relevant knowledge based on topic
    const relevantKnowledge = knowledgeBase.filter(k => 
      !topic || k.category.toLowerCase() === topic.toLowerCase() || k.category === 'General'
    );

    console.log(`Sending ${relevantKnowledge.length} knowledge items to AI`);

    // Call Cloudflare Worker endpoint
    const WORKER_URL = '/ai-chat';
    
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        topic: topic,
        knowledgeBase: relevantKnowledge
      })
    });

    if (!response.ok) {
      throw new Error(`Worker error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return data.message;
    } else {
      throw new Error(data.error || 'Unknown error');
    }

  } catch (err) {
    console.error('Error getting AI response:', err);
    return "I'm having trouble processing that right now. A human agent will assist you shortly.";
  }
}

async function showStartChatPopup() {
  return new Promise(resolve => {
    const popup = document.createElement('div');
    popup.id = 'startChatPopup';
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #1c2526;
      padding: 24px;
      border-radius: 12px;
      z-index: 1000;
      box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      color: #eceff1;
      text-align: center;
      width: 90%;
      max-width: 400px;
      box-sizing: border-box;
      border: 1px solid #80deea;
    `;

    popup.innerHTML = `
      <h3 style="margin-bottom: 20px; color: #80deea; font-size: clamp(1.5rem, 3.5vw, 1.8rem);">Start Chat</h3>
      <input type="email" id="emailInput" placeholder="Enter your email"
        style="padding: 12px; width: 100%; box-sizing: border-box; border-radius: 8px; margin-bottom: 15px;
        border: 1px solid #80deea; background: #263238; color: #eceff1; font-size: clamp(0.9rem, 2.5vw, 1rem);" required>
      <select id="topicSelect"
        style="padding: 12px; width: 100%; box-sizing: border-box; border-radius: 8px; margin-bottom: 15px;
        border: 1px solid #80deea; background: #263238; color: #eceff1; font-size: clamp(0.9rem, 2.5vw, 1rem);" required>
        <option value="" disabled selected>Select a topic</option>
        <option value="General">General</option>
        <option value="Templates">Templates</option>
        <option value="Pricing">Pricing</option>
        <option value="Support">Support</option>
        <option value="Technical">Technical</option>
        <option value="Other">Other</option>
      </select>
      <input type="text" id="nameInput" placeholder="Enter your name"
        style="padding: 12px; width: 100%; box-sizing: border-box; border-radius: 8px; margin-bottom: 15px;
        border: 1px solid #80deea; background: #263238; color: #eceff1; font-size: clamp(0.9rem, 2.5vw, 1rem);" required>
      <button id="submitInfo"
        style="padding: 12px 24px; background: #4fc3f7; border: none; border-radius: 8px; color: #121212;
        cursor: pointer; font-size: clamp(0.9rem, 2.5vw, 1rem); transition: background 0.3s, transform 0.2s; width: 100%;">
        Start Chat
      </button>
      <p id="popupError" style="color: #ef5350; margin-top: 10px; font-size: 0.9rem; display: none;"></p>
    `;

    document.body.appendChild(popup);

    const submitBtn = document.getElementById('submitInfo');
    const errorMsg = document.getElementById('popupError');

    submitBtn.addEventListener('click', () => {
      const email = document.getElementById('emailInput').value.trim();
      const topic = document.getElementById('topicSelect').value;
      const name = document.getElementById('nameInput').value.trim();

      errorMsg.style.display = 'none';

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errorMsg.textContent = 'Please enter a valid email address.';
        errorMsg.style.display = 'block';
        return;
      }

      if (!topic) {
        errorMsg.textContent = 'Please select a topic.';
        errorMsg.style.display = 'block';
        return;
      }

      if (name.length < 2) {
        errorMsg.textContent = 'Please enter your name (at least 2 characters).';
        errorMsg.style.display = 'block';
        return;
      }

      popup.remove();
      resolve({ email, topic, name });
    });
  });
}

async function startChat() {
  let loadingMsg = null;
  try {
    const userInfo = await showStartChatPopup();
    if (!userInfo) return;

    const { email, topic, name } = userInfo;
    selectedTopic = topic;

    // Show loading in chat
    loadingMsg = showLoadingMessage('Setting up your chat...');

    // Generate user ID from email
    const userId = Array.from(new TextEncoder().encode(email.toLowerCase()))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 36); // Ensure it's a valid UUID length
    
    console.log('Generated user ID:', userId);
    localStorage.setItem('chat_user_id', userId);

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(`Database error: ${fetchError.message}`);
    }

    if (existingUser) {
      console.log('Existing user found:', existingUser);
      user = existingUser;
      
      // Update user info if changed
      if (user.name !== name || user.topic !== topic) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ name, topic, email })
          .eq('id', userId);
        
        if (updateError) {
          console.error('Error updating user:', updateError);
          // Don't throw - continue with old data
        } else {
          user.name = name;
          user.topic = topic;
          user.email = email;
        }
      }
    } else {
      console.log('Creating new user');
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          name,
          email,
          topic
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to create user: ${insertError.message}`);
      }
      
      user = newUser;
      console.log('New user created:', user);
    }

    // Request notification permission
    await requestNotificationPermission();

    // Enable chat
    document.querySelector('.chat-widget').classList.add('active');
    
    // Remove loading message
    if (loadingMsg) removeLoadingMessage();

    // Send auto-reply for new conversations
    const autoReplySent = localStorage.getItem(`autoReplySent_${userId}`);
    if (!autoReplySent) {
      const autoReplyMessage = `Hello ${name}, thank you for contacting us about ${topic}. I'm your AI assistant and I'm here to help! Please ask me anything about our services.`;
      
      const { error: replyError } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          content: autoReplyMessage,
          sender: 'support',
          is_auto: true
        });
      
      if (replyError) {
        console.error('Error sending auto-reply:', replyError);
      } else {
        localStorage.setItem(`autoReplySent_${userId}`, 'true');
        addLocalMessage(autoReplyMessage, 'auto');
      }
    }

    // Load existing messages
    await loadMessages(user.id);
    
    // Subscribe to real-time updates
    subscribeToMessages();

    console.log('Chat started successfully');

  } catch (err) {
    console.error('Error in startChat:', err);
    if (loadingMsg) removeLoadingMessage();
    
    // Show error in chat
    const errorDiv = document.createElement('div');
    errorDiv.className = 'msg auto-msg';
    errorDiv.style.background = '#ef535033';
    errorDiv.style.border = '1px solid #ef5350';
    errorDiv.innerHTML = `
      <span class="msg-content" style="color: #ef5350;">
        <strong>Failed to start chat</strong><br>
        ${err.message || 'Unknown error'}<br>
        <small>Please refresh the page and try again.</small>
      </span>
    `;
    chatMessages.appendChild(errorDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

async function loadMessages(userId) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id, content, sender, is_auto, created_at, file_url')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    if (error) {
      throw new Error(`Failed to load messages: ${error.message}`);
    }
    
    displayedMessageIds.clear();
    
    if (data && data.length > 0) {
      data.forEach(msg => {
        if (msg.id && !displayedMessageIds.has(msg.id)) {
          displayedMessageIds.add(msg.id);
          const div = document.createElement('div');
          div.classList.add('msg', msg.is_auto ? 'auto-msg' : msg.sender === 'support' ? 'support-msg' : 'user-msg');
          const content = msg.file_url
            ? `${msg.content} <a href="${msg.file_url}" target="_blank">View File</a>`
            : msg.content;
          div.innerHTML = `
            <span class="msg-content">${content}</span>
            <span class="msg-timestamp">${new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          `;
          chatMessages.appendChild(div);
        }
      });
      chatMessages.scrollTop = chatMessages.scrollHeight;

      // Check for human intervention
      hasHumanIntervened = data.some(msg => msg.sender === 'support' && !msg.is_auto);
    }
  } catch (err) {
    console.error('Error loading messages:', err);
    throw err;
  }
}

function addLocalMessage(content, sender = 'user', messageId = null) {
  if (messageId && displayedMessageIds.has(messageId)) {
    return;
  }
  if (messageId) {
    displayedMessageIds.add(messageId);
  }
  const div = document.createElement('div');
  div.classList.add('msg', sender === 'support' ? 'support-msg' : sender === 'auto' ? 'auto-msg' : 'user-msg');
  div.innerHTML = `
    <span class="msg-content">${content}</span>
    <span class="msg-timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
  `;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function subscribeToMessages() {
  if (!user) return;
  
  try {
    const channel = supabase.channel(`chat-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `user_id=eq.${user.id}`
      }, payload => {
        const msg = payload.new;
        if (msg.user_id === user.id && msg.id && !displayedMessageIds.has(msg.id)) {
          // Check for human intervention
          if (msg.sender === 'support' && !msg.is_auto) {
            hasHumanIntervened = true;
            showNotification('New Message from Support', msg.content);
          }

          // Add message with slight delay for smooth UX
          setTimeout(() => {
            displayedMessageIds.add(msg.id);
            const content = msg.file_url
              ? `${msg.content} <a href="${msg.file_url}" target="_blank">View File</a>`
              : msg.content;
            addLocalMessage(content, msg.is_auto ? 'auto' : msg.sender, msg.id);
          }, 300);
        }
      })
      .subscribe(status => {
        console.log('Subscription status:', status);
      });
    
    console.log('Subscribed to real-time messages');
  } catch (err) {
    console.error('Error subscribing to messages:', err);
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', async () => {
  console.log('Initializing chat...');
  
  // Load knowledge base in background
  loadKnowledgeBase().catch(err => {
    console.error('Failed to load knowledge base:', err);
  });
  
  const userId = localStorage.getItem('chat_user_id');
  
  if (userId) {
    try {
      const loadingMsg = showLoadingMessage('Reconnecting...');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        user = data;
        selectedTopic = data.topic || '';
        await requestNotificationPermission();
        document.querySelector('.chat-widget').classList.add('active');
        removeLoadingMessage();
        await loadMessages(userId);
        subscribeToMessages();
      } else {
        // User not found, clear storage and start fresh
        localStorage.removeItem('chat_user_id');
        localStorage.removeItem(`autoReplySent_${userId}`);
        removeLoadingMessage();
        startChat();
      }
    } catch (err) {
      console.error('Error reconnecting:', err);
      localStorage.clear();
      removeLoadingMessage();
      startChat();
    }
  } else {
    startChat();
  }
});

// Send message on button click
sendChat.addEventListener('click', async () => {
  const text = chatInput.value.trim();
  if (!text || !user) return;
  
  sendChat.disabled = true;
  const content = text;
  addLocalMessage(content);
  chatInput.value = '';
  
  try {
    // Save user message
    const { error } = await supabase
      .from('messages')
      .insert({
        user_id: user.id,
        content,
        sender: 'user',
        is_auto: false
      });
    
    if (error) throw error;

    // Only generate AI response if no human has intervened
    if (!hasHumanIntervened) {
      // Show typing indicator
      const typingDiv = document.createElement('div');
      typingDiv.classList.add('msg', 'auto-msg', 'typing-indicator');
      typingDiv.innerHTML = `<span class="msg-content">AI is typing...</span>`;
      chatMessages.appendChild(typingDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      // Get AI response
      const aiResponse = await getAIResponse(text, selectedTopic);
      
      // Remove typing indicator
      typingDiv.remove();

      // Save AI response
      const { error: aiError } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          content: aiResponse,
          sender: 'support',
          is_auto: true
        });

      if (aiError) throw aiError;
    }

  } catch (err) {
    console.error('Error sending message:', err);
    addLocalMessage('Failed to send message. Please try again.', 'auto');
  } finally {
    sendChat.disabled = false;
  }
});

// Send on Enter key
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChat.click();
  }
});

// Attach file button
attachFile.addEventListener('click', () => {
  fileInput.click();
});

//Handle file selection

  const sendFileButton = filePreview.querySelector('.send-file');
  sendFileButton.addEventListener('click', async () => {
    if (!user) return;
    
    sendFileButton.disabled = true;
    filePreview.style.pointerEvents = 'none';
    sendChat.disabled = true;
    const spinner = filePreview.querySelector('.loading-spinner');
    spinner.style.display = 'inline-block';

                                  try {
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${user.id}/${Date.now()}_${sanitizedFileName}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(data.path);
      
      const content = `📎 Sent file: <a href="${publicUrl}" target="_blank">${file.name}</a>`;

      addLocalMessage(content);

      const { error } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          content,
          sender: 'user',
          is_auto: false,
          file_url: publicUrl
        });

      if (error) throw error;

      fileInput.value = '';
      filePreview.innerHTML = '';

    } catch (err) {
      console.error('Error uploading file:', err);
      alert(`Error uploading file: ${err.message}`);
    } finally {
      sendFileButton.disabled = false;
      filePreview.style.pointerEvents = 'auto';
      sendChat.disabled = false;
      spinner.style.display = 'none';
    }
  });
});
