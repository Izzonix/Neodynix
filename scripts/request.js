document.addEventListener('DOMContentLoaded', () => {
  // Autofill category and template from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const categoryInput = document.getElementById('category');
  const templateInput = document.getElementById('template');

  if (categoryInput) categoryInput.value = urlParams.get('category') || '';
  if (templateInput) templateInput.value = urlParams.get('template') || '';

  emailjs.init('CQLyFEifsrwv5oLQz'); // Replace with your EmailJS public key

  const form = document.getElementById('website-request-form');
  const loadingPopup = document.getElementById('loading-popup');
  const submitBtn = document.getElementById('submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    loadingPopup.style.display = 'flex';
    submitBtn.disabled = true;

    const formData = new FormData(form);

    try {
      await emailjs.send('service_1k3ysnw', 'template_tj0u6yu', {
        name: formData.get('name'),
        email: formData.get('email'),
        category: formData.get('category'),
        template: formData.get('template'),
        followup_link: 'https://izzonix.github.io/Neodynix/followup.html',
      });

      alert('✅ Request submitted successfully! Check your email.');
      form.reset();
      if (categoryInput) categoryInput.value = urlParams.get('category') || '';
      if (templateInput) templateInput.value = urlParams.get('template') || '';
      loadingPopup.style.display = 'none';
      submitBtn.disabled = false;
    } catch (err) {
      console.error('Submission Error:', err.message, err.stack);
      alert(`❌ Submission failed: ${err.message || 'Failed to send email'}`);
      loadingPopup.style.display = 'none';
      submitBtn.disabled = false;
    }
  });
});
