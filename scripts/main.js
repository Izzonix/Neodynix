document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('nav-menu');
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.innerHTML = '✕';
  closeBtn.setAttribute('aria-label', 'Close navigation menu');
  navMenu.appendChild(closeBtn);

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      navMenu.classList.add('show');
      hamburger.style.display = 'none';
    });

    closeBtn.addEventListener('click', () => {
      navMenu.classList.remove('show');
      hamburger.style.display = 'block';
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
    } else {
      header.style.transform = 'translateY(0)';
      header.style.opacity = '1';
    }
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  });

  // Update footer year
  const footerYear = document.querySelector('footer p');
  if (footerYear) {
    footerYear.textContent = `© ${new Date().getFullYear()} Neodynix Technologies. All rights reserved.`;
  }
});
