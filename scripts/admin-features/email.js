/* --------------------------------------------------------------
   SEND EMAIL (EmailJS)
   -------------------------------------------------------------- */
const form = document.getElementById('emailForm');

form?.addEventListener('submit', async e => {
  e.preventDefault();
  const email = form.customerEmail.value.trim();
  const link  = form.customLink.value.trim();
  const price = +form.price.value||0;
  const cur   = form.currency.value;

  if (!email||!link||!cur) return window.showResult('Fill all fields.', false);

  window.loadingPopup.style.display='flex';
  try {
    await emailjs.send(
      'YOUR_SERVICE_ID',
      'YOUR_TEMPLATE_ID',
      { to_email:email, custom_link:link, price:price.toFixed(2), currency:cur, reply_to:'admin@yourdomain.com' },
      'YOUR_USER_ID'
    );
    form.reset();
    window.showResult('Email sent!', true);
  } catch (er) {
    console.error(er);
    window.showResult('Send failed.', false);
  } finally { window.loadingPopup.style.display='none'; }
});
