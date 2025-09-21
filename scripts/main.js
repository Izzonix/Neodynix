document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const closeBtn = document.getElementById('close-btn');
  const navMenu = document.getElementById('nav-menu');
  
  if (hamburger && navMenu && closeBtn) {
    hamburger.addEventListener('click', () => {
      navMenu.classList.add('show');
      hamburger.style.display = 'none';
      closeBtn.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => {
      navMenu.classList.remove('show');
      hamburger.style.display = 'block';
      closeBtn.style.display = 'none';
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
      hamburger.style.display = 'block';
      closeBtn.style.display = 'none';
    } else {
      header.style.transform = 'translateY(0)';
      header.style.opacity = '1';
    }
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  });
});
