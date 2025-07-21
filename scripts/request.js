document.addEventListener('DOMContentLoaded', () => {
  // Autofill additional details textarea
  const detailsTextarea = document.getElementById('details');
  if (detailsTextarea) {
    detailsTextarea.value = 'Hello Neodynix, customize the above template';
  }

  // Initialize EmailJS
  emailjs.init('YOUR_PUBLIC_KEY'); // Replace with your EmailJS public key

  // Form submission with EmailJS
  document.getElementById('website-request-form').addEventListener('submit', function(event) {
    event.preventDefault();

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
        alert('Request submitted successfully! Check your email for further instructions.');
        this.reset();
        detailsTextarea.value = 'Hello Neodynix, customize the above template'; // Reset textarea
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while submitting the request.');
      });
  });
});
