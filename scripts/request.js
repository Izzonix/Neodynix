document.getElementById('website-request-form').addEventListener('submit', async function(event) {
  event.preventDefault();

  const formData = new FormData(this);
  const data = {
    name: formData.get('name'),
    email: formData.get('email'),
    category: formData.get('category'),
    template: formData.get('template'),
    details: formData.get('details'),
    followup_link: `https://your-username.github.io/your-repo/additional-details.html` // Replace with your GitHub Pages URL
  };

  try {
    const response = await fetch('https://neodynix-backend.your-username.replit.app/submit-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    if (response.ok) {
      alert('Request submitted successfully! Check your email for further instructions.');
      this.reset();
    } else {
      alert('Error submitting request: ' + result.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred while submitting the request.');
  }
});
