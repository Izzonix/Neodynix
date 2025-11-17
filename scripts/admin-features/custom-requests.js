/* --------------------------------------------------------------
   CUSTOM REQUESTS – list, toggle details, delete file
   -------------------------------------------------------------- */
import { supabase } from '../supabase-config.js';

const listDiv = document.getElementById('customRequestList');

window.fetchCustomRequests = async () => {
  try {
    const { data, error } = await supabase.from('custom_requests')
      .select('*').order('created_at', { ascending:false });
    if (error) throw error;
    listDiv.innerHTML = '';
    if (!data.length) { listDiv.innerHTML = '<p>No requests.</p>'; return; }

    data.forEach(r => {
      const files = { logo:[], media:[], other:[], category_doc:[] };
      (r.files||[]).forEach(f => files[f.type]?.push(f.url));

      const logoHtml   = files.logo.map(u=>`<li data-file-url="${u}" data-file-type="logo"><a href="${u}" download>Logo</a> <button class="btn btn-delete" onclick="deleteFile('${r.id}','${u}','logo')">Del</button></li>`).join('')||'<li>No logo</li>';
      const mediaHtml  = files.media.map(u=>`<li data-file-url="${u}" data-file-type="media"><a href="${u}" download>${u.split('/').pop()}</a> <button class="btn btn-delete" onclick="deleteFile('${r.id}','${u}','media')">Del</button></li>`).join('')||'<li>No media</li>';
      const otherHtml  = files.other.map(u=>`<li data-file-url="${u}" data-file-type="other"><a href="${u}" download>${u.split('/').pop()}</a> <button class="btn btn-delete" onclick="deleteFile('${r.id}','${u}','other')">Del</button></li>`).join('')||'<li>No other</li>';
      const docHtml    = files.category_doc.map(u=>`<li data-file-url="${u}" data-file-type="category_doc"><a href="${u}" download>Doc</a> <button class="btn btn-delete" onclick="deleteFile('${r.id}','${u}','category_doc')">Del</button></li>`).join('')||'<li>No doc</li>';

      const card = document.createElement('div');
      card.className = 'custom-request-card';
      card.id = `card-${r.id}`;
      card.innerHTML = `
        <h3>${r.name}</h3>
        <p><strong>Email:</strong> ${r.email}</p>
        <button id="toggle-${r.id}" class="btn" onclick="toggleDetails('${r.id}')">Show Details</button>
        <div id="details-${r.id}" style="display:none;">
          <p><strong>Phone:</strong> ${r.phone||'N/A'}</p>
          <p><strong>Category:</strong> ${r.category}</p>
          <p><strong>Template:</strong> ${r.template||'N/A'}</p>
          <p><strong>Price:</strong> ${r.price?r.price.toFixed(2):''} ${r.currency||''}</p>
          <p><strong>Message:</strong> ${r.message||'N/A'}</p>
          <p><strong>Social:</strong> ${Array.isArray(r.social_media)?r.social_media.join(', '):'N/A'}</p>
          <p><strong>Audience:</strong> ${r.target_audience||'N/A'}</p>
          <p><strong>Country:</strong> ${r.country||'N/A'}</p>
          <p><strong>Domain:</strong> ${r.domain_name||'N/A'}</p>
          <p><strong>Months:</strong> ${r.duration||'N/A'}</p>
          <p><strong>Pages:</strong> ${r.pages||'N/A'}</p>
          <p><strong>Extra:</strong> ${r.extra_pages||'N/A'}</p>
          <p><strong>Theme:</strong> ${r.theme_color||'N/A'}</p>
          <p><strong>Legacy Doc:</strong> ${r.category_document?`<a href="${r.category_document}" target="_blank">View</a>`:'N/A'}</p>
          <p><strong>Created:</strong> ${new Date(r.created_at).toLocaleString()}</p>

          <h4>Files</h4>
          <h5>Logo</h5><ul>${logoHtml}</ul>
          <h5>Media</h5><ul>${mediaHtml}</ul>
          <h5>Other</h5><ul>${otherHtml}</ul>
          <h5>Doc</h5><ul>${docHtml}</ul>
        </div>`;
      listDiv.appendChild(card);
    });
  } catch (e) {
    console.error(e);
    listDiv.innerHTML = '<p class="error">Load failed.</p>';
  }
};

window.toggleDetails = id => {
  const det = document.getElementById(`details-${id}`);
  const btn = document.getElementById(`toggle-${id}`);
  if (det.style.display==='none' || !det.style.display) {
    det.style.display='block';
    btn.textContent='Hide Details';
    btn.className='btn btn-cancel';
  } else {
    det.style.display='none';
    btn.textContent='Show Details';
    btn.className='btn';
  }
};

window.deleteFile = async (reqId, url, type) => {
  window.showConfirm('Delete this file permanently?', async () => {
    const li = document.querySelector(`li[data-file-url="${url}"]`);
    if (li) li.style.opacity = '0.4';

    window.loadingPopup.style.display = 'flex';
    try {
      const fileName = url.split('/').pop();
      await supabase.storage.from('custom_requests').remove([fileName]);

      const { data: r } = await supabase.from('custom_requests').select('files').eq('id', reqId).single();
      const newFiles = r.files.filter(f => f.url !== url);
      await supabase.from('custom_requests').update({ files: newFiles }).eq('id', reqId);

      if (li) li.remove();
      window.showResult('File deleted.', true);
    } catch (e) {
      console.error(e);
      window.showResult('Delete failed.', false);
      if (li) li.style.opacity = '1';
    } finally {
      window.loadingPopup.style.display = 'none';
    }
  });
};
