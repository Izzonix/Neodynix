import { supabase } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  // Auto-fill request form
  function autoFillForm() {
    const getParam = key => new URLSearchParams(window.location.search).get(key);
    const category = getParam('category');
    const template = getParam('template');
    const categoryInput = document.getElementById('category');
    const templateInput = document.getElementById('template');
    if (category && categoryInput) categoryInput.value = decodeURIComponent(category);
    if (template && templateInput) templateInput.value = decodeURIComponent(template);
  }

  // Run autofill if on request.html
  if (window.location.pathname.includes('request.html')) {
    autoFillForm();
  }

  // Template-related logic
  const templateContainer = document.getElementById('template-container');
  if (templateContainer) {
    async function fetchTemplates() {
      try {
        const { data, error } = await supabase.from('templates').select('*');
        if (error) throw error;

        templateContainer.innerHTML = '';

        if (!data || data.length === 0) {
          templateContainer.innerHTML = `<p class="no-templates">🚀 No templates available yet. Please check back soon!</p>`;
          return;
        }

        data.forEach(template => {
          const card = document.createElement('div');
          card.className = 'template-card';
          card.setAttribute('data-category', template.category || 'Other');
          card.innerHTML = `
            <a href="${template.link}" target="_blank">
              <img src="${template.image}" alt="${template.name} Template" />
            </a>
            <h3>${template.name}</h3>
            <p>${template.description || ''}</p>
            <a href="request.html?category=${encodeURIComponent(template.category)}&template=${encodeURIComponent(template.name)}" class="btn">Choose Template</a>
          `;
          templateContainer.appendChild(card);
        });

        // Keep current category filter
        const activeButton = document.querySelector('.category-buttons button.active');
        if (activeButton) showCategory(activeButton.textContent);
      } catch (error) {
        console.error('Error fetching templates:', error);
        templateContainer.innerHTML = `<p class="error">⚠️ Failed to load templates. Please try again later.</p>`;
      }
    }

    // Initial load
    fetchTemplates();

    // Category buttons
    const categoryButtons = document.querySelectorAll('.category-buttons button, #more-categories button');
    categoryButtons.forEach(button => {
      button.addEventListener('click', () => {
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        if (button.id !== 'more-button') showCategory(button.textContent);
      });
    });

    // Show category
    window.showCategory = function(category) {
      const cards = document.querySelectorAll('.template-card');
      cards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (category === 'All' || cardCategory === category) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    };

    // Toggle more categories
    window.toggleMoreCategories = function() {
      const moreCategories = document.getElementById('more-categories');
      moreCategories.style.display = moreCategories.style.display === 'none' ? 'flex' : 'none';
    };

    // Search templates
    window.filterTemplates = function() {
      const searchInput = document.getElementById('search-input').value.toLowerCase();
      const templateCards = document.querySelectorAll('.template-card');
      templateCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        card.style.display = title.includes(searchInput) ? 'block' : 'none';
      });
    };
  }
});
