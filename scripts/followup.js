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

    yesBtn.onclick = () => {
      callback(true);
      modal.style.display = 'none';
    };
    noBtn.onclick = () => {
      callback(false);
      modal.style.display = 'none';
    };
  };

  // Form submission
  customForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showConfirm('Are you sure you want to submit these details?', async (confirmed) => {
      if (!confirmed) return;

      loadingPopup.style.display = "block";
      submitBtn.disabled = true;

      const formData = new FormData(customForm);
      const category = formData.get("category");
      const template = formData.get("template");

      if (!isValidTemplate(category, template)) {
        alert("Invalid template for the selected category.");
        loadingPopup.style.display = "none";
        submitBtn.disabled = false;
        return;
      }

      try {
        const logoFile = formData.get("logo");
        let logoUrl = null;
        if (logoFile && logoFile.size > 0) {
          const logoFileName = `${Date.now()}-${logoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const { error: logoError } = await supabase.storage
            .from("custom_requests")
            .upload(logoFileName, logoFile);
          if (logoError) throw new Error(`Logo upload failed: ${logoError.message}`);
          logoUrl = `${supabaseUrl}/storage/v1/object/public/custom_requests/${logoFileName}`;
        }

        const mediaFiles = formData.getAll("media");
        const mediaUrls = [];
        for (const file of mediaFiles) {
          if (file.size > 0) {
            const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const { error } = await supabase.storage
              .from("custom_requests")
              .upload(fileName, file);
            if (error) throw new Error(`Media upload failed: ${error.message}`);
            mediaUrls.push(`${supabaseUrl}/storage/v1/object/public/custom_requests/${fileName}`);
          }
        }

        const otherFiles = formData.getAll("others");
        const otherUrls = [];
        for (const file of otherFiles) {
          if (file.size > 0) {
            const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const { error } = await supabase.storage
              .from("custom_requests")
              .upload(fileName, file);
            if (error) throw new Error(`Other file upload failed: ${error.message}`);
            otherUrls.push(`${supabaseUrl}/storage/v1/object/public/custom_requests/${fileName}`);
          }
        }

        const socialMedia = formData.get("socialMedia")?.split(",").map(url => url.trim()).filter(url => url) || null;
        const themeColor = formData.get("themeChoice") === "custom" ? formData.get("customColor") : "default";
        const domainChoice = formData.get("domainChoice");
        const domainName = domainChoice === "custom" ? formData.get("domainName") : null;

        const data = {
          first_name: formData.get("firstName"),
          last_name: formData.get("lastName"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          category,
          template,
          social_media: socialMedia,
          purpose: formData.get("purpose") || null,
          target_audience: formData.get("targetAudience") || null,
          country: formData.get("country"),
          domain_choice: domainChoice,
          domain_name: domainName,
          duration: parseInt(formData.get("duration")),
          pages: parseInt(formData.get("pages")),
          extra_pages: formData.get("extraPages") || null,
          logo_url: logoUrl,
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
          other_urls: otherUrls.length > 0 ? otherUrls : null,
          theme_color: themeColor,
          created_at: new Date().toISOString()
        };

        // Add category-specific fields
        if (category === "education") {
          data.school_name = formData.get("schoolName") || null;
          data.num_students = formData.get("numStudents") ? parseInt(formData.get("numStudents")) : null;
        } else if (category === "business") {
          data.business_name = formData.get("businessName") || null;
          data.services = formData.get("services") || null;
          data.contact_person = formData.get("contactPersonBusiness") || null;
        } else if (category === "portfolio") {
          data.portfolio_url = formData.get("portfolioUrl") || null;
          data.projects = formData.get("projects") || null;
          data.contact_person = formData.get("contactPersonPortfolio") || null;
        } else if (category === "ecommerce") {
          data.business_name = formData.get("businessNameEcommerce") || null;
          data.products = formData.get("products") || null;
          data.contact_person = formData.get("contactPersonEcommerce") || null;
        } else if (category === "charity") {
          data.charity_name = formData.get("charityName") || null;
          data.mission = formData.get("mission") || null;
          data.contact_person = formData.get("contactPersonCharity") || null;
        } else if (category === "blog") {
          data.blog_name = formData.get("blogName") || null;
          data.topics = formData.get("topics") || null;
          data.contact_person = formData.get("contactPersonBlog") || null;
        } else if (category === "healthcare") {
          data.facility_name = formData.get("facilityName") || null;
          data.services = formData.get("servicesHealthcare") || null;
          data.contact_person = formData.get("contactPersonHealthcare") || null;
        } else if (category === "event") {
          data.event_name = formData.get("eventName") || null;
          data.event_details = formData.get("eventDetails") || null;
          data.contact_person = formData.get("contactPersonEvent") || null;
        } else if (category === "church") {
          data.church_name = formData.get("churchName") || null;
          data.services = formData.get("servicesChurch") || null;
          data.contact_person = formData.get("contactPersonChurch") || null;
        } else if (category === "nonprofit") {
          data.nonprofit_name = formData.get("nonprofitName") || null;
          data.mission = formData.get("missionNonprofit") || null;
          data.contact_person = formData.get("contactPersonNonprofit") || null;
        } else if (category === "other") {
          data.other_name = formData.get("otherName") || null;
          data.services = formData.get("servicesOther") || null;
          data.contact_person = formData.get("contactPersonOther") || null;
        }

        const { error } = await supabase.from("custom_requests").insert(data);
        if (error) throw new Error(`Database insert failed: ${error.message}`);

        alert("Request submitted successfully!");
        customForm.reset();
        updateCategoryFields();
        checkExtraPages();
        calculatePrice();
        updateDomainField();
        colorPickerContainer.style.display = "none";
        document.getElementById("logo-name").textContent = "No file chosen";
        document.getElementById("media-name").textContent = "No files chosen";
        document.getElementById("others-name").textContent = "No files chosen";
      } catch (error) {
        alert(`Submission failed: ${error.message}`);
      } finally {
        loadingPopup.style.display = "none";
        submitBtn.disabled = false;
      }
    });
  });
});
