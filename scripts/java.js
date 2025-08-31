import { supabase } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  const templateContainer = document.getElementById('template-container');
  if (templateContainer) {
    async function fetchTemplates() {
      try {
        const { data, error } = await supabase.from('templates').select('*');
        if (error) throw error;

        templateContainer.innerHTML = '';
        data.forEach(template => {
          const card = document.createElement('div');
          card.className = 'template-card';
          card.setAttribute('data-category', template.category);
          card.innerHTML = `
            <a href="${template.link}"><img src="${template.image}" alt="${template.name} Template" /></a>
            <h3>${template.name}</h3>
            <p>${template.description}</p>
            <a href="request.html?category=${encodeURIComponent(template.category)}&template=${encodeURIComponent(template.name)}" class="btn">Choose Template</a>
          `;
          templateContainer.appendChild(card);
        });
        const activeButton = document.querySelector('.category-buttons button.active');
        if (activeButton) showCategory(activeButton.textContent);
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    }

    // Initial load
    fetchTemplates();

    // Set active category button
    const categoryButtons = document.querySelectorAll('.category-buttons button');
    categoryButtons.forEach(button => {
      button.addEventListener('click', () => {
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        showCategory(button.textContent);
      });
    });

    // Filter template cards based on category
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

    // Search templates by name
    window.filterTemplates = function() {
      const searchInput = document.getElementById('search-input').value.toLowerCase();
      const templateCards = document.querySelectorAll('.template-card');
      templateCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        if (title.includes(searchInput)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    };

    // Auto-fill request form
    if (window.location.pathname.includes('request.html')) {
      const getParam = key => new URLSearchParams(window.location.search).get(key);
      const category = getParam('category');
      const template = getParam('template');
      if (category && document.getElementById('category')) document.getElementById('category').value = category;
      if (template && document.getElementById('template')) document.getElementById('template').value = template;
    }
  }
});
