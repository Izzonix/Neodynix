document.addEventListener('DOMContentLoaded', () => {
  // Autofill additional details textarea
  const detailsTextarea = document.getElementById('details');
  if (detailsTextarea) {
    detailsTextarea.value = 'Hello Neodynix, customize the above template';
  }

  // Initialize EmailJS
  emailjs.init('CQLyFEifsrwv5oLQz'); // Replace with your EmailJS public key

  // Form submission with EmailJS
  document.getElementById('website-request-form').addEventListener('submit', function(event) {
    event.preventDefault();

    // Show loading popup and disable submit button
    const loadingPopup = document.getElementById('loading-popup');
    const submitBtn = document.getElementById('submit-btn');
    loadingPopup.style.display = 'flex';
    submitBtn.disabled = true;

    const formData = new FormData(this);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      category: formData.get('category'),
      template: formData.get('template'),
      details: formData.get('details') || 'Hello Neodynix, customize the above template',
      followup_link: 'https://izzonix.github.io/Neodynix/additional-details.html'
    };

    emailjs.send('service_1k3ysnw', 'template_tj0u6yu', data)
      .then(() => {
        loadingPopup.style.display = 'none';
        submitBtn.disabled = false;
        alert('Request submitted successfully! Check your email for further instructions.');
        this.reset();
        if (detailsTextarea) {
          detailsTextarea.value = 'Hello Neodynix, customize the above template'; // Reset textarea
        }
      })
      .catch(error => {
        console.error('Error:', error);
        loadingPopup.style.display = 'none';
        submitBtn.disabled = false;
        alert('An error occurred while submitting the request.');
      });
  });
});
