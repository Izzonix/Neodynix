document.addEventListener('DOMContentLoaded', () => {
  const detailsTextarea = document.getElementById('details');
  if (detailsTextarea) {
    detailsTextarea.value = 'Hello Neodynix, customize the above template';
  }

  const form = document.getElementById('website-request-form');
  form.addEventListener('submit', async function(event) {
    event.preventDefault();

    // ✅ Check CAPTCHA first
    const captchaResponse = grecaptcha.getResponse();
    if (!captchaResponse) {
      alert('Please complete the CAPTCHA verification.');
      return;
    }

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
      followup_link: 'https://izzonix.github.io/Neodynix/additional-details.html',
      token: captchaResponse
    };

    try {
      const response = await fetch('https://YOUR_PROJECT.supabase.co/functions/v1/verify-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        alert('Request submitted successfully! Check your email for further instructions.');
        this.reset();
        grecaptcha.reset();
        if (detailsTextarea) {
          detailsTextarea.value = 'Hello Neodynix, customize the above template';
        }
      } else {
        alert('CAPTCHA verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while submitting the request.');
    } finally {
      loadingPopup.style.display = 'none';
      submitBtn.disabled = false;
    }
  });
});
