document.getElementById("contactForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const name = this.name.value.trim();
  const email = this.email.value.trim();
  const message = this.message.value.trim();

  if (!name || !email || !message) {
    alert("Please fill in all fields.");
    return;
  }

  console.log("Message sent:", { name, email, message });

  // subtle delay before resetting
  setTimeout(() => {
    alert("Thanks for reaching out! We’ll get back to you soon.");
    this.reset();
  }, 200);
});

