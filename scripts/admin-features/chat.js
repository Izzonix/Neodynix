/* --------------------------------------------------------------
   CHAT – list, reply, delete + Show/Hide (Matching Custom Requests)
   -------------------------------------------------------------- */
import { supabase } from '../supabase-config.js';

const replyForm   = document.getElementById('chatReplyForm');
const listDiv     = document.getElementById('chatRequestList');
const resultDiv   = document.getElementById('chatResult');

window.fetchChatRequests = async () => {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id,user_id,content,created_at,replied,is_auto,file_url,users(name,email)')
      .order('created_at', { ascending: false });
    if (error) throw error;

    listDiv.innerHTML = '';
    if (!messages.length) {
      listDiv.innerHTML = '<p style="text-align:center; color:#ccc;">No messages yet.</p>';
      return;
    }

    const users = new Map();
    messages.forEach(m => {
      const uid = m.user_id;
      if (!users.has(uid)) users.set(uid, { name: m.users?.name || 'Guest', email: m.users?.email || 'No email', msgs: [] });
      users.get(uid).msgs.push({
        id: m.id, content: m.content, ts: m.created_at,
        replied: m.replied, auto: m.is_auto, file: m.file_url
      });
    });

    users.forEach((u, uid) => {
      u.msgs.sort((a, b) => new Date(b.ts) - new Date(a.ts));
      u.msgs = u.msgs.slice(0, 5);

      const card = document.createElement('div');
      card.className = 'chat-request-card';
      card.id = `card-${uid}`;
      card.innerHTML = `
        <h3>${u.name}</h3>
        <p><strong>Email:</strong> ${u.email}</p>
        <button id="toggle-${uid}" class="btn" onclick="toggleChatDetails('${uid}')">Show Details</button>
        <div id="details-${uid}" style="display:none;">
          <p><strong>Messages:</strong></p>
          <ul>
            ${u.msgs.map(m => {
              const txt = m.file ? `<a href="${m.file}" target="_blank">${m.content} [File]</a>` : m.content;
              return `<li>
                <p><strong>${m.replied ? 'Replied' : 'Pending'}</strong> • ${new Date(m.ts).toLocaleString()}</p>
                <p>${txt}</p>
                ${!m.auto ? `<button class="btn" onclick="replyToChat('${m.id}','${u.name}','${u.email}')" ${m.replied ? 'disabled' : ''}>Reply</button>` : ''}
              </li>`;
            }).join('')}
          </ul>
          <button class="btn btn-delete" onclick="deleteChat('${uid}')">Delete Chat</button>
        </div>`;
      listDiv.appendChild(card);
    });
  } catch (e) {
    console.error(e);
    resultDiv.className = 'result error';
    resultDiv.textContent = 'Load failed.';
  }
};

window.toggleChatDetails = id => {
  const det = document.getElementById(`details-${id}`);
  const btn = document.getElementById(`toggle-${id}`);
  if (det.style.display === 'none' || !det.style.display) {
    det.style.display = 'block';
    btn.textContent = 'Hide Details';
    btn.className = 'btn btn-cancel';
  } else {
    det.style.display = 'none';
    btn.textContent = 'Show Details';
    btn.className = 'btn';
  }
};

window.replyToChat = (msgId, name, email) => {
  document.getElementById('replyUserId').value = msgId;
  document.getElementById('replyUserInfo').textContent = `Replying to: ${name} (${email})`;
  replyForm.replyMessage.focus();
};

window.deleteChat = uid => {
  window.showConfirm('Delete entire chat history?', async () => {
    window.loadingPopup.style.display = 'flex';
    try {
      const { data: msgs } = await supabase.from('messages').select('file_url').eq('user_id', uid);
      for (const m of msgs) if (m.file_url) {
        const p = m.file_url.split('/').pop();
        await supabase.storage.from('chat-files').remove([p]);
      }
      await supabase.from('messages').delete().eq('user_id', uid);
      await supabase.from('users').delete().eq('id', uid);
      window.showResult('Chat deleted.', true);
      window.fetchChatRequests();
    } catch (e) {
      console.error(e);
      window.showResult('Delete failed.', false);
    } finally {
      window.loadingPopup.style.display = 'none';
    }
  });
};

replyForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const msgId = replyForm.replyUserId.value;
  const txt = replyForm.replyMessage.value.trim();
  if (!msgId || !txt) return;

  window.loadingPopup.style.display = 'flex';
  try {
    const { data: m } = await supabase.from('messages').select('user_id').eq('id', msgId).single();
    await supabase.from('messages').insert({ user_id: m.user_id, content: txt, sender: 'support', is_auto: false });
    await supabase.from('messages').update({ replied: true }).eq('id', msgId);
    replyForm.reset();
    document.getElementById('replyUserId').value = '';
    document.getElementById('replyUserInfo').textContent = '';
    window.showResult('Reply sent!', true);
    window.fetchChatRequests();
  } catch (e) {
    console.error(e);
    window.showResult('Send failed.', false);
  } finally {
    window.loadingPopup.style.display = 'none';
  }
});
