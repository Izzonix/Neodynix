import { supabase } from "./scripts/supabaseClient.js";

const form = document.getElementById("payment-form");
const status = document.getElementById("status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);

  status.textContent = "Creating Pesapal order...";

  const { data, error } = await supabase.functions.invoke('createOrder', {
    body: { name, email, amount }
  });

  if (error) {
    status.textContent = "Error: " + error.message;
    console.error(error);
  } else {
    status.textContent = "Redirecting to Pesapal...";
    window.location.href = data.redirect_url;
  }
});
