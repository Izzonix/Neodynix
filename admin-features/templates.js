/* --------------------------------------------------------------
   TEMPLATES – upload, list, edit, delete
   -------------------------------------------------------------- */
import { supabase } from '../supabase-config.js';

const uploadForm = document.getElementById('uploadForm');
const templateList = document.getElementById('templateList');
const editTemplateModal = document.getElementById('editTemplateModal');
const editTemplateForm = document.getElementById('editTemplateForm');
const cancelEditBtn = document.getElementById('cancelEdit');

let templates = [];
const validCategories = [
  'business','portfolio','education','ecommerce','charity','blog',
  'healthcare','event','church','nonprofit','other'
];

/* ---------- FETCH ---------- */
window.fetchTemplates = async () => {
  try {
    templateList.innerHTML = '';
    const { data, error } = await supabase.from('templates').select('*');
    if (error) throw error;
    templates = data || [];
    if (!templates.length) {
      templateList.innerHTML = '<p>No templates available.</p>';
      return;
    }
    templates.forEach(t => {
      const card = document.createElement('div');
      card.className = 'template-card';
      card.innerHTML = `
        <img src="${t.image||'https://via.placeholder.com/150'}" alt="${t.name}">
        <h3>${t.name}</h3>
        <p>Category: ${t.category}</p>
        <p>Prices: UGX ${t.price_ugx.toFixed(2)}, KSH ${t.price_ksh.toFixed(2)},
                TSH ${t.price_tsh.toFixed(2)}, USD ${t.price_usd.toFixed(2)}</p>
        <p>Rates: ${t.rate_per_month.toFixed(2)}/month, ${t.rate_per_page.toFixed(2)}/page</p>
        <a href="${t.link}" target="_blank">Preview</a>
        <div class="button-container">
          <button class="btn" onclick="editTemplate('${t.id}')">Edit</button>
          <button class="btn btn-delete" onclick="deleteTemplate('${t.id}')">Delete</button>
        </div>`;
      templateList.appendChild(card);
    });
  } catch (e) {
    console.error(e);
    window.showResult('Failed to load templates.', false);
  }
};

/* ---------- UPLOAD ---------- */
uploadForm?.addEventListener('submit', uploadTemplate);

document.getElementById('imageFile')?.addEventListener('change', e => {
  const f = e.target.files[0];
  if (f) {
    const r = new FileReader();
    r.onload = ev => document.getElementById('imagePreview').innerHTML = `<img src="${ev.target.result}" alt="Preview">`;
    r.readAsDataURL(f);
  }
});

document.getElementById('editImageFile')?.addEventListener('change', e => {
  const f = e.target.files[0];
  if (f) {
    const r = new FileReader();
    r.onload = ev => document.getElementById('editImagePreview').innerHTML = `<img src="${ev.target.result}" alt="Preview">`;
    r.readAsDataURL(f);
  }
});

async function uploadTemplate(e) {
  e.preventDefault();
  const name = uploadForm.name.value.trim();
  const cat  = uploadForm.category.value.trim().toLowerCase();
  const desc = uploadForm.description.value.trim();
  const link = uploadForm.link.value.trim();
  const p_ugx = +uploadForm.price_ugx.value||0;
  const p_ksh = +uploadForm.price_ksh.value||0;
  const p_tsh = +uploadForm.price_tsh.value||0;
  const p_usd = +uploadForm.price_usd.value||0;
  const r_m   = +uploadForm.rate_per_month.value||0;
  const r_p   = +uploadForm.rate_per_page.value||0;
  const img   = uploadForm.imageFile.files[0];

  if (!name) return window.showResult('Name required.', false);
  if (!validCategories.includes(cat)) return window.showResult(`Invalid category. Use: ${validCategories.join(', ')}`, false);
  if (!img) return window.showResult('Select an image.', false);
  if ([p_ugx,p_ksh,p_tsh,p_usd,r_m,r_p].some(v=>v<0)) return window.showResult('Prices/rates ≥ 0.', false);

  window.loadingPopup.style.display = 'flex';
  try {
    const fName = `images/${Date.now()}_${img.name.replace(/[^a-zA-Z0-9.-]/g,'_')}`;
    const { error: upErr } = await supabase.storage.from('templates')
      .upload(fName, img, { upsert:false, contentType:img.type });
    if (upErr) throw upErr;

    const { data:{publicUrl} } = supabase.storage.from('templates').getPublicUrl(fName);
    const { error: insErr } = await supabase.from('templates').insert([{
      name, category:cat, description:desc, link,
      price_ugx:p_ugx, price_ksh:p_ksh, price_tsh:p_tsh, price_usd:p_usd,
      rate_per_month:r_m, rate_per_page:r_p, image:publicUrl
    }]);
    if (insErr) throw insErr;

    uploadForm.reset();
    document.getElementById('imagePreview').innerHTML = '';
    window.showResult('Template uploaded!', true);
    window.fetchTemplates();
  } catch (err) {
    console.error(err);
    window.showResult(`Upload failed: ${err.message}`, false);
  } finally {
    window.loadingPopup.style.display = 'none';
  }
}

/* ---------- EDIT ---------- */
window.editTemplate = async id => {
  try {
    const { data:t, error } = await supabase.from('templates').select('*').eq('id',id).single();
    if (error||!t) throw error||new Error('Not found');

    editTemplateForm.editName.value        = t.name||'';
    editTemplateForm.editCategory.value    = t.category||'';
    editTemplateForm.editDescription.value = t.description||'';
    editTemplateForm.editLink.value        = t.link||'';
    editTemplateForm.editPriceUgx.value    = t.price_ugx||0;
    editTemplateForm.editPriceKsh.value    = t.price_ksh||0;
    editTemplateForm.editPriceTsh.value    = t.price_tsh||0;
    editTemplateForm.editPriceUsd.value    = t.price_usd||0;
    editTemplateForm.editRatePerMonth.value= t.rate_per_month||0;
    editTemplateForm.editRatePerPage.value = t.rate_per_page||0;
    document.getElementById('editImagePreview').innerHTML = t.image?`<img src="${t.image}" alt="Current">`:'';

    editTemplateModal.style.display = 'flex';

    // fresh submit handler (clone to avoid duplicate listeners)
    const fresh = editTemplateForm.cloneNode(true);
    editTemplateForm.replaceWith(fresh);
    fresh.addEventListener('submit', async ev => {
      ev.preventDefault();
      const upd = {
        name: fresh.editName.value.trim(),
        category: fresh.editCategory.value.trim().toLowerCase(),
        description: fresh.editDescription.value.trim(),
        link: fresh.editLink.value.trim(),
        price_ugx: +fresh.editPriceUgx.value||0,
        price_ksh: +fresh.editPriceKsh.value||0,
        price_tsh: +fresh.editPriceTsh.value||0,
        price_usd: +fresh.editPriceUsd.value||0,
        rate_per_month: +fresh.editRatePerMonth.value||0,
        rate_per_page: +fresh.editRatePerPage.value||0
      };
      if (!upd.name) return window.showResult('Name required.', false);
      if (!validCategories.includes(upd.category)) return window.showResult('Invalid category.', false);
      if ([upd.price_ugx,upd.price_ksh,upd.price_tsh,upd.price_usd,upd.rate_per_month,upd.rate_per_page].some(v=>v<0))
        return window.showResult('Prices/rates ≥ 0.', false);

      let imgUrl = t.image;
      const newImg = fresh.editImageFile.files[0];
      window.loadingPopup.style.display='flex';
      try {
        if (newImg) {
          const fName = `images/${Date.now()}_${newImg.name.replace(/[^a-zA-Z0-9.-]/g,'_')}`;
          const { error:upErr } = await supabase.storage.from('templates')
            .upload(fName, newImg, { upsert:false, contentType:newImg.type });
          if (upErr) throw upErr;
          const { data:{publicUrl} } = supabase.storage.from('templates').getPublicUrl(fName);
          imgUrl = publicUrl;
          if (t.image) {
            const old = t.image.split('/').slice(-2).join('/');
            await supabase.storage.from('templates').remove([old]);
          }
        }
        const { error } = await supabase.from('templates')
          .update({ ...upd, image:imgUrl }).eq('id',id);
        if (error) throw error;

        fresh.reset();
        editTemplateModal.style.display='none';
        document.getElementById('editImagePreview').innerHTML='';
        window.showResult('Template updated!', true);
        window.fetchTemplates();
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
window.deleteTemplate = id => {
  window.showConfirm('Delete this template?', async () => {
    window.loadingPopup.style.display='flex';
    try {
      const tmpl = templates.find(t=>t.id===id);
      if (tmpl?.image) {
        const path = tmpl.image.split('/').slice(-2).join('/');
        await supabase.storage.from('templates').remove([path]);
      }
      const { error } = await supabase.from('templates').delete().eq('id',id);
      if (error) throw error;
      window.showResult('Deleted!', true);
      window.fetchTemplates();
    } catch (e) {
      console.error(e);
      window.showResult(`Delete failed: ${e.message}`, false);
    } finally { window.loadingPopup.style.display='none'; }
  });
};

cancelEditBtn?.addEventListener('click', () => {
  editTemplateModal.style.display='none';
  editTemplateForm.reset();
  document.getElementById('editImagePreview').innerHTML='';
});
