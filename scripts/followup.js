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

  // Initialize on page load
  updateCategoryFields();
  calculatePrice();
  checkExtraPages();
  managePricePopup();

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

  // Form submission
  customForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!confirm("Double-check everything before submission?")) return;

    loadingPopup.style.display = "flex";
    submitBtn.disabled = true;

    const category = categorySelect.value;
    const template = templateInput.value.trim();

    if (!isValidTemplate(category, template)) {
      alert("Please enter a valid template name for the selected category.");
      templateInput.focus();
      loadingPopup.style.display = "none";
      submitBtn.disabled = false;
      return;
    }

    const formData = new FormData(customForm);
    const logoFile = formData.get("logo");
    const mediaFiles = formData.getAll("media");
    const otherFiles = formData.getAll("others");

    try {
      // Upload logo
      let logoUrl = "";
      if (logoFile && logoFile.name) {
        const fileName = `logo_${Date.now()}_${logoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { error: logoError } = await supabase.storage
          .from("custom_requests")
          .upload(fileName, logoFile, { contentType: logoFile.type });
        if (logoError) throw new Error(`Logo upload failed: ${logoError.message}`);
        logoUrl = `${supabaseUrl}/storage/v1/object/public/custom_requests/${fileName}`;
      }

      // Upload media files
      const mediaUrls = [];
      for (const file of mediaFiles) {
        if (file.name) {
          const fileName = `media_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const { error: mediaError } = await supabase.storage
            .from("custom_requests")
            .upload(fileName, file, { contentType: file.type });
          if (mediaError) throw new Error(`Media upload failed: ${mediaError.message}`);
          mediaUrls.push(`${supabaseUrl}/storage/v1/object/public/custom_requests/${fileName}`);
        }
      }

      // Upload other files
      const otherUrls = [];
      for (const file of otherFiles) {
        if (file.name) {
          const fileName = `other_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const { error: otherError } = await supabase.storage
            .from("custom_requests")
            .upload(fileName, file, { contentType: file.type });
          if (otherError) throw new Error(`Other file upload failed: ${otherError.message}`);
          otherUrls.push(`${supabaseUrl}/storage/v1/object/public/custom_requests/${fileName}`);
        }
      }

      // Prepare data for Supabase
      const selectedTheme = document.querySelector('input[name="themeChoice"]:checked').value;
      const data = {
        category: formData.get("category"),
        template: formData.get("template"),
        domain: formData.get("domain") || null,
        social_media: formData.get("socialMedia") || null,
        phone: formData.get("phone") || null,
        contact_method: formData.get("contactMethod") || "email",
        purpose: formData.get("purpose") || null,
        target_audience: formData.get("targetAudience") || null,
        country: formData.get("country"),
        duration: parseInt(formData.get("duration")),
        pages: parseInt(formData.get("pages")),
        extra_pages: formData.get("extraPages") || null,
        logo_url: logoUrl || null,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        other_urls: otherUrls.length > 0 ? otherUrls : null,
        theme_color: selectedTheme === "default" ? "#4fc3f7" : formData.get("customColor") || "#4fc3f7",
        created_at: new Date().toISOString(),
        // Category-specific fields
        school_name: formData.get("schoolName") || null,
        num_students: formData.get("numStudents") ? parseInt(formData.get("numStudents")) : null,
        business_name: formData.get("businessName") || formData.get("businessNameEcommerce") || null,
        services: formData.get("services") || formData.get("products") || formData.get("servicesHealthcare") || formData.get("servicesChurch") || formData.get("servicesOther") || null,
        contact_person: formData.get("contactPersonBusiness") || formData.get("contactPersonPortfolio") || formData.get("contactPersonEcommerce") || formData.get("contactPersonCharity") || formData.get("contactPersonBlog") || formData.get("contactPersonHealthcare") || formData.get("contactPersonEvent") || formData.get("contactPersonChurch") || formData.get("contactPersonNonprofit") || formData.get("contactPersonOther") || null,
        portfolio_url: formData.get("portfolioUrl") || null,
        charity_name: formData.get("charityName") || null,
        mission: formData.get("mission") || formData.get("missionNonprofit") || null,
        blog_name: formData.get("blogName") || null,
        topics: formData.get("topics") || null,
        facility_name: formData.get("facilityName") || null,
        event_name: formData.get("eventName") || null,
        event_details: formData.get("eventDetails") || null,
        nonprofit_name: formData.get("nonprofitName") || null,
        other_name: formData.get("otherName") || null
      };

      // Insert into Supabase
      const { error } = await supabase.from("custom_requests").insert([data]);
      if (error) throw new Error(`Database insert failed: ${error.message}`);

      alert("Thank you! We will review your request and send a link to your customized website to your inbox. A payment link will follow if there are no issues.");
      customForm.reset();
      updateCategoryFields();
      calculatePrice();
      checkExtraPages();
      managePricePopup();
    } catch (error) {
      alert(`Submission failed: ${error.message}`);
      console.error("Submission error:", error);
    } finally {
      loadingPopup.style.display = "none";
      submitBtn.disabled = false;
    }
  });
});
