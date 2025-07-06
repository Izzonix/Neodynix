// Initialize Google Apps Script handler after DOM is ready
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxbXBMOn33tm0P/exec";

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("website-request-form");

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    // Disable submit button and show loading state
    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    // Gather form data
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const formData = {
      name: name,
      email: email,
      category: form.category.value.trim(),
      template: form.template.value.trim(),
      details: form.details.value.trim(),
      followup_link: `https://izzonix.github.io/neodynix/followup.html?email=${encodeURIComponent(email)}`
    };

    // Send POST request to Google Apps Script
    fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    })
      .then(response => {
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        return response.json();
      })
      .then(data => {
        console.log("SUCCESS!", data);

        // Replace form with confirmation message
        document.querySelector(".request-section").innerHTML = `
          <h2>✅ Request Sent!</h2>
          <p>Thanks <strong>${name}</strong>, we've emailed you a follow-up link to <strong>${email}</strong>.</p>
          <p>Please check your inbox and spam folder. We’ll begin customizing your website once we receive your content.</p>
        `;
      })
      .catch(error => {
        console.error("FAILED...", error);
        alert("❌ Something went wrong. Please try again later.");
        submitButton.disabled = false;
        submitButton.textContent = "Submit";
      });
  });
});
