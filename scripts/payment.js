const PESAPAL_CONSUMER_KEY = 'VSweLeBZVoHnCDWbUdrHaTJRks35lKte; // Replace with sandbox key
const PESAPAL_CONSUMER_SECRET = 'eBHMwJof35KK5NVhANF6vyRHW00='; // Replace with sandbox secret
const PESAPAL_IPN_NOTIFICATION_ID = 'temporary_id'; // Ignored for testing
const PESAPAL_CALLBACK_URL = 'https://yourusername.github.io/your-repo/placeholder'; // Placeholder
const PESAPAL_API_URL = 'https://cybqa.pesapal.com/api/v3/'; // Sandbox

let accessToken = null;

async function getAccessToken() {
  if (accessToken) return accessToken;
  const auth = btoa(`${PESAPAL_CONSUMER_KEY}:${PESAPAL_CONSUMER_SECRET}`);
  try {
    const response = await fetch(`${PESAPAL_API_URL}Auth/GenerateToken`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Token generation failed');
    const data = await response.json();
    accessToken = data.token;
    return accessToken;
  } catch (error) {
    console.error('Auth error:', error);
    throw error;
  }
}

async function submitOrder(formData) {
  const orderData = {
    id: `ORDER_${Date.now()}`,
    currency: formData.currency,
    amount: parseFloat(formData.amount),
    description: 'Payment via Pesapal',
    callback_url: PESAPAL_CALLBACK_URL,
    // notification_id: PESAPAL_IPN_NOTIFICATION_ID, // Ignored for testing
    billing_address: {
      email_address: formData.email,
      first_name: formData.name.split(' ')[0] || 'N/A',
      last_name: formData.name.split(' ').slice(1).join(' ') || 'N/A'
    },
    line_items: [
      {
        name: 'Payment',
        description: 'General Payment',
        quantity: 1,
        price: parseFloat(formData.amount),
        subtotal: parseFloat(formData.amount)
      }
    ]
  };

  try {
    const token = await getAccessToken();
    const response = await fetch(`${PESAPAL_API_URL}Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(orderData)
    });
    const result = await response.json();
    if (response.ok && result.redirect_url) {
      document.getElementById('order-id').value = orderData.id;
      document.getElementById('notification-id').value = PESAPAL_IPN_NOTIFICATION_ID;
      showSuccess('Payment initiated! Redirecting...');
      setTimeout(() => {
        window.location.href = result.redirect_url;
      }, 1000);
    } else {
      showError(`Order submission failed: ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    showError('Network error: Unable to process payment');
    console.error('Submit order error:', error);
  }
}

document.getElementById('payment-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    amount: document.getElementById('amount').value,
    currency: document.getElementById('currency').value,
    method: document.getElementById('payment-method').value
  };

  if (!formData.name || !formData.email || !formData.amount || parseFloat(formData.amount) <= 0) {
    showError('Please fill all fields with valid data');
    return;
  }
  if (!formData.method) {
    showError('Please select a payment method');
    return;
  }
  if (!emailIsValid(formData.email)) {
    showError('Please enter a valid email');
    return;
  }

  await submitOrder(formData);
});

function emailIsValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

document.querySelectorAll('.option-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('payment-method').value = btn.dataset.method;
  });
});

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
