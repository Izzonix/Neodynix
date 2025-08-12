document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('nav-menu');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      navMenu.classList.toggle('show');
    });
  }

  // Scroll-based header hide/show
  let lastScrollTop = 0;
  const header = document.querySelector('.top-header');
  window.addEventListener('scroll', () => {
    let currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    if (currentScroll > lastScrollTop) {
      header.style.transform = 'translateY(-100%)';
      header.style.opacity = '0';
      navMenu.classList.remove('show');
    } else {
      header.style.transform = 'translateY(0)';
      header.style.opacity = '1';
    }
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  });

  // Set active category button
  const categoryButtons = document.querySelectorAll('.category-buttons button');
  categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
      categoryButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      showCategory(button.textContent);
    });
  });

  // Load dynamic templates from Replit backend
  const templateContainer = document.getElementById('template-container');
  const refreshTemplates = document.getElementById('refreshTemplates');
  if (templateContainer && refreshTemplates) {
    function loadTemplates() {
      templateContainer.innerHTML = ''; // Clear existing content
      fetch('https://a68abc6c-3dfa-437e-b7ed-948853cc9716-00-2psgdbnpe98f6.worf.replit.dev/api/templates')
        .then(response => response.json())
        .then(templates => {
          templates.forEach(template => {
            const card = document.createElement('div');
            card.className = 'template-card';
            card.dataset.category = template.category;
            card.innerHTML = `
              <a href="${template.link}" target="_blank">
                <img src="${template.image}" alt="${template.name} Template" />
              </a>
              <h3>${template.name}</h3>
              <p>A new design for your needs.</p>
              <a href="request.html?category=${template.category}&template=${encodeURIComponent(template.name)}" class="btn">Choose Template</a>
            `;
            templateContainer.appendChild(card);
          });
        })
        .catch(error => console.error('Error fetching templates:', error));
    }

    // Initial load
    loadTemplates();

    // Refresh button
    refreshTemplates.addEventListener('click', loadTemplates);
  }

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
  }

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
  }

  // Auto-fill request form
  if (window.location.pathname.includes('request.html')) {
    const getParam = key => new URLSearchParams(window.location.search).get(key);
    const category = getParam('category');
    const template = getParam('template');

    if (category && document.getElementById('category')) {
      document.getElementById('category').value = category;
    }
    if (template && document.getElementById('template')) {
      document.getElementById('template').value = template;
    }
  }
});
