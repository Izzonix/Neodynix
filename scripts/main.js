document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('nav-menu');
  const closeBtn = document.createElement('button');
  closeBtn.classList.add('close-btn');
  closeBtn.innerHTML = '✕';
  closeBtn.setAttribute('aria-label', 'Close navigation menu');
  navMenu.prepend(closeBtn);

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      navMenu.classList.toggle('show');
    });

    closeBtn.addEventListener('click', () => {
      navMenu.classList.remove('show');
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
});
