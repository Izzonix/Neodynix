document.addEventListener('DOMContentLoaded', () => {
  const detailsTextarea = document.getElementById('details');
  const form = document.getElementById('website-request-form');
  const loadingPopup = document.getElementById('loading-popup');
  const submitBtn = document.getElementById('submit-btn');

  if (detailsTextarea) detailsTextarea.value = 'Hello Neodynix, customize the above template';

  // Initialize EmailJS
  emailjs.init('CQLyFEifsrwv5oLQz'); // Replace with your EmailJS public key

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    loadingPopup.style.display = 'flex';
    submitBtn.disabled = true;

    // Get reCAPTCHA token
    const token = grecaptcha.getResponse();
    console.log('reCAPTCHA Token:', token, 'Length:', token.length);

    if (!token) {
      alert('⚠️ Please complete the CAPTCHA before submitting.');
      loadingPopup.style.display = 'none';
      submitBtn.disabled = false;
      return;
    }

    const formData = new FormData(form);

    try {
      // Verify CAPTCHA with Supabase Edge Function
      const verifyRes = await fetch(
        'https://spnxywyrjbwbwntblcjl.supabase.co/functions/v1/verify-captcha',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        }
      );

      const verifyData = await verifyRes.json();
      console.log('Supabase Response:', verifyData);

      if (!verifyData.success) {
        const errorDetails = verifyData.details ? verifyData.details.join(', ') : verifyData.error || 'Unknown error';
        alert(`❌ CAPTCHA verification failed: ${errorDetails}`);
        grecaptcha.reset();
        loadingPopup.style.display = 'none';
        submitBtn.disabled = false;
        return;
      }

      // Send email via EmailJS
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
      if (detailsTextarea) detailsTextarea.value = 'Hello Neodynix, customize the above template';
      grecaptcha.reset();
    } catch (err) {
      console.error('Error submitting request:', err);
      alert('❌ An error occurred while submitting the request. Check console for details.');
      grecaptcha.reset();
    } finally {
      loadingPopup.style.display = 'none';
      submitBtn.disabled = false;
    }
  });
});
