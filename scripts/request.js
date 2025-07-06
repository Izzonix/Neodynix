// Initialize Google Apps Script handler after DOM is read
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxbXBMOn33tm0P/exec";

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("website-request-form");

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    // Gather form data
    const formData = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      category: form.category.value.trim(),
      template: form.template.value.trim(),
      details: form.details.value.trim(),
      followup_link: `https://izzonix.github.io/neodynix/followup.html?email=${encodeURIComponent(form.email.value.trim())}`
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
        document.querySelector(".request-section").innerHTML = `
          <h2>Request Sent!</h2>
          <p>We've emailed you a follow-up link. Please check your inbox.</p>
        `;
      })
      .catch(error => {
        console.error("FAILED...", error);
        alert("Something went wrong. Please try again later.");
      });
  });
});
