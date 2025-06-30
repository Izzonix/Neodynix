// Initialize EmailJS after DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  emailjs.init("CQLyFEifsrwv5oLQz");

  const form = document.getElementById("website-request-form");

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    // Get user input
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const category = form.category.value.trim();
    const template = form.template.value.trim();
    const details = form.details.value.trim();

    // Prepare email parameters
    const templateParams = {
      name: name,
      email: email,
      category: category,
      template: template,
      details: details,
      followup_link: `https://izzonix.github.io/neodynix/followup.html?email=${encodeURIComponent(email)}`
    };

    // Send email using EmailJS
    emailjs.send("service_1k3ysnw", "template_tj0u6yu", templateParams)
      .then(function (response) {
        console.log("SUCCESS!", response.status, response.text);
        document.querySelector(".request-section").innerHTML = `
          <h2>Request Sent!</h2>
          <p>We've emailed you a follow-up link. Please check your inbox.</p>
        `;
      }, function (error) {
        console.error("FAILED...", error);
        alert("Something went wrong. Please try again.");
      });
  });
});
