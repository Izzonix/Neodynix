import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { supabaseUrl, supabaseAnonKey } from './supabase-config.js';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fetchTransactionStatus(trackingId, merchantRef) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('transaction_id, merchant_reference, status, created_at')
      .eq('transaction_id', trackingId)
      .eq('merchant_reference', merchantRef)
      .single();

    if (error) throw error;

    if (data) {
      displayTransaction(data);
      document.getElementById('status-message').textContent = `Payment ${data.status}!`;
    } else {
      document.getElementById('status-message').textContent = 'Transaction not found.';
    }
  } catch (error) {
    console.error('Error fetching transaction:', error);
    document.getElementById('status-message').textContent = 'Error retrieving transaction status.';
  }
}

function displayTransaction(transaction) {
  const tbody = document.getElementById('transaction-body');
  tbody.innerHTML = '';
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${transaction.transaction_id}</td>
    <td>${transaction.merchant_reference}</td>
    <td>${transaction.status}</td>
    <td>${new Date(transaction.created_at).toLocaleString()}</td>
  `;
  tbody.appendChild(row);
}

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const trackingId = urlParams.get('pesapal_transaction_tracking_id');
  const merchantRef = urlParams.get('pesapal_merchant_reference');

  if (trackingId && merchantRef) {
    fetchTransactionStatus(trackingId, merchantRef);
  } else {
    document.getElementById('status-message').textContent = 'Invalid transaction details.';
  }
});
