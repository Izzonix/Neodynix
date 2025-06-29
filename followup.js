document.addEventListener("DOMContentLoaded", () => {
  const countrySelect = document.getElementById("country");
  const durationSlider = document.getElementById("duration");
  const pagesSlider = document.getElementById("pages");
  const durationValue = document.getElementById("duration-value");
  const pagesValue = document.getElementById("pages-value");
  const priceOutput = document.getElementById("price");
  const currencyOutput = document.getElementById("currency");

  const categorySelect = document.getElementById("category");
  const templateInput = document.getElementById("template");
  const extraPagesContainer = document.getElementById("extraPagesContainer");
  const extraPagesInput = document.getElementById("extraPages");

  const themeChoiceRadios = document.querySelectorAll('input[name="themeChoice"]');
  const colorPickerContainer = document.getElementById("colorPickerContainer");

  const templatesByCategory = {
    school: ["basic_school", "modern_school", "academy"],
    business: ["corporate", "startup", "consulting"],
    portfolio: ["photographer", "designer", "developer"]
  };

  const currencyMap = {
    "UG": { symbol: "UGX", rate: 20 },
    "KE": { symbol: "KSH", rate: 30 },
    "TZ": { symbol: "TSh", rate: 25 },
    "NG": { symbol: "NGN", rate: 35 },
    "IN": { symbol: "₹", rate: 40 },
    "US": { symbol: "USD", rate: 60 },
    "GB": { symbol: "£", rate: 55 },
    "OTHER": { symbol: "USD", rate: 50 }
  };

  // Show/hide category-specific fields
  function updateCategoryFields() {
    const category = categorySelect.value;
    document.querySelectorAll(".category-fields").forEach(div => div.style.display = "none");
    if (category) {
      document.querySelectorAll(`.${category}-fields`).forEach(div => div.style.display = "block");
    }
  }

  // Validate template name with category
  function isValidTemplate(category, template) {
    if (!category || !template) return false;
    return templatesByCategory[category]?.includes(template.toLowerCase().replace(/\s+/g, '_'));
  }

  // Show or hide extraPages textarea based on number of pages
  function checkExtraPages() {
    if (parseInt(pagesSlider.value) > 5) {
      extraPagesContainer.style.display = "block";
      extraPagesInput.required = true;
    } else {
      extraPagesContainer.style.display = "none";
      extraPagesInput.required = false;
      extraPagesInput.value = "";
    }
  }

  // Calculate price based on inputs
  function calculatePrice() {
    const country = countrySelect.value || "OTHER";
    const base = currencyMap[country] ? currencyMap[country].rate : currencyMap["OTHER"].rate;
    const symbol = currencyMap[country] ? currencyMap[country].symbol : currencyMap["OTHER"].symbol;

    const duration = parseInt(durationSlider.value);
    const pages = parseInt(pagesSlider.value);

    let surcharge = 0;

    if (isValidTemplate(categorySelect.value, templateInput.value)) {
      const template = templateInput.value.toLowerCase().replace(/\s+/g, '_');
      if (["modern_school", "corporate", "designer"].includes(template)) {
        surcharge = 30;
      } else if (["academy", "consulting", "developer"].includes(template)) {
        surcharge = 40;
      } else {
        surcharge = 20;
      }
    }

    const price = base + duration * 1.5 + pages * 5 + surcharge;
    priceOutput.textContent = Math.round(price);
    currencyOutput.textContent = symbol;
  }

  // Display selected filenames for file inputs
  function setupFileInput(inputId, nameId) {
    const input = document.getElementById(inputId);
    const nameSpan = document.getElementById(nameId);
    input.addEventListener("change", () => {
      const files = input.files;
      if (files.length === 0) {
        nameSpan.textContent = "No file chosen";
      } else if (files.length === 1) {
        nameSpan.textContent = files[0].name;
      } else {
        nameSpan.textContent = `${files.length} files selected`;
      }
    });
  }

  setupFileInput("logo", "logo-name");
  setupFileInput("media", "media-name");
  setupFileInput("others", "others-name");

  // Theme color picker toggle
  themeChoiceRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      if (radio.value === "custom" && radio.checked) {
        colorPickerContainer.style.display = "block";
      } else {
        colorPickerContainer.style.display = "none";
      }
    });
  });

  // Initialize on page load
  updateCategoryFields();
  calculatePrice();
  checkExtraPages();

  // Event listeners
  categorySelect.addEventListener("change", () => {
    updateCategoryFields();
    calculatePrice();
  });

  templateInput.addEventListener("input", calculatePrice);
  countrySelect.addEventListener("change", calculatePrice);

  durationSlider.addEventListener("input", () => {
    durationValue.textContent = durationSlider.value;
    calculatePrice();
  });

  pagesSlider.addEventListener("input", () => {
    pagesValue.textContent = pagesSlider.value;
    checkExtraPages();
    calculatePrice();
  });

  // Form submission
  document.getElementById("customForm").addEventListener("submit", e => {
    e.preventDefault();

    const category = categorySelect.value;
    const template = templateInput.value.trim();

    if (!isValidTemplate(category, template)) {
      alert("Please enter a valid template name for the selected category.");
      templateInput.focus();
      return;
    }

    // Prepare form data for email sending
    const formData = new FormData(e.target);

    // If extraPages is hidden or empty, remove it to keep email clean
    if (extraPagesContainer.style.display === "none" || !formData.get("extraPages").trim()) {
      formData.delete("extraPages");
    }

    // Add theme color info
    const selectedTheme = document.querySelector('input[name="themeChoice"]:checked').value;
    if (selectedTheme === "default") {
      formData.set("themeColor", "#4fc3f7"); // default color hex
    } else {
      formData.set("themeColor", formData.get("customColor") || "#4fc3f7");
    }

    // Convert formData to object for logging or sending
    const dataToSend = {};
    formData.forEach((value, key) => {
      if (value instanceof File) {
        dataToSend[key] = value.name;
      } else {
        dataToSend[key] = value;
      }
    });

    console.log("Data to send:", dataToSend);

    alert("Form submitted! Check console for data package.");

    // Uncomment to reset form on submit:
    // e.target.reset();
  });
});