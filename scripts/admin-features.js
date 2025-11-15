import { supabase } from './supabase-config.js';

// Templates
const uploadForm = document.getElementById('uploadForm');
const templateList = document.getElementById('templateList');
const editTemplateModal = document.getElementById('editTemplateModal');
const editTemplateForm = document.getElementById('editTemplateForm');
const cancelEditBtn = document.getElementById('cancelEdit');
let templates = [];
const validCategories = ['business', 'portfolio', 'education', 'ecommerce', 'charity', 'blog', 'healthcare', 'event', 'church', 'nonprofit', 'other'];

window.fetchTemplates = async () => {
  try {
    templateList.innerHTML = '';
    const { data, error } = await supabase.from('templates').select('*');
    if (error) throw error;
    templates = data || [];
    if (templates.length === 0) {
      templateList.innerHTML = '<p>No templates available.</p>';
      return;
    }
    templates.forEach(template => {
      const card = document.createElement('div');
      card.className = 'template-card';
      card.innerHTML = `
        <img src="${template.image || 'https://via.placeholder.com/150'}" alt="${template.name}">
        <h3>${template.name}</h3>
        <p>Category: ${template.category}</p>
        <p>Prices: UGX ${template.price_ugx.toFixed(2)}, KSH ${template.price_ksh.toFixed(2)}, TSH ${template.price_tsh.toFixed(2)}, USD ${template.price_usd.toFixed(2)}</p>
        <p>Rates: ${template.rate_per_month.toFixed(2)}/month, ${template.rate_per_page.toFixed(2)}/page</p>
        <a href="${template.link}" target="_blank">Preview</a>
        <div class="button-container">
          <button class="btn" onclick="editTemplate('${template.id}')">Edit</button>
          <button class="btn btn-delete" onclick="deleteTemplate('${template.id}')">Delete</button>
        </div>
      `;
      templateList.appendChild(card);
    });
  } catch (err) {
    console.error('Error fetching templates:', err);
    showResult('Failed to load templates.', false);
  }
};

uploadForm?.addEventListener('submit', uploadTemplate);

document.getElementById('imageFile')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('imagePreview').innerHTML = `<img src="${e.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
  }
});

document.getElementById('editImageFile')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('editImagePreview').innerHTML = `<img src="${e.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
  }
});

async function uploadTemplate(e) {
  e.preventDefault();
  const name = uploadForm.name.value.trim();
  const category = uploadForm.category.value.trim().toLowerCase();
  const description = uploadForm.description.value.trim();
  const link = uploadForm.link.value.trim();
  const price_ugx = parseFloat(uploadForm.price_ugx.value) || 0;
  const price_ksh = parseFloat(uploadForm.price_ksh.value) || 0;
  const price_tsh = parseFloat(uploadForm.price_tsh.value) || 0;
  const price_usd = parseFloat(uploadForm.price_usd.value) || 0;
  const rate_per_month = parseFloat(uploadForm.rate_per_month.value) || 0;
  const rate_per_page = parseFloat(uploadForm.rate_per_page.value) || 0;
  const imageFile = uploadForm.imageFile.files[0];

  if (!name) {
    showResult('Template name is required.', false);
    return;
  }
  if (!validCategories.includes(category)) {
    showResult(`Invalid category. Must be one of: ${validCategories.join(', ')}`, false);
    return;
  }
  if (!imageFile) {
    showResult('Please select an image file.', false);
    return;
  }
  if (price_ugx < 0 || price_ksh < 0 || price_tsh < 0 || price_usd < 0 || rate_per_month < 0 || rate_per_page < 0) {
    showResult('Prices and rates must be non-negative.', false);
    return;
  }

  loadingPopup.style.display = 'flex';
  try {
    const fileName = `images/${Date.now()}_${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('templates')
      .upload(fileName, imageFile, { cacheControl: '3600', upsert: false, contentType: imageFile.type });
    if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

    const { data: publicUrlData } = supabase.storage
      .from('templates')
      .getPublicUrl(fileName);
    if (!publicUrlData.publicUrl) throw new Error('Failed to get public URL for image');

    const { error: insertError } = await supabase.from('templates').insert([
      {
        name,
        category,
        description,
        link,
        price_ugx,
        price_ksh,
        price_tsh,
        price_usd,
        rate_per_month,
        rate_per_page,
        image: publicUrlData.publicUrl
      }
    ]);
    if (insertError) throw new Error(`Database insert failed: ${insertError.message}`);

    uploadForm.reset();
    document.getElementById('imagePreview').innerHTML = '';
    showResult('Template uploaded successfully!', true);
    fetchTemplates();
  } catch (error) {
    console.error('Error uploading template:', error);
    showResult(`Failed to upload template: ${error.message}`, false);
  } finally {
    loadingPopup.style.display = 'none';
  }
}

window.editTemplate = async (id) => {
  // ... (full editTemplate function from original admin.js - unchanged)
};

window.deleteTemplate = (id) => {
  // ... (full deleteTemplate function from original admin.js - unchanged)
};

cancelEditBtn?.addEventListener('click', () => {
  editTemplateModal.style.display = 'none';
  editTemplateForm.reset();
  document.getElementById('editImagePreview').innerHTML = '';
});

// Knowledge (full implementation from previous)
let knowledgeEntries = [];
window.fetchKnowledge = async () => {
  // ... (full fetchKnowledge from previous response - unchanged)
};

const addKnowledgeForm = document.getElementById('addKnowledgeForm');
addKnowledgeForm?.addEventListener('submit', async (e) => {
  // ... (full add handler from previous - unchanged)
});

window.editKnowledge = async (id) => {
  // ... (full editKnowledge from previous - unchanged)
};

window.deleteKnowledge = (id) => {
  // ... (full deleteKnowledge from previous - unchanged)
};

document.getElementById('cancelKnowledgeEdit')?.addEventListener('click', () => {
  document.getElementById('editKnowledgeModal').style.display = 'none';
  document.getElementById('editKnowledgeForm').reset();
});

// Chat (full from original)
const chatReplyForm = document.getElementById('chatReplyForm');
const chatRequestList = document.getElementById('chatRequestList');
const chatResult = document.getElementById('chatResult');

window.fetchChatRequests = async () => {
  // ... (full fetchChatRequests from original - unchanged)
};

window.deleteChat = (userId) => {
  // ... (full from original)
};

window.replyToChat = (id, name, email) => {
  // ... (full from original)
};

chatReplyForm?.addEventListener('submit', async (e) => {
  // ... (full from original)
});

// Custom Requests (full from original)
const customRequestList = document.getElementById('customRequestList');

window.fetchCustomRequests = async () => {
  // ... (full from original, including data-file-url additions)
};

window.toggleDetails = (cardId) => {
  // ... (full from original)
};

window.deleteFile = async (requestId, fileUrl, fileType) => {
  // ... (full improved version from previous)
};

// Email (full from original)
const emailForm = document.getElementById('emailForm');

emailForm?.addEventListener('submit', async (e) => {
  // ... (full from original, note: replace placeholders with real EmailJS creds)
});
