document.addEventListener('DOMContentLoaded', () => {
  const paymentMethodInput = document.getElementById('payment-method');
  const optionButtons = document.querySelectorAll('.option-btn');
  const form = document.getElementById('payment-form');
  const successMsg = document.getElementById('success-msg');
  const errorMsg = document.getElementById('error-msg');

  optionButtons.forEach(button => {
    button.addEventListener('click', () => {
      optionButtons.forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');
      paymentMethodInput.value = button.dataset.method;
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const amount = document.getElementById('amount').value;
    const method = paymentMethodInput.value;
    const currency = document.getElementById('currency').value;

    if (!method || !currency) {
      errorMsg.style.display = 'block';
      return;
    }

    FlutterwaveCheckout({
      public_key: 'YOUR_FLUTTERWAVE_PUBLIC_KEY', // Replace with your test public key
      tx_ref: 'tx-' + Date.now(),
      amount: parseFloat(amount),
      currency: currency, // UGX, KSH, TZS, or USD
      payment_options: method, // 'card' or 'mobilemoney'
      redirect_url: window.location.href, // Redirects back to this page
      customer: { email, name },
      customizations: { title: 'Payment Portal', description: `Payment in ${currency}` }
    });
  });

  window.addEventListener('message', (event) => {
    if (event.data.type === 'payment_success') {
      successMsg.style.display = 'block';
      errorMsg.style.display = 'none';
    } else if (event.data.type === 'payment_error') {
      errorMsg.style.display = 'block';
      successMsg.style.display = 'none';
    }
  });
});
