import { supabase, supabaseUrl } from './supabase-config.js';

document.addEventListener("DOMContentLoaded", () => {
  const countrySelect = document.getElementById("country");
  const durationSlider = document.getElementById("duration");
  const pagesSlider = document.getElementById("pages");
  const durationValue = document.getElementById("duration-value");
  const pagesValue = document.getElementById("pages-value");
  const priceOutput = document.getElementById("price");
  const currencyOutput = document.getElementById("currency");
  const mobilePriceOutput = document.getElementById("mobile-price");
  const mobileCurrencyOutput = document.getElementById("mobile-currency");
  const categorySelect = document.getElementById("category");
  const templateInput = document.getElementById("template");
  const extraPagesContainer = document.getElementById("extraPagesContainer");
  const extraPagesInput = document.getElementById("extraPages");
  const themeChoiceRadios = document.querySelectorAll('input[name="themeChoice"]');
  const colorPickerContainer = document.getElementById("colorPickerContainer");
  const domainChoiceRadios = document.querySelectorAll('input[name="domainChoice"]');
  const domainNameContainer = document.getElementById("domainNameContainer");
  const customForm = document.getElementById("customForm");
  const submitBtn = customForm.querySelector(".btn-request");
  const loadingPopup = document.getElementById("loading-popup");
  const mobilePricePopup = document.getElementById("mobile-price-popup");

  const templatesByCategory = {
    business: ["corporate", "startup", "consulting", "small_business"],
    portfolio: ["photographer", "designer", "developer", "artist"],
    education: ["basic_school", "modern_school", "academy", "university"],
    ecommerce: ["online_store", "marketplace", "retail", "shop"],
    charity: ["donation_hub", "community_aid", "charity_impact"],
    blog: ["personal_blog", "tech_blog", "lifestyle_blog"],
    healthcare: ["clinic", "hospital", "wellness", "medical_center"],
    event: ["conference", "wedding", "festival", "meetup"],
    religion: ["community_worship", "faith_hub", "sacred_space"],
    nonprofit: ["nonprofit_impact", "advocacy", "community_service"],
    other: ["custom_project", "event_spotlight", "miscellaneous"]
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
      document.querySelector(`.${category}-fields`).style.display = "block";
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
      if (["modern_school", "corporate", "designer", "community_worship", "online_store", "donation_hub", "tech_blog", "clinic", "conference"].includes(template)) {
        surcharge = 30;
      } else if (["academy", "consulting", "developer", "faith_hub", "marketplace", "community_aid", "lifestyle_blog", "hospital", "wedding"].includes(template)) {
        surcharge = 40;
      } else {
        surcharge = 20;
      }
    }

    const price = base + duration * 1.5 + pages * 5 + surcharge;
    priceOutput.textContent = Math.round(price);
    currencyOutput.textContent = symbol;
    mobilePriceOutput.textContent = Math.round(price);
    mobileCurrencyOutput.textContent = symbol;
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

  // Manage mobile price popup visibility
  function managePricePopup() {
    if (window.innerWidth > 600) {
      mobilePricePopup.style.display = "none";
      return;
    }
    const priceBox = document.querySelector(".price-box");
    const rect = priceBox.getBoundingClientRect();
    const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
    mobilePricePopup.style.display = isVisible ? "none" : "block";
  }

  // Show/hide domain name input
  function updateDomainField() {
    const customDomain = document.querySelector('input[name="domainChoice"][value="custom"]').checked;
    domainNameContainer.style.display = customDomain ? "block" : "none";
    document.getElementById("domainName").required = customDomain;
  }

  // Setup file inputs
  setupFileInput("logo", "logo-name");
  setupFileInput("media", "media-name");
  setupFileInput("others", "others-name");

  // Theme color picker toggle
  themeChoiceRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      colorPickerContainer.style.display = radio.value === "custom" && radio.checked ? "block" : "none";
      calculatePrice();
    });
  });

  // Domain choice toggle
  domainChoiceRadios.forEach(radio => {
    radio.addEventListener("change", updateDomainField);
  });

  // Initialize on page load
  updateCategoryFields();
  calculatePrice();
  checkExtraPages();
  managePricePopup();
  updateDomainField();
  pagesValue.textContent = pagesSlider.value;

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
  window.addEventListener("scroll", managePricePopup);
  window.addEventListener("resize", managePricePopup);

  // Show confirmation modal
  window.showConfirm = (message, callback) => {
    const modal = document.getElementById('confirmModal');
    const messageElement = document.getElementById('confirmMessage');
    const yesBtn = document.getElementById('confirmYes');
    const noBtn = document.getElementById('confirmNo');

    messageElement.textContent = message;
    modal.style.display = 'flex';

    yesBtn.onclick = ()