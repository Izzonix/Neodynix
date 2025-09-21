import { supabase } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  const teaserContainer = document.getElementById('teaser-container');
  
  async function fetchTeaserTemplates() {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .limit(2);
      
      if (error) throw error;

      teaserContainer.innerHTML = '';

      if (!data || data.length === 0) {
        teaserContainer.innerHTML = `<p class="no-templates">No templates available yet. Please check back soon!</p>`;
        return;
      }

      data.forEach(template => {
        const teaser = document.createElement('article');
        teaser.className = 'teaser';
        teaser.setAttribute('aria-label', `${template.name} Template Preview`);
        teaser.innerHTML = `
          <img src="${template.image}" alt="${template.name} Website Template" />
          <h3>${template.name}</h3>
          <p>${template.description || 'Explore this template for your website needs.'}</p>
          <a href="templates.html?category=${encodeURIComponent(template.category)}&template=${encodeURIComponent(template.name)}" class="btn" aria-label="View ${template.name} Template">View Template</a>
        `;
        teaserContainer.appendChild(teaser);
      });
    } catch (error) {
      console.error('Error fetching teaser templates:', error);
      teaserContainer.innerHTML = `<p class="error">Failed to load templates. Please try again later.</p>`;
    }
  }

  fetchTeaserTemplates();
});