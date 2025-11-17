/* --------------------------------------------------------------
   CHAT – list, reply, delete
   -------------------------------------------------------------- */
import { supabase } from './supabase-config.js';

const replyForm   = document.getElementById('chatReplyForm');
const listDiv     = document.getElementById('chatRequestList');
const resultDiv   = document.getElementById('chatResult');

window.fetchChatRequests = async () => {
  try {
    const { data:messages, error } = await supabase
      .from('messages')
      .select('id,user_id,content,created_at,replied,is_auto,file_url,users(name,email)')
      .order('created_at', { ascending:false });
    if (error) throw error;

    listDiv.innerHTML = '';
    if (!messages.length) { listDiv.innerHTML = '<p>No messages.</p>'; return; }

    const users = new Map();
    messages.forEach(m => {
      const uid = m.user_id;
      if (!users.has(uid)) users.set(uid, { name:m.users?.name||'?', email:m.users?.email||'?', msgs:[] });
      users.get(uid).msgs.push({
        id:m.id, content:m.content, ts:m.created_at,
        replied:m.replied, auto:m.is_auto, file:m.file_url
      });
    });

    users.forEach((u,uid) => {
      u.msgs.sort((a,b)=>new Date(b.ts)-new Date(a.ts));
      u.msgs = u.msgs.slice(0,5);
      const card = document.createElement('div');
      card.className = 'chat-request-card';
      let html = '<ul>';
      u.msgs.forEach(m => {
        const txt = m.file ? `${m.content} <a href="${m.file}" target="_blank">File</a>` : m.content;
        html += `<li>
          <p>Message: ${txt}</p>
          <p>Sent: ${new Date(m.ts).toLocaleString()}</p>
          <p>Status: ${m.replied?'Replied':'Pending'}</p>
          ${!m.auto?`<button class="btn" onclick="replyToChat('${m.id}','${u.name}','${u.email}')" ${m.replied?'disabled':''}>Reply</button>`:''}
        </li>`;
      });
      html += '</ul>';
      card.innerHTML = `<h3>${u.name} (${u.email})</h3>${html}
        <button class="btn btn-delete" onclick="deleteChat('${uid}')">Delete Chat</button>`;
      listDiv.appendChild(card);
    });
  } catch (e) {
    console.error(e);
    resultDiv.className='result error';
    resultDiv.textContent='Load failed.';
  }
};

/* ---------- DELETE CHAT ---------- */
window.deleteChat = uid => {
  window.showConfirm('Delete whole chat?', async () => {
    window.loadingPopup.style.display='flex';
    try {
      // delete files first
      const { data:msgs } = await supabase.from('messages').select('file_url').eq('user_id',uid);
      for (const m of msgs) if (m.file_url) {
        const p = m.file_url.split('/').slice(-2).join('/');
        await supabase.storage.from('chat-files').remove([p]);
      }
      await supabase.from('messages').delete().eq('user_id',uid);
      await supabase.from('users').delete().eq('id',uid);
      resultDiv.className='result success';
      resultDiv.textContent='Chat deleted.';
      window.fetchChatRequests();
    } catch (e) {
      console.error(e);
      resultDiv.className='result error';
      resultDiv.textContent='Delete failed.';
    } finally { window.loadingPopup.style.display='none'; }
  });
};

/* ---------- REPLY ---------- */
window.replyToChat = (msgId, name, email) => {
  document.getElementById('replyUserId').value = msgId;
  document.getElementById('replyUserInfo').textContent = `Replying to ${name} (${email})`;
  replyForm.replyMessage.focus();
};

replyForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const msgId = replyForm.replyUserId.value;
  const txt   = replyForm.replyMessage.value.trim();
  if (!msgId||!txt) return (resultDiv.className='result error', resultDiv.textContent='Fill fields.');

  window.loadingPopup.style.display='flex';
  try {
    const { data:m, error:f } = await supabase.from('messages').select('user_id').eq('id',msgId).single();
    if (f||!m) throw f||new Error('Not found');
    await supabase.from('messages').insert({ user_id:m.user_id, content:txt, sender:'support', is_auto:false });
    await supabase.from('messages').update({ replied:true }).eq('id',msgId);
    replyForm.reset();
    document.getElementById('replyUserId').value='';
    document.getElementById('replyUserInfo').textContent='';
    resultDiv.className='result success';
    resultDiv.textContent='Reply sent!';
    window.fetchChatRequests();
  } catch (e) {
    console.error(e);
    resultDiv.className='result error';
    resultDiv.textContent='Send failed.';
  } finally { window.loadingPopup.style.display='none'; }
});
