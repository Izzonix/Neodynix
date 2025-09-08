import { supabase } from './supabase-config.js';

const form = document.getElementById('payment-form');
const successMsg = document.getElementById('success-msg');
const errorMsg = document.getElementById('error-msg');
const emailInput = document.getElementById('email');
const optionBtns = document.querySelectorAll('.option-btn');
const paymentMethodInput = document.getElementById('payment-method');
const amountInput = document.getElementById('amount');

optionBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    optionBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    paymentMethodInput.value = btn.dataset.method;
  });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  successMsg.style.display = 'none';
  errorMsg.style.display = 'none';

  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const paymentMethod = paymentMethodInput.value;

  if (!paymentMethod) {
    errorMsg.textContent = '❌ Please select a payment method.';
    errorMsg.style.display = 'block';
    return;
  }

  try {
    const { data, error } = await supabase
      .from('custom_requests')
      .select('pages, contact_person, country')
      .eq('email', email)
      .single();

    if (error || !data) {
      errorMsg.textContent = '❌ No request found for this email.';
      errorMsg.style.display = 'block';
      return;
    }

    if (data.contact_person && data.contact_person.toLowerCase() !== name.toLowerCase()) {
      errorMsg.textContent = '❌ Name does not match request.';
      errorMsg.style.display = 'block';
      return;
    }

    const currencyMap = {
      "UG": { symbol: "UGX", rate: 20 },
      "KE": { symbol: "KSH", rate: 30 },
      "TZ": { symbol: "TSh", rate: 25 },
      "NG": { symbol: "NGN", rate: 35 },
      "IN": { symbol: "₹", rate: 40 },
      "US": { symbol: "USD", rate: 60 },
      "GB": { symbol: "£", rate: 55 },
      "OTHER": { symbol: "USD", rate: 50 }
    };

    const country = data.country || "OTHER";
    const { symbol, rate } = currencyMap[country];
    const baseAmount = data.pages * rate;

    const paymentData = {
      amount: baseAmount,
      description: 'Payment for Neodynix website service',
      type: 'MERCHANT',
      reference: `NDX-${Date.now()}`,
      first_name: name.split(' ')[0],
      last_name: name.split(' ').slice(1).join(' ') || '',
      email: email,
      currency: symbol.replace(/[^A-Z]/g, ''),
      payment_method: paymentMethod
    };

    const response = await fetch('https://your-supabase-project.supabase.co/functions/v1/pesapal-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      throw new Error('Payment initiation failed');
    }

    const paymentResult = await response.json();
    if (paymentResult.redirect_url) {
      successMsg.style.display = 'block';
      setTimeout(() => {
        window.location.href = paymentResult.redirect_url; // Redirect to Pesapal's hosted page
      }, 1000);
    } else {
      throw new Error('No redirect URL provided');
    }
  } catch (err) {
    console.error('Error:', err);
    errorMsg.textContent = '❌ Payment failed. Try again.';
    errorMsg.style.display = 'block';
  }
});

emailInput.addEventListener('blur', async () => {
  const email = emailInput.value.trim();
  if (!email) {
    amountInput.value = '';
    amountInput.placeholder = 'Enter email to fetch amount';
    return;
  }

  try {
    const { data, error } = await supabase
      .from('custom_requests')
      .select('pages, country')
      .eq('email', email)
      .single();

    if (error || !data) {
      amountInput.value = '';
      amountInput.placeholder = 'No request found';
      return;
    }

    const currencyMap = {
      "UG": { symbol: "UGX", rate: 20 },
      "KE": { symbol: "KSH", rate: 30 },
      "TZ": { symbol: "TSh", rate: 25 },
      "NG": { symbol: "NGN", rate: 35 },
      "IN": { symbol: "₹", rate: 40 },
      "US": { symbol: "USD", rate: 60 },
      "GB": { symbol: "£", rate: 55 },
      "OTHER": { symbol: "USD", rate: 50 }
    };

    const country = data.country || "OTHER";
    const { symbol, rate } = currencyMap[country];
    amountInput.value = `${symbol} ${data.pages * rate}`;
  } catch (err) {
    console.error('Error:', err);
    amountInput.value = '';
    amountInput.placeholder = 'Error fetching amount';
  }
});
