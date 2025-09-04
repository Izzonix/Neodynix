document.addEventListener('DOMContentLoaded', () => {
  const detailsTextarea = document.getElementById('details');
  if (detailsTextarea) {
    detailsTextarea.value = 'Hello Neodynix, customize the above template';
  }

  // ✅ Initialize EmailJS
  emailjs.init('CQLyFEifsrwv5oLQz'); // Replace with your real public key

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
        details: formData.get('details') || 'Hello Neodynix, customize the above template',
        followup_link: 'https://izzonix.github.io/Neodynix/additional-details.html',
      });

      alert('✅ Request submitted successfully! Check your email.');
      form.reset();
      if (detailsTextarea) {
        detailsTextarea.value = 'Hello Neodynix, customize the above template';
      }
    } catch (err) {
      console.error('Error submitting request:', err);
      alert('❌ An error occurred while submitting the request.');
    } finally {
      loadingPopup.style.display = 'none';
      submitBtn.disabled = false;
    }
  });
});
