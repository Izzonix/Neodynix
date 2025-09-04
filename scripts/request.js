document.addEventListener('DOMContentLoaded', () => {
  const detailsTextarea = document.getElementById('details');
  if (detailsTextarea) {
    detailsTextarea.value = 'Hello Neodynix, customize the above template';
  }

  // ✅ Initialize EmailJS
  emailjs.init('CQLyFEifsrwv5oLQz'); // Your EmailJS public key

  document.getElementById('website-request-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const loadingPopup = document.getElementById('loading-popup');
    const submitBtn = document.getElementById('submit-btn');
    loadingPopup.style.display = 'flex';
    submitBtn.disabled = true;

    const formData = new FormData(this);

    // ✅ Get token from reCAPTCHA v2
    const token = grecaptcha.getResponse();

    if (!token) {
      loadingPopup.style.display = 'none';
      submitBtn.disabled = false;
      alert("⚠️ Please complete the CAPTCHA.");
      return;
    }

    // ✅ Verify with Supabase Edge Function
    try {
      const verifyRes = await fetch("https://spnxywyrjbwbwntblcjl.supabase.co/functions/v1/verify-captcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        loadingPopup.style.display = 'none';
        submitBtn.disabled = false;
        alert("❌ CAPTCHA verification failed. Please try again.");
        grecaptcha.reset(); // Reset widget
        return;
      }
    } catch (err) {
      console.error("Verification error:", err);
      loadingPopup.style.display = 'none';
      submitBtn.disabled = false;
      alert("❌ An error occurred during CAPTCHA verification.");
      grecaptcha.reset();
      return;
    }

    // ✅ If passed, continue to EmailJS
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
        alert('✅ Request submitted successfully! Check your email for further instructions.');
        this.reset();
        if (detailsTextarea) {
          detailsTextarea.value = 'Hello Neodynix, customize the above template';
        }
        grecaptcha.reset(); // Reset CAPTCHA after success
      })
      .catch(error => {
        console.error('EmailJS Error:', error);
        loadingPopup.style.display = 'none';
        submitBtn.disabled = false;
        alert('❌ An error occurred while submitting the request.');
        grecaptcha.reset();
      });
  });
});
