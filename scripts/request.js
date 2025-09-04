document.addEventListener('DOMContentLoaded', () => {
  const detailsTextarea = document.getElementById('details');
  if (detailsTextarea) detailsTextarea.value = 'Hello Neodynix, customize the above template';

  emailjs.init('CQLyFEifsrwv5oLQz'); // Your EmailJS public key

  const form = document.getElementById('website-request-form');
  const loadingPopup = document.getElementById('loading-popup');
  const submitBtn = document.getElementById('submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    loadingPopup.style.display = 'flex';
    submitBtn.disabled = true;

    const token = grecaptcha.getResponse();
    if (!token) {
      loadingPopup.style.display = 'none';
      submitBtn.disabled = false;
      alert("⚠️ Please complete the CAPTCHA.");
      return;
    }

    const formData = new FormData(form);

    try {
      const verifyRes = await fetch(
        "https://spnxywyrjbwbwntblcjl.supabase.co/functions/v1/verify-captcha",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        }
      );

      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        loadingPopup.style.display = 'none';
        submitBtn.disabled = false;
        alert("❌ CAPTCHA verification failed. Please try again.");
        grecaptcha.reset();
        return;
      }

      // Send EmailJS only after successful CAPTCHA
      await emailjs.send('service_1k3ysnw', 'template_tj0u6yu', {
        name: formData.get('name'),
        email: formData.get('email'),
        category: formData.get('category'),
        template: formData.get('template'),
        details: formData.get('details') || 'Hello Neodynix, customize the above template',
        followup_link: 'https://izzonix.github.io/Neodynix/additional-details.html'
      });

      alert('✅ Request submitted successfully! Check your email.');
      form.reset();
      if (detailsTextarea) detailsTextarea.value = 'Hello Neodynix, customize the above template';
      grecaptcha.reset();
      loadingPopup.style.display = 'none';
      submitBtn.disabled = false;

    } catch (err) {
      console.error("Error submitting request:", err);
      alert("❌ An error occurred while submitting the request.");
      grecaptcha.reset();
      loadingPopup.style.display = 'none';
      submitBtn.disabled = false;
    }
  });
});
