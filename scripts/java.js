// Hamburger menu
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');  
  const navMenu = document.getElementById('nav-menu');  
  if (hamburger && navMenu) {  
    hamburger.addEventListener('click', () => {  
      navMenu.classList.toggle('show');  
    });  
  }
});
// Filter template cards based on category
function showCategory(category) {
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
function filterTemplates() {
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
