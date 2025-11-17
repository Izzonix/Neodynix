/* --------------------------------------------------------------
   KNOWLEDGE – add, list, edit, delete
   -------------------------------------------------------------- */
import { supabase } from '../supabase-config.js';

let knowledgeEntries = [];

window.fetchKnowledge = async () => {
  const list = document.getElementById('knowledgeList');
  list.innerHTML = '';
  try {
    const { data, error } = await supabase.from('knowledge')
      .select('*').order('priority', { ascending:false });
    if (error) throw error;
    knowledgeEntries = data || [];
    if (!knowledgeEntries.length) {
      list.innerHTML = '<p>No knowledge entries.</p>';
      return;
    }
    knowledgeEntries.forEach(e => {
      const kw = Array.isArray(e.keywords) ? e.keywords.join(', ') : e.keywords||'None';
      const card = document.createElement('div');
      card.className = 'knowledge-card';
      card.innerHTML = `
        <h4>${e.question}</h4>
        <p><strong>Category:</strong> ${e.category}</p>
        <p><strong>Answer:</strong> ${e.answer.substring(0,100)}...</p>
        <p><strong>Keywords:</strong> ${kw}</p>
        <p><strong>Priority:</strong> ${e.priority||0} | <strong>Active:</strong> ${e.is_active?'Yes':'No'}</p>
        <div class="button-container">
          <button class="btn" onclick="editKnowledge('${e.id}')">Edit</button>
          <button class="btn btn-delete" onclick="deleteKnowledge('${e.id}')">Delete</button>
        </div>`;
      list.appendChild(card);
    });
  } catch (e) {
    console.error(e);
    window.showResult('Failed to load knowledge.', false);
  }
};

/* ---------- ADD ---------- */
document.getElementById('addKnowledgeForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const entry = {
    category: fd.get('category'),
    question: fd.get('question').trim(),
    answer:   fd.get('answer').trim(),
    keywords: fd.get('keywords') ? fd.get('keywords').split(',').map(k=>k.trim()).filter(k=>k) : [],
    priority: +fd.get('priority')||0,
    is_active: fd.get('is_active')==='true'
  };
  if (!entry.question||!entry.answer||!entry.category) return window.showResult('Fill required fields.', false);

  window.loadingPopup.style.display='flex';
  try {
    const { error } = await supabase.from('knowledge').insert([entry]);
    if (error) throw error;
    e.target.reset();
    window.showResult('Added!', true);
    window.fetchKnowledge();
  } catch (er) {
    console.error(er);
    window.showResult(`Add failed: ${er.message}`, false);
  } finally { window.loadingPopup.style.display='none'; }
});

/* ---------- EDIT ---------- */
window.editKnowledge = async id => {
  try {
    const { data:e, error } = await supabase.from('knowledge').select('*').eq('id',id).single();
    if (error||!e) throw error||new Error('Not found');

    document.getElementById('editKnowledgeId').value       = id;
    document.getElementById('editKnowledgeCategory').value = e.category||'';
    document.getElementById('editQuestion').value          = e.question||'';
    document.getElementById('editAnswer').value            = e.answer||'';
    document.getElementById('editKeywords').value          = Array.isArray(e.keywords)?e.keywords.join(', '):e.keywords||'';
    document.getElementById('editPriority').value          = e.priority||0;
    document.getElementById('editIsActive').value          = e.is_active?'true':'false';

    const modal = document.getElementById('editKnowledgeModal');
    modal.style.display='flex';

    const fresh = document.getElementById('editKnowledgeForm').cloneNode(true);
    document.getElementById('editKnowledgeForm').replaceWith(fresh);
    fresh.addEventListener('submit', async ev => {
      ev.preventDefault();
      const upd = {
        category: fresh.editKnowledgeCategory.value,
        question: fresh.editQuestion.value.trim(),
        answer:   fresh.editAnswer.value.trim(),
        keywords: fresh.editKeywords.value ? fresh.editKeywords.value.split(',').map(k=>k.trim()).filter(k=>k) : [],
        priority: +fresh.editPriority.value||0,
        is_active: fresh.editIsActive.value==='true'
      };
      if (!upd.question||!upd.answer||!upd.category) return window.showResult('Fill required fields.', false);

      window.loadingPopup.style.display='flex';
      try {
        const { error } = await supabase.from('knowledge').update(upd).eq('id',id);
        if (error) throw error;
        fresh.reset();
        modal.style.display='none';
        window.showResult('Updated!', true);
        window.fetchKnowledge();
      } catch (er) {
        console.error(er);
        window.showResult(`Update failed: ${er.message}`, false);
      } finally { window.loadingPopup.style.display='none'; }
    });
  } catch (e) {
    console.error(e);
    window.showResult(`Load failed: ${e.message}`, false);
  }
};

/* ---------- DELETE ---------- */
window.deleteKnowledge = id => {
  window.showConfirm('Delete this entry?', async () => {
    window.loadingPopup.style.display='flex';
    try {
      const { error } = await supabase.from('knowledge').delete().eq('id',id);
      if (error) throw error;
      window.showResult('Deleted!', true);
      window.fetchKnowledge();
    } catch (e) {
      console.error(e);
      window.showResult(`Delete failed: ${e.message}`, false);
    } finally { window.loadingPopup.style.display='none'; }
  });
};

document.getElementById('cancelKnowledgeEdit')?.addEventListener('click', () => {
  document.getElementById('editKnowledgeModal').style.display='none';
  document.getElementById('editKnowledgeForm').reset();
});
