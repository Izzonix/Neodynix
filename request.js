// Initialize EmailJS (put your own User/Public Key here)
emailjs.init("YOUR_PUBLIC_KEY_HERE");

document.getElementById("website-request-form").addEventListener("submit", function(event) {
  event.preventDefault();

  // Collect form data
  const name = this.name.value.trim();
  const email = this.email.value.trim();
  const category = this.category.value.trim();
  const template = this.template.value.trim();
  const details = this.details.value.trim();

  // Prepare EmailJS template parameters
  const templateParams = {
    name: name,
    email: email,
    category: category,
    template: template,
    details: details,
    // Link to your follow-up form page, pass email as query param
    followup_link: `https://yourdomain.com/followup.html?email=${encodeURIComponent(email)}`
  };

  // Send email via EmailJS
  emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", templateParams)
    .then(function(response) {
      console.log("SUCCESS!", response.status, response.text);
      // Show thank you message or redirect
      alert("Thank you! An email has been sent to you with the next steps.");
      // Optionally redirect to a thank you page:
      // window.location.href = "thankyou.html";
      // Or clear the form:
      document.getElementById("website-request-form").reset();
    }, function(error) {
      console.error("FAILED...", error);
      alert("Oops! Something went wrong. Please try again.");
    });
});

