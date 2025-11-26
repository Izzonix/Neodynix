import { supabase } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  // Auto-fill request form if coming from template
  function autoFillForm() {
    const getParam = key => new URLSearchParams(window.location.search).get(key);
    const category = getParam('category');
    const template = getParam('template');
    const categoryInput = document.getElementById('category');
    const templateInput = document.getElementById('template');
    if (category && categoryInput) categoryInput.value = decodeURIComponent(category);
    if (template && templateInput) templateInput.value = decodeURIComponent(template);
  }

  if (window.location.pathname.includes('request.html')) {
    autoFillForm();
  }

  const templateContainer = document.getElementById('template-container');
  if (!templateContainer) return;

  let allTemplates = [];
  let displayedCount = 0;
  const templatesPerLoad = 6;

  async function fetchTemplates() {
    try {
      const { data, error } = await supabase.from('templates').select('*');
      if (error) throw error;

      allTemplates = data || [];
      templateContainer.innerHTML = '';

      if (allTemplates.length === 0) {
        templateContainer.innerHTML = `<p class="no-templates" style="text-align:center; color:#ccc; font-size:1.2rem;">No templates available yet. Please check back soon!</p>`;
        return;
      }

      displayedCount = 0;
      loadMoreTemplates();
      updateViewMoreButton();
    } catch (error) {
      console.error('Error fetching templates:', error);
      templateContainer.innerHTML = `<p class="error" style="text-align:center; color:#ff6b6b;">Failed to load templates. Please try again later.</p>`;
    }
  }

  function loadMoreTemplates() {
    const activeButton = document.querySelector('.category-buttons button.active, #more-categories button.active') || document.querySelector('.category-buttons button');
    const currentCategory = activeButton ? activeButton.textContent.trim() : 'All';

    const templatesToShow = allTemplates
      .filter(t => currentCategory === 'All' || (t.category || 'Other').trim().toLowerCase() === currentCategory.toLowerCase())
      .slice(displayedCount, displayedCount + templatesPerLoad);

    templatesToShow.forEach(template => {
      const card = document.createElement('div');
      card.className = 'template-card';
      card.setAttribute('data-category', (template.category || 'Other').trim());

      card.innerHTML = `
        <div class="template-preview-wrapper">
          <a href="${template.link}" target="_blank" class="preview-link" aria-label="Preview ${template.name}">
            <img src="${template.image}" alt="${template.name} Template Preview" loading="lazy">
            <div class="preview-overlay">
              <div class="preview-text">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>Click to Preview</span>
              </div>
            </div>
          </a>
        </div>
        <h3>${template.name}</h3>
        <p>${template.description || 'Professional, responsive, and ready to use.'}</p>
        <div class="template-actions">
          <a href="request.html?category=${encodeURIComponent(template.category || 'Other')}&template=${encodeURIComponent(template.name)}" class="btn primary">Choose Template</a>
        </div>
      `;

      templateContainer.appendChild(card);
    });

    displayedCount += templatesToShow.length;
    updateViewMoreButton();
  }

  function updateViewMoreButton() {
    let viewMoreBtn = document.getElementById('view-more-button');
    const activeBtn = document.querySelector('.category-buttons button.active, #more-categories button.active') || document.querySelector('.category-buttons button');
    const currentCategory = activeBtn?.textContent.trim() || 'All';

    const remaining = allTemplates.filter(t => 
      currentCategory === 'All' || (t.category || 'Other').trim().toLowerCase() === currentCategory.toLowerCase()
    ).length - displayedCount;

    if (!viewMoreBtn && remaining > 0) {
      viewMoreBtn = document.createElement('button');
      viewMoreBtn.id = 'view-more-button';
      viewMoreBtn.textContent = 'Load More Templates';
      viewMoreBtn.style.cssText = 'display:block; margin:40px auto; padding:14px 32px; background:#4fc3f7; color:#000; border:none; border-radius:8px; font-weight:bold; cursor:pointer;';
      viewMoreBtn.onclick = loadMoreTemplates;
      templateContainer.after(viewMoreBtn);
    }

    if (viewMoreBtn) viewMoreBtn.style.display = remaining > 0 ? 'block' : 'none';
  }

  // Category filtering
  document.querySelectorAll('.category-buttons button, #more-categories button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-buttons button, #more-categories button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      templateContainer.innerHTML = '';
      displayedCount = 0;
      loadMoreTemplates();
    });
  });

  // Expose functions to global scope for inline HTML calls
  window.toggleMoreCategories = () => {
    const more = document.getElementById('more-categories');
    const btn = document.getElementById('more-button');
    const visible = more.style.display === 'flex';
    more.style.display = visible ? 'none' : 'flex';
    btn.textContent = visible ? 'More' : 'Hide';
  };

  window.filterTemplates = () => {
    const term = document.getElementById('search-input').value.toLowerCase();
    document.querySelectorAll('.template-card').forEach(card => {
      const title = card.querySelector('h3').textContent.toLowerCase();
      card.style.display = title.includes(term) ? 'block' : 'none';
    });
  };

  // Initial load
  fetchTemplates();
});
