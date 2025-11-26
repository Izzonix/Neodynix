import { supabase } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', () => {
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
  if (templateContainer) {
    let allTemplates = [];
    let displayedCount = 0;
    const templatesPerLoad = 5;
    let currentActiveCategory = 'All';

    async function fetchTemplates() {
      try {
        const { data, error } = await supabase.from('templates').select('*');
        if (error) throw error;

        allTemplates = data || [];

        if (allTemplates.length === 0) {
          templateContainer.innerHTML = `<p class="no-templates">🚀 No templates available yet. Please check back soon!</p>`;
          return;
        }

        // Initial load
        showCategory('All'); 
      } catch (error) {
        console.error('Error fetching templates:', error);
        templateContainer.innerHTML = `<p class="error">⚠️ Failed to load templates. Please try again later.</p>`;
      }
    }

    function getFilteredTemplates() {
      const searchInput = document.getElementById('search-input')?.value.toLowerCase() || '';
      return allTemplates.filter(template => {
        const templateCategory = (template.category || 'Other').trim().toLowerCase();
        const templateName = template.name.toLowerCase();
        const categoryMatch = currentActiveCategory === 'All' || templateCategory === currentActiveCategory.toLowerCase();
        const searchMatch = templateName.includes(searchInput);
        return categoryMatch && searchMatch;
      });
    }


    function loadMoreTemplates() {
      const filteredTemplates = getFilteredTemplates();
      const templatesToShow = filteredTemplates
        .slice(displayedCount, displayedCount + templatesPerLoad);

      templatesToShow.forEach(template => {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.setAttribute('data-category', (template.category || 'Other').trim());
        card.innerHTML = `
          <div class="image-container">
            <a href="${template.link}" target="_blank">
              <img src="${template.image}" alt="${template.name} Template" />
              <div class="preview-overlay">
                <span class="preview-overlay-text">Tap to Preview</span>
              </div>
            </a>
          </div>
          <h3>${template.name}</h3>
          <p>${template.description || ''}</p>
          <a href="request.html?category=${encodeURIComponent(template.category || 'Other')}&template=${encodeURIComponent(template.name)}" class="btn">Choose Template</a>
        `;
        templateContainer.appendChild(card);
      });

      displayedCount += templatesToShow.length;
      updateViewMoreButton();
    }

    function updateViewMoreButton() {
      let viewMoreButton = document.getElementById('view-more-button');
      const filteredTemplates = getFilteredTemplates();
      const remainingTemplates = filteredTemplates.length - displayedCount;

      if (!viewMoreButton) {
        viewMoreButton = document.createElement('button');
        viewMoreButton.id = 'view-more-button';
        viewMoreButton.className = 'view-more';
        viewMoreButton.textContent = 'View More';
        viewMoreButton.addEventListener('click', () => {
          loadMoreTemplates();
        });
        templateContainer.insertAdjacentElement('afterend', viewMoreButton);
      }

      viewMoreButton.style.display = remainingTemplates > 0 ? 'block' : 'none';
    }

    fetchTemplates();

    const categoryButtons = document.querySelectorAll('.category-buttons button:not(#more-button), #more-categories button');
    categoryButtons.forEach(button => {
      // Re-assign click handler to use showCategory from JS
      button.addEventListener('click', () => {
        const category = button.textContent.trim();
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        window.showCategory(category); 
      });
    });

    window.showCategory = function(category) {
      currentActiveCategory = category.trim();
      templateContainer.innerHTML = '';
      displayedCount = 0;

      // Update active state for buttons
      categoryButtons.forEach(btn => {
          if (btn.textContent.trim() === category) {
              btn.classList.add('active');
          } else {
              btn.classList.remove('active');
          }
      });

      loadMoreTemplates();
      
      // If no templates are found after filtering
      if (getFilteredTemplates().length === 0) {
        templateContainer.innerHTML = `<p class="no-templates">No templates found for "${category}".</p>`;
      }
    };

    window.toggleMoreCategories = function() {
      const moreCategories = document.getElementById('more-categories');
      const moreButton = document.getElementById('more-button');
      const isHidden = moreCategories.style.display === 'none' || moreCategories.style.display === '';
      moreCategories.style.display = isHidden ? 'flex' : 'none';
      moreButton.textContent = isHidden ? 'Hide' : 'More';
    };

    window.filterTemplates = function() {
      // Clear container and reload based on new search input
      templateContainer.innerHTML = '';
      displayedCount = 0;
      loadMoreTemplates();

      // Display message if search yields no results
      if (getFilteredTemplates().length === 0) {
        templateContainer.innerHTML = `<p class="no-templates">No templates match your search criteria.</p>`;
      }
    };
  }
});
