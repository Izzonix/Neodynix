document.addEventListener("DOMContentLoaded", () => {
  // Initialize EmailJS
  emailjs.init('CQLyFEifsrwv5oLQz'); // Replace with your EmailJS public key

  // Form submission
  document.getElementById("adminForm").addEventListener("submit", e => {
    e.preventDefault();

    const customerEmail = document.getElementById("customerEmail").value;
    const customLink = document.getElementById("customLink").value;
    const price = document.getElementById("price").value;
    const currency = document.getElementById("currency").value;

    if (!customerEmail || !customLink || !price || !currency) {
      alert("All fields are required.");
      return;
    }

    // Send email
    emailjs.send('service_1k3ysnw','template_v60884w', {
      customer_email: customerEmail,
      custom_link: customLink,
      price: price,
      currency: currency
    })
      .then(() => {
        alert("Email sent successfully to " + customerEmail + "!");
        document.getElementById("adminForm").reset();
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while sending: ' + (error.text || error.message));
      });
  });
});

