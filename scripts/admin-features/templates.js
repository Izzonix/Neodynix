/* --------------------------------------------------------------
   TEMPLATES – upload, list, edit, delete + SEARCH
   -------------------------------------------------------------- */
import { supabase } from '../supabase-config.js';

const uploadForm = document.getElementById('uploadForm');
const templateList = document.getElementById('templateList');
const editTemplateModal = document.getElementById('editTemplateModal');
const editTemplateForm = document.getElementById('editTemplateForm');
const searchInput = document.getElementById('templateSearch');

let templates = [];
const validCategories = ['business','portfolio','education','ecommerce','charity','blog','healthcare','event','church','nonprofit','other'];

/* ---------- SEARCH ---------- */
searchInput?.addEventListener('input', () => {
  const term = searchInput.value.toLowerCase().trim();
  const filtered = templates.filter(t => t.name.toLowerCase().includes(term));
  renderTemplates(filtered);
});

/* ---------- RENDER ---------- */
function renderTemplates(list) {
  templateList.innerHTML = '';
  if (!list.length) {
    templateList.innerHTML = '<p style="text-align:center; color:#ccc;">No templates found.</p>';
    return;
  }

  list.forEach(t => {
    const card = document.createElement('div');
    card.className = 'template-card';
    card.innerHTML = `
      <img src="${t.image || 'https://via.placeholder.com/150'}" alt="${t.name}">
      <h3>${t.name}</h3>
      <p>Category: ${t.category}</p>
      <p>Prices: UGX ${Number(t.price_ugx).toFixed(2)}, KSH ${Number(t.price_ksh).toFixed(2)}, TSH ${Number(t.price_tsh).toFixed(2)}, USD ${Number(t.price_usd).toFixed(2)}</p>
      <p>Rates: ${Number(t.rate_per_month).toFixed(2)}/month, ${Number(t.rate_per_page).toFixed(2)}/page</p>
      <a href="${t.link}" target="_blank">Preview</a>
      <div class="button-container">
        <button class="btn" onclick="editTemplate('${t.id}')">Edit</button>
        <button class="btn btn-delete" onclick="deleteTemplate('${t.id}')">Delete</button>
      </div>`;
    templateList.appendChild(card);
  });
}

/* ---------- FETCH ---------- */
window.fetchTemplates = async () => {
  try {
    templateList.innerHTML = '<p style="text-align:center;">Loading templates...</p>';
    const { data, error } = await supabase.from('templates').select('*');
    if (error) throw error;
    templates = data || [];
    renderTemplates(templates);
  } catch (e) {
    console.error(e);
    templateList.innerHTML = '<p class="error">Failed to load templates.</p>';
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
  const p_ugx = +uploadForm.price_ugx.value || 0;
  const p_ksh = +uploadForm.price_ksh.value || 0;
  const p_tsh = +uploadForm.price_tsh.value || 0;
  const p_usd = +uploadForm.price_usd.value || 0;
  const r_m   = +uploadForm.rate_per_month.value || 0;
  const r_p   = +uploadForm.rate_per_page.value || 0;
  const img   = uploadForm.imageFile.files[0];

  if (!name || !validCategories.includes(cat) || !img) {
    window.showResult('Fill all required fields correctly.', false);
    return;
  }

  window.loadingPopup.style.display = 'flex';
  try {
    const fName = `images/${Date.now()}_${img.name.replace(/[^a-zA-Z0-9.-]/g,'_')}`;
    const { error: upErr } = await supabase.storage.from('templates').upload(fName, img, { upsert: false });
    if (upErr) throw upErr;

    const { data: { publicUrl } } = supabase.storage.from('templates').getPublicUrl(fName);

    const { error: insErr } = await supabase.from('templates').insert([{
      name, category: cat, description: desc, link,
      price_ugx: p_ugx, price_ksh: p_ksh, price_tsh: p_tsh, price_usd: p_usd,
      rate_per_month: r_m, rate_per_page: r_p, image: publicUrl
    }]);
    if (insErr) throw insErr;

    uploadForm.reset();
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('imageFile').value = ''; // Fixed
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
    const { data: t, error } = await supabase.from('templates').select('*').eq('id', id).single();
    if (error || !t) throw error || new Error('Not found');

    editTemplateForm.editName.value = t.name || '';
    editTemplateForm.editCategory.value = t.category || '';
    editTemplateForm.editDescription.value = t.description || '';
    editTemplateForm.editLink.value = t.link || '';
    editTemplateForm.editPriceUgx.value = t.price_ugx || 0;
    editTemplateForm.editPriceKsh.value = t.price_ksh || 0;
    editTemplateForm.editPriceTsh.value = t.price_tsh || 0;
    editTemplateForm.editPriceUsd.value = t.price_usd || 0;
    editTemplateForm.editRatePerMonth.value = t.rate_per_month || 0;
    editTemplateForm.editRatePerPage.value = t.rate_per_page || 0;
    document.getElementById('editImagePreview').innerHTML = t.image ? `<img src="${t.image}" alt="Current">` : '';

    editTemplateModal.style.display = 'flex';

    const fresh = editTemplateForm.cloneNode(true);
    editTemplateForm.replaceWith(fresh);

    fresh.addEventListener('submit', async ev => {
      ev.preventDefault();
      const upd = {
        name: fresh.editName.value.trim(),
        category: fresh.editCategory.value.trim().toLowerCase(),
        description: fresh.editDescription.value.trim(),
        link: fresh.editLink.value.trim(),
        price_ugx: +fresh.editPriceUgx.value || 0,
        price_ksh: +fresh.editPriceKsh.value || 0,
        price_tsh: +fresh.editPriceTsh.value || 0,
        price_usd: +fresh.editPriceUsd.value || 0,
        rate_per_month: +fresh.editRatePerMonth.value || 0,
        rate_per_page: +fresh.editRatePerPage.value || 0
      };

      let imgUrl = t.image;
      const newImg = fresh.editImageFile.files[0];

      window.loadingPopup.style.display = 'flex';
      try {
        if (newImg) {
          const fName = `images/${Date.now()}_${newImg.name.replace(/[^a-zA-Z0-9.-]/g,'_')}`;
          await supabase.storage.from('templates').upload(fName, newImg, { upsert: false });
          const { data: { publicUrl } } = supabase.storage.from('templates').getPublicUrl(fName);
          imgUrl = publicUrl;

          if (t.image) {
            const oldPath = t.image.split('/').slice(-2).join('/');
            await supabase.storage.from('templates').remove([oldPath]);
          }
        }

        const { error } = await supabase.from('templates').update({ ...upd, image: imgUrl }).eq('id', id);
        if (error) throw error;

        editTemplateModal.style.display = 'none';
        document.getElementById('editImagePreview').innerHTML = '';
        fresh.editImageFile.value = '';
        window.showResult('Template updated!', true);
        window.fetchTemplates();
      } catch (er) {
        console.error(er);
        window.showResult(`Update failed: ${er.message}`, false);
      } finally {
        window.loadingPopup.style.display = 'none';
      }
    });
  } catch (e) {
    console.error(e);
    window.showResult('Failed to load template.', false);
  }
};

/* ---------- CANCEL EDIT (Fixed) ---------- */
document.addEventListener('click', e => {
  if (e.target.id === 'cancelEdit' || e.target.closest('#cancelEdit')) {
    editTemplateModal.style.display = 'none';
    document.getElementById('editImagePreview').innerHTML = '';
    document.getElementById('editImageFile').value = '';
  }
  if (e.target.id === 'cancelKnowledgeEdit' || e.target.closest('#cancelKnowledgeEdit')) {
    document.getElementById('editKnowledgeModal').style.display = 'none';
  }
});

/* ---------- DELETE ---------- */
window.deleteTemplate = id => {
  window.showConfirm('Delete this template permanently?', async () => {
    window.loadingPopup.style.display = 'flex';
    try {
      const tmpl = templates.find(t => t.id === id);
      if (tmpl?.image) {
        const path = tmpl.image.split('/').slice(-2).join('/');
        await supabase.storage.from('templates').remove([path]);
      }
      await supabase.from('templates').delete().eq('id', id);
      window.showResult('Template deleted!', true);
      window.fetchTemplates();
    } catch (e) {
      console.error(e);
      window.showResult('Delete failed.', false);
    } finally {
      window.loadingPopup.style.display = 'none';
    }
  });
};
