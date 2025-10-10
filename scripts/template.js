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
    let allTemplates = [];
    let displayedCount = 0;
    const templatesPerLoad = 5;

    async function fetchTemplates() {
      try {
        const { data, error } = await supabase.from('templates').select('*');
        if (error) throw error;

        templateContainer.innerHTML = '';
        allTemplates = data || [];

        if (allTemplates.length === 0) {
          templateContainer.innerHTML = `<p class="no-templates">🚀 No templates available yet. Please check back soon!</p>`;
          return;
        }

        displayedCount = 0;
        loadMoreTemplates();

        // Show view more button if more templates exist
        updateViewMoreButton();
      } catch (error) {
        console.error('Error fetching templates:', error);
        templateContainer.innerHTML = `<p class="error">⚠️ Failed to load templates. Please try again later.</p>`;
      }
    }

    function loadMoreTemplates() {
      const activeButton = document.querySelector('.category-buttons button.active');
      const currentCategory = activeButton ? activeButton.textContent : 'All';
      const templatesToShow = allTemplates
        .filter(template => currentCategory === 'All' || template.category === currentCategory)
        .slice(displayedCount, displayedCount + templatesPerLoad);

      templatesToShow.forEach(template => {
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

      displayedCount += templatesToShow.length;
      updateViewMoreButton();
    }

    function updateViewMoreButton() {
      let viewMoreButton = document.getElementById('view-more-button');
      const activeButton = document.querySelector('.category-buttons button.active');
      const currentCategory = activeButton ? activeButton.textContent : 'All';
      const remainingTemplates = allTemplates
        .filter(template => currentCategory === 'All' || template.category === currentCategory)
        .length - displayedCount;

      if (!viewMoreButton) {
        viewMoreButton = document.createElement('button');
        viewMoreButton.id = 'view-more-button';
        viewMoreButton.className = 'view-more';
        viewMoreButton.textContent = 'View More';
        viewMoreButton.addEventListener('click', () => {
          loadMoreTemplates();
          showCategory(currentCategory); // Reapply category filter
        });
        templateContainer.insertAdjacentElement('afterend', viewMoreButton);
      }

      viewMoreButton.style.display = remainingTemplates > 0 ? 'block' : 'none';
    }

    // Initial load
    fetchTemplates();

    // Category buttons
    const categoryButtons = document.querySelectorAll('.category-buttons button, #more-categories button');
    categoryButtons.forEach(button => {
      button.addEventListener('click', () => {
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        if (button.id !== 'more-button') {
          templateContainer.innerHTML = '';
          displayedCount = 0;
          loadMoreTemplates();
        }
      });
    });

    // Show category
    window.showCategory = function(category) {
      const cards = document.querySelectorAll('.template-card');
      cards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        card.style.display = (category === 'All' || cardCategory === category) ? 'block' : 'none';
      });
      updateViewMoreButton();
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
      updateViewMoreButton();
    };
  }
});
