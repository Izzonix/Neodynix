import { supabase } from './supabase-config.js';

async function checkTransactionStatus() {
  const urlParams = new URLSearchParams(window.location.search);
  const trackingId = urlParams.get('pesapal_transaction_tracking_id');
  const merchantRef = urlParams.get('pesapal_merchant_reference');

  if (!trackingId || !merchantRef) {
    document.getElementById('status-message').textContent = 'Error: Missing transaction details';
    return;
  }

  document.getElementById('transaction-id').textContent = trackingId;
  document.getElementById('merchant-reference').textContent = merchantRef;

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('status')
      .eq('tracking_id', trackingId)
      .single();

    if (error || !data) {
      document.getElementById('status-message').textContent = 'Error: Unable to retrieve transaction status';
      document.getElementById('transaction-status').textContent = 'Unknown';
      console.error('Supabase error:', error);
      return;
    }

    document.getElementById('status-message').textContent = 'Transaction status retrieved';
    document.getElementById('transaction-status').textContent = data.status;
  } catch (err) {
    document.getElementById('status-message').textContent = 'Error: Network issue';
    document.getElementById('transaction-status').textContent = 'Unknown';
    console.error('Network error:', err);
  }
}

document.addEventListener('DOMContentLoaded', checkTransactionStatus);
