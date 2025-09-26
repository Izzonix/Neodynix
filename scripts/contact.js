import { supabase } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contactForm');
  const messageForm = document.getElementById('messageForm');
  const chatMessages = document.getElementById('chatMessages');
  const chatResult = document.getElementById('chatResult');
  const loadingPopup = document.getElementById('loading-popup');
  let userId = localStorage.getItem('user_id');

  // Check if user is already logged in
  async function checkUser() {
    if (userId) {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
      if (!error && data) {
        document.getElementById('contact-section').style.display = 'none';
        document.getElementById('chat-section').style.display = 'block';
        fetchMessages();
        subscribeToMessages();
      } else {
        localStorage.removeItem('user_id');
        userId = null;
        document.getElementById('contact-section').style.display = 'block';
        document.getElementById('chat-section').style.display = 'none';
      }
    } else {
      document.getElementById('contact-section').style.display = 'block';
      document.getElementById('chat-section').style.display = 'none';
    }
  }

  // Handle contact form submission
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = contactForm.name.value;
    const email = contactForm.email.value;
    const topic = contactForm.topic.value;

    if (!name || !email || !topic) {
      chatResult.className = 'result error';
      chatResult.textContent = 'Please fill all fields.';
      return;
    }

    loadingPopup.style.display = 'flex';
    try {
      // Generate user_id from email (hex encoded)
      const user_id = Array.from(new TextEncoder().encode(email))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Insert or update user
      const { error: userError } = await supabase
        .from('users')
        .upsert({ id: user_id, email, name, topic }, { onConflict: 'id' });
      if (userError) throw userError;

      // Check if first auto-reply was already sent
      const autoReplySent = localStorage.getItem('autoReplySent');
      if (!autoReplySent) {
        // Send first auto-reply
        const autoReplyMessage = `Thank you for contacting us about ${topic}. Please specify your issue or question related to this topic.`;
        const { error: messageError } = await supabase.from('messages').insert({
          user_id,
          content: autoReplyMessage,
          sender: 'support',
          is_auto: true
        });
        if (messageError) throw messageError;

        // Mark first auto-reply as sent
        localStorage.setItem('autoReplySent', 'true');
      }

      // Store user_id and update UI
      localStorage.setItem('user_id', user_id);
      userId = user_id;
      contactForm.reset();
      document.getElementById('contact-section').style.display = 'none';
      document.getElementById('chat-section').style.display = 'block';
      chatResult.className = 'result success';
      chatResult.textContent = 'Details submitted successfully!';
      fetchMessages();
      subscribeToMessages();
    } catch (error) {
      console.error('Error submitting contact form:', error);
      chatResult.className = 'result error';
      chatResult.textContent = 'Failed to submit details.';
    } finally {
      loadingPopup.style.display = 'none';
    }
  });

  // Handle message form submission
  messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = messageForm.message.value;
    const fileInput = messageForm.fileInput.files[0];

    if (!message && !fileInput) {
      chatResult.className = 'result error';
      chatResult.textContent = 'Please enter a message or select a file.';
      return;
    }

    loadingPopup.style.display = 'flex';
    try {
      let file_url = null;
      if (fileInput) {
        const fileName = `${Date.now()}_${fileInput.name}`;
        const { data, error: uploadError } = await supabase.storage
          .from('chat-files')
          .upload(`files/${fileName}`, fileInput);
        if (uploadError) throw uploadError;
        file_url = supabase.storage.from('chat-files').getPublicUrl(`files/${fileName}`).data.publicUrl;
      }

      const { error: messageError } = await supabase.from('messages').insert({
        user_id: userId,
        content: message || 'File uploaded',
        sender: 'user',
        is_auto: false,
        file_url
      });
      if (messageError) throw messageError;

      // Check if second auto-reply is needed
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('is_auto')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (messagesError) throw messagesError;

      const hasFirstAutoReply = messages.some(msg => msg.is_auto);
      const userMessages = messages.filter(msg => !msg.is_auto);
      const secondAutoReplySent = localStorage.getItem('secondAutoReplySent');

      if (hasFirstAutoReply && userMessages.length === 1 && !secondAutoReplySent) {
        // Send second auto-reply after user's first non-auto message
        const secondAutoReplyMessage = 'Thank you for providing details. Our team will review your issue and reply soon. Please check back for updates.';
        const { error: secondMessageError } = await supabase.from('messages').insert({
          user_id: userId,
          content: secondAutoReplyMessage,
          sender: 'support',
          is_auto: true
        });
        if (secondMessageError) throw secondMessageError;

        // Mark second auto-reply as sent
        localStorage.setItem('secondAutoReplySent', 'true');
      }

      messageForm.reset();
      document.getElementById('filePreview').innerHTML = '';
      chatResult.className = 'result success';
      chatResult.textContent = 'Message sent successfully!';
    } catch (error) {
      console.error('Error sending message:', error);
      chatResult.className = 'result error';
      chatResult.textContent = 'Failed to send message.';
    } finally {
      loadingPopup.style.display = 'none';
    }
  });

  // Fetch and display messages
  async function fetchMessages() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (error) throw error;

      chatMessages.innerHTML = '';
      if (data.length === 0) {
        chatMessages.innerHTML = '<p>No messages yet.</p>';
        return;
      }

      data.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${msg.sender === 'user' ? 'user-msg' : msg.is_auto ? 'auto-msg' : 'support-msg'}`;
        const content = msg.file_url ? `${msg.content} <a href="${msg.file_url}" target="_blank">View File</a>` : msg.content;
        messageElement.innerHTML = `
          <p>${content}</p>
          <span class="timestamp">${new Date(msg.created_at).toLocaleString()}</span>
        `;
        chatMessages.appendChild(messageElement);
      });

      chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
      console.error('Error fetching messages:', error);
      chatResult.className = 'result error';
      chatResult.textContent = 'Failed to load messages.';
    }
  }

  // Subscribe to real-time message updates
  function subscribeToMessages() {
    supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${userId}` }, payload => {
        const msg = payload.new;
        const messageElement = document.createElement('div');
        messageElement.className = `message ${msg.sender === 'user' ? 'user-msg' : msg.is_auto ? 'auto-msg' : 'support-msg'}`;
        const content = msg.file_url ? `${msg.content} <a href="${msg.file_url}" target="_blank">View File</a>` : msg.content;
        messageElement.innerHTML = `
          <p>${content}</p>
          <span class="timestamp">${new Date(msg.created_at).toLocaleString()}</span>
        `;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      })
      .subscribe();
  }

  // File input preview
  document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const filePreview = document.getElementById('filePreview');
        if (file.type.startsWith('image/')) {
          filePreview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100px; max-height: 100px;" />`;
        } else {
          filePreview.innerHTML = `<p>File selected: ${file.name}</p>`;
        }
      };
      reader.readAsDataURL(file);
    }
  });

  checkUser();
});
