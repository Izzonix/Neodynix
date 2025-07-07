// Initialize Backendless
Backendless.initApp("YOUR-APP-ID", "YOUR-API-KEY");

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("website-request-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    // Get form values
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const category = form.category.value.trim();
    const template = form.template.value.trim();
    const details = form.details.value.trim();

    const followup_link = `https://izzonix.github.io/neodynix/followup.html?email=${encodeURIComponent(email)}`;

    const record = {
      name,
      email,
      category,
      template,
      details,
      followup_link,
      submittedAt: new Date()
    };

    try {
      // Save to Backendless Database
      await Backendless.Data.of("website_request").save(record);

      // Send email using a pre-defined email template in Backendless
      await Backendless.Messaging.sendEmailFromTemplate(
        "Website Request Received",
        "RequestReceivedTemplate", // Your template name in Backendless
        {
          name,
          email,
          category,
          template,
          details,
          followup_link
        },
        [email]
      );

      // Show success message
      document.querySelector(".request-section").innerHTML = `
        <h2>✅ Request Sent!</h2>
        <p>Thanks <strong>${name}</strong>, we've emailed you a follow-up link at <strong>${email}</strong>.</p>
        <p>Please check your inbox or spam folder. We’ll begin customizing your website once we receive your content.</p>
      `;
    } catch (error) {
      console.error("Backendless error:", error);
      alert("❌ Something went wrong. Please try again.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
    }
  });
});
