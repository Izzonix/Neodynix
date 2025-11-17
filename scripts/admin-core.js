import { supabase } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('login-section');
  const adminContainer = document.getElementById('admin-container');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');
  const confirmModal = document.getElementById('confirmModal');
  const confirmMessage = document.getElementById('confirmMessage');
  const confirmYes = document.getElementById('confirmYes');
  const confirmNo = document.getElementById('confirmNo');
  const loadingPopup = document.getElementById('loading-popup');
  const result = document.getElementById('result');

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      loginSection.style.display = 'none';
      adminContainer.style.display = 'block';
      // Initial fetches will be called from features
    } else {
      loginSection.style.display = 'block';
      adminContainer.style.display = 'none';
    }
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.email.value;
    const password = loginForm.password.value;
    loadingPopup.style.display = 'flex';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    loadingPopup.style.display = 'none';
    if (error) {
      loginError.style.display = 'block';
      loginError.textContent = error.message;
    } else {
      loginSection.style.display = 'none';
      adminContainer.style.display = 'block';
      // Features will handle initial fetches
    }
  });

  logoutBtn.addEventListener('click', async () => {
    loadingPopup.style.display = 'flex';
    await supabase.auth.signOut();
    loadingPopup.style.display = 'none';
    loginSection.style.display = 'block';
    adminContainer.style.display = 'none';
  });

  window.logout = async () => {
    loadingPopup.style.display = 'flex';
    await supabase.auth.signOut();
    loadingPopup.style.display = 'none';
    loginSection.style.display = 'block';
    adminContainer.style.display = 'none';
  };

  function showConfirm(message, callback) {
    confirmMessage.textContent = message;
    confirmModal.style.display = 'flex';
    confirmYes.onclick = () => {
      callback();
      confirmModal.style.display = 'none';
    };
    confirmNo.onclick = () => {
      confirmModal.style.display = 'none';
    };
  }

  window.showResult = (message, isSuccess) => {  // Made global for features
    result.className = `result ${isSuccess ? 'success' : 'error'}`;
    result.textContent = message;
    setTimeout(() => {
      result.textContent = '';
      result.className = 'result';
    }, 5000);
  };

  window.showSection = (section) => {
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    const sectionMap = {
      templates: { id: 'sectionTemplates', btn: 'btnTemplates', fetch: window.fetchTemplates },
      knowledge: { id: 'sectionKnowledge', btn: 'btnKnowledge', fetch: window.fetchKnowledge },
      email: { id: 'sectionSendEmail', btn: 'btnSendEmail' },
      chat: { id: 'sectionChat', btn: 'btnChat', fetch: window.fetchChatRequests },
      custom: { id: 'sectionCustomRequests', btn: 'btnCustomRequests', fetch: window.fetchCustomRequests }
    };
    const target = sectionMap[section];
    if (target) {
      document.getElementById(target.id).classList.add('active');
      document.getElementById(target.btn).classList.add('active');
      if (target.fetch) target.fetch();
    }
  };

  // Expose globals for features
  window.showConfirm = showConfirm;
  window.loadingPopup = loadingPopup;

  // Tab listeners (core handles switching)
  document.getElementById('btnTemplates')?.addEventListener('click', () => showSection('templates'));
  document.getElementById('btnKnowledge')?.addEventListener('click', () => showSection('knowledge'));
  document.getElementById('btnSendEmail')?.addEventListener('click', () => showSection('email'));
  document.getElementById('btnChat')?.addEventListener('click', () => showSection('chat'));
  document.getElementById('btnCustomRequests')?.addEventListener('click', () => showSection('custom'));

  checkAuth();
});
// Hide/show header & footer based on login state
function updateLoginVisibility() {
  const loginVisible = loginSection.style.display !== 'none';
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  
  if (loginVisible) {
    if (header) header.style.display = 'none';
    if (footer) footer.style.display = 'none';
  } else {
    if (header) header.style.display = 'block';
    if (footer) footer.style.display = 'block';
  }
}

// Call on load and after auth changes
checkAuth();
updateLoginVisibility();

// Update after login success
loginForm.addEventListener('submit', async (e) => {
  // ... existing code ...
  if (!error) {
    // ... existing ...
    updateLoginVisibility(); // Add this
  }
});

// Update after logout
logoutBtn.addEventListener('click', async () => {
  // ... existing ...
  updateLoginVisibility(); // Add this
});

window.logout = async () => {
  // ... existing ...
  updateLoginVisibility(); // Add this
};
