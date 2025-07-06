const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxbXBM5ZorkBLXVW2-1RKqqA80IlLp_mxd69RzYW8T8i92UipFKPQ-WL852On33tm0P/exec";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("website-request-form");

  if (!form) {
    console.error("Form not found! Check the HTML form id.");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    const name = form.name.value.trim();
    const email = form.email.value.trim();

    const payload = {
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
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Network response was not ok: ${res.statusText}`);
      }

      const data = await res.json().catch(() => {
        throw new Error("Unable to parse JSON response from server");
      });

      console.log("SUCCESS!", data);
      document.querySelector(".request-section").innerHTML = `
        <h2>✅ Request Sent!</h2>
        <p>Thanks <strong>${name}</strong>, we've emailed you a follow‑up link to <strong>${email}</strong>.</p>
        <p>Please check your inbox and spam folder. We'll begin customizing your website once we receive your content.</p>
      `;
    } catch (error) {
      console.error("FAILED...", error);
      alert("❌ Something went wrong. Please try again later.");
      submitButton.disabled = false;
      submitButton.textContent = "Submit";
    }
  });
});
