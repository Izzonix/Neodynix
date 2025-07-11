const SCRIPT_URL = "https://your-backend-url.onrender.com/send-email";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("website-request-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    const name = form.name.value.trim();
    const email = form.email.value.trim();

    const formData = {
      name,
      email,
      category: form.category.value.trim(),
      template: form.template.value.trim(),
      details: form.details.value.trim(),
      followup_link: `https://izzonix.github.io/neodynix/followup.html?email=${encodeURIComponent(email)}`
    };

    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        document.querySelector(".request-section").innerHTML = `
          <h2>✅ Request Sent!</h2>
          <p>Thanks <strong>${name}</strong>, we’ve emailed you a follow-up link at <strong>${email}</strong>.</p>
          <p>Please check your inbox and spam folder.</p>
        `;
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err) {
      alert("❌ Something went wrong. Try again.");
      console.error("Error:", err);
      submitButton.disabled = false;
      submitButton.textContent = "Submit";
    }
  });
});
        
