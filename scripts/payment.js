import { supabaseUrl } from './supabase-config.js';

const PESAPAL_FUNCTION_URL = 'https://spnxywyrjbwbwntblcjl.supabase.co/functions/v1/pesapal-init';

async function submitOrder(formData) {
  try {
    const response = await fetch(PESAPAL_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const result = await response.json();
    if (response.ok && result.checkoutUrl) {
      showSuccess('Redirecting...');
      setTimeout(() => {
        window.location.href = result.checkoutUrl;
      }, 1000);
    } else {
      showError(`Error: ${result.error || 'Failed'}`);
    }
  } catch (error) {
    showError('Network error');
    console.error('Submit error:', error);
  }
}

document.getElementById('payment-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = {
    first_name: document.getElementById('first_name').value.trim(),
    last_name: document.getElementById('last_name').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    country: document.getElementById('country').value,
    amount: document.getElementById('amount').value,
    currency: document.getElementById('currency').value,
  };

  if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone || !formData.country || !formData.amount || !formData.currency) {
    showError('Fill all fields');
    return;
  }
  if (!emailIsValid(formData.email)) {
    showError('Invalid email');
    return;
  }
  if (!phoneIsValid(formData.phone)) {
    showError('Invalid phone number');
    return;
  }
  if (parseFloat(formData.amount) <= 0 || isNaN(formData.amount)) {
    showError('Invalid amount');
    return;
  }

  await submitOrder(formData);
});

function emailIsValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function phoneIsValid(phone) {
  return /^\+?\d{9,15}$/.test(phone);
}

function showSuccess(msg) {
  const successMsg = document.getElementById('success-msg');
  const errorMsg = document.getElementById('error-msg');
  errorMsg.style.display = 'none';
  successMsg.textContent = msg;
  successMsg.style.display = 'block';
}

function showError(msg) {
  const successMsg = document.getElementById('success-msg');
  const errorMsg = document.getElementById('error-msg');
  successMsg.style.display = 'none';
  errorMsg.textContent = msg;
  errorMsg.style.display = 'block';
      }
