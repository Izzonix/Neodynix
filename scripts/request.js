document.addEventListener("DOMContentLoaded", function () {
  const emailInput = document.getElementById("email");
  const followupInput = document.getElementById("followup-link");

  if (emailInput && followupInput) {
    emailInput.addEventListener("input", function () {
      const email = emailInput.value.trim();
      followupInput.value = `https://izzonix.github.io/neodynix/followup.html?email=${encodeURIComponent(email)}`;
    });
  } else {
    console.error("Email input or hidden followup field missing.");
  }
});
