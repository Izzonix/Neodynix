import { supabase, supabaseUrl } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  // DOM Element Selectors
  const categorySelect = document.getElementById('category');
  const templateSelect = document.getElementById('templateSelect');
  const countrySelect = document.getElementById('country');
  const priceOutput = document.getElementById('price');
  const currencyOutput = document.getElementById('currency');
  const mobilePriceOutput = document.getElementById('mobile-price');
  const mobileCurrencyOutput = document.getElementById('mobile-currency');
  const customForm = document.getElementById('customForm');
  const loadingPopup = document.getElementById('loading-popup'); // Full-page spinner
  const themeChoiceRadios = document.getElementsByName('themeChoice');
  const colorPickerContainer = document.getElementById('colorPickerContainer');
  const domainChoiceRadios = document.getElementsByName('domainChoice');
  const domainNameContainer = document.getElementById('domainNameContainer');
  const pagesInput = document.getElementById('pages');
  const extraPagesContainer = document.getElementById('extraPagesContainer');
  const extraPagesInputs = document.getElementById('extraPagesInputs');
  const logoInput = document.getElementById('logo');
  const mediaInput = document.getElementById('media');
  const othersInput = document.getElementById('others');
  const logoName = document.getElementById('logo-name');
  const mediaName = document.getElementById('media-name');
  const othersName = document.getElementById('others-name');
  const mobilePricePopup = document.getElementById('mobile-price-popup');
  const durationInput = document.getElementById('duration');
  const socialMediaPlatform = document.getElementById('socialMediaPlatform');
  const socialMediaLinkContainer = document.getElementById('socialMediaLinkContainer');
  const socialMediaLink = document.getElementById('socialMediaLink');
  const addSocialMediaLink = document.getElementById('addSocialMediaLink');
  const socialMediaLinks = document.getElementById('socialMediaLinks');
  const categoryDocumentInput = document.getElementById('categoryDocument');
  const categoryDocumentName = document.getElementById('categoryDocument-name');
  const categoryLabel = document.getElementById('categoryLabel');
  const categoryDocumentContainer = document.getElementById('categoryDocumentContainer');
  const createDocBtnContainer = document.getElementById('createDocBtnContainer');
  const createDocBtn = document.getElementById('createDocBtn');
  const submitButton = customForm.querySelector('button[type="submit"]');

  let socialMediaList = [];

  const fileLimits = {
    logo: { maxSize: 5 * 1024 * 1024, maxCount: 1 },
    media: { maxSize: 10 * 1024 * 1024, maxCount: 10 },
    others: { maxSize: 5 * 1024 * 1024, maxCount: 4 },
    categoryDocument: { maxSize: 10 * 1024 * 1024, maxCount: 1 }
  };

  /**
   * Displays an error message and auto-hides it.
   * @param {string} message - The error message content.
   */
  function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Auto-hide after 10 seconds
    clearTimeout(errorEl.hideTimeout);
    errorEl.hideTimeout = setTimeout(() => {
      errorEl.style.display = 'none';
    }, 10000);
  }

  function toggleCategoryDocument() {
    const category = categorySelect.value;
    if (category) {
      categoryLabel.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      categoryDocumentContainer.style.display = 'block';
    } else {
      categoryDocumentContainer.style.display = 'none';
    }
    toggleCreateDocBtn();
  }

  function toggleCreateDocBtn() {
    const hasFile = categoryDocumentInput.files.length > 0;
    // Show the "Create Document Now" button only if a category is selected and no file is chosen
    createDocBtnContainer.style.display = categorySelect.value && !hasFile ? 'block' : 'none';
  }

  function toggleMobilePricePopup() {
    const priceBox = document.querySelector('.price-box');
    const rect = priceBox.getBoundingClientRect();
    // Check if the price box is visible in the viewport
    const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
    // Show the mobile price popup if the price is calculated and the main price box is NOT visible
    mobilePricePopup.style.display = priceOutput.textContent !== '0' && !isVisible ? 'block' : 'none';
  }

  /**
   * Fetches templates from Supabase based on the selected category.
   */
  async function fetchTemplates() {
    const category = categorySelect.value;
    templateSelect.innerHTML = '<option value="">-- Select Template --</option>';
    if (!category) return;

    try {
      const { data, error } = await supabase
        .from('templates')
        .select('id, name')
        .eq('category', category)
        .order('name', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        data.forEach(template => {
          const option = document.createElement('option');
          option.value = template.id;
          option.textContent = template.name;
          templateSelect.appendChild(option);
        });
      } else {
        templateSelect.innerHTML = '<option value="">No templates available</option>';
      }
    } catch (error) {
      templateSelect.innerHTML = '<option value="">Error loading templates</option>';
      showError('Failed to load templates. Please refresh and try again.');
    }
  }

  /**
   * Calculates and updates the estimated price based on selections.
   */
  async function updatePrice() {
    const templateId = templateSelect.value;
    const country = countrySelect.value;
    const duration = parseInt(durationInput.value) || 12;
    const pages = parseInt(pagesInput.value) || 5;

    if (!templateId || !country) {
      priceOutput.textContent = '0';
      currencyOutput.textContent = '';
      mobilePriceOutput.textContent = '0';
      mobileCurrencyOutput.textContent = '';
      mobilePricePopup.style.display = 'none';
      return;
    }

    try {
      const { data, error } = await supabase
        .from('templates')
        .select('price_ugx, price_ksh, price_tsh, price_usd, rate_per_month, rate_per_page')
        .eq('id', templateId)
        .single();

      if (error || !data) throw error;

      let basePrice, currency;
      switch (country) {
        case 'UG': basePrice = data.price_ugx || 0; currency = 'UGX'; break;
        case 'KE': basePrice = data.price_ksh || 0; currency = 'KSH'; break;
        case 'TZ': basePrice = data.price_tsh || 0; currency = 'TSH'; break;
        default: basePrice = data.price_usd || 0; currency = 'USD';
      }

      // Rates are stored as a percentage multiplier (e.g., 5 for 5%)
      const ratePerMonth = (data.rate_per_month || 0) / 100;
      const ratePerPage = (data.rate_per_page || 0) / 100;

      // Compound calculation for price adjustment
      // The base price includes 12 months and 5 pages. Adjustments apply after that.
      const durationMultiplier = Math.pow(1 + ratePerMonth, Math.max(0, duration - 12));
      const pagesMultiplier = Math.pow(1 + ratePerPage, Math.max(0, pages - 5));

      const totalPrice = basePrice * durationMultiplier * pagesMultiplier;

      priceOutput.textContent = totalPrice.toFixed(2);
      currencyOutput.textContent = currency;
      mobilePriceOutput.textContent = totalPrice.toFixed(2);
      mobileCurrencyOutput.textContent = currency;
      toggleMobilePricePopup();
    } catch (error) {
      priceOutput.textContent = '0';
      currencyOutput.textContent = '';
      mobilePriceOutput.textContent = '0';
      mobileCurrencyOutput.textContent = '';
      mobilePricePopup.style.display = 'none';
      // Only show error for failed fetch, not for initial state
      if (templateId) {
        showError('Failed to calculate price. Please select a template and country.');
      }
    }
  }

  function toggleDomainNameField() {
    const domainChoice = document.querySelector('input[name="domainChoice"]:checked').value;
    domainNameContainer.style.display = domainChoice === 'custom' ? 'block' : 'none';
  }

  function toggleExtraPagesField() {
    const pages = parseInt(pagesInput.value);
    extraPagesContainer.style.display = pages > 5 ? 'block' : 'none';
    extraPagesInputs.innerHTML = '';
    if (pages > 5) {
      const extraPages = pages - 5;
      for (let i = 1; i <= extraPages; i++) {
        const label = document.createElement('label');
        label.textContent = `Extra Page ${i} Name`;
        label.setAttribute('for', `extraPage${i}`);
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `extraPage${i}`;
        input.name = `extraPage${i}`;
        input.placeholder = `e.g. Page ${i}`;
        input.required = true;
        extraPagesInputs.appendChild(label);
        extraPagesInputs.appendChild(input);
      }
    }
  }

  /**
   * Updates the displayed file name(s) and performs file size/count validation.
   * @param {HTMLInputElement} input - The file input element.
   * @param {HTMLElement} labelElement - The element displaying the file name(s).
   */
  function updateFileLabel(input, labelElement) {
    const files = Array.from(input.files);
    const limit = fileLimits[input.id];

    // --- Validation Checks ---
    if (limit) {
      // Check file count
      if (files.length > limit.maxCount) {
        showError(`Maximum ${limit.maxCount} file(s) allowed for ${input.id}.`);
        input.value = '';
        files.length = 0; // Clear the files array for logic below
      }

      // Check file sizes
      for (let file of files) {
        if (file.size > limit.maxSize) {
          showError(`File "${file.name}" is too large. Maximum size is ${(limit.maxSize / (1024 * 1024)).toFixed(1)}MB.`);
          input.value = '';
          files.length = 0; // Clear the files array
          break;
        }
      }

      // Media-specific checks
      if (input.id === 'media' && files.length > 0) {
        const images = files.filter(f => f.type.startsWith('image/'));
        const videos = files.filter(f => f.type.startsWith('video/'));
        if (images.length < 5 || images.length > 10 || videos.length > 3) {
          showError(`Media files must include 5-10 images and a maximum of 3 videos. Found ${images.length} images and ${videos.length} videos.`);
          input.value = '';
          files.length = 0; // Clear the files array
        }
      }
    }

    // --- Update Label ---
    if (files.length === 0) {
      labelElement.textContent = input.multiple ? 'No files chosen' : 'No file chosen';
    } else if (files.length === 1) {
      labelElement.textContent = files[0].name;
    } else {
      labelElement.textContent = `${files.length} files chosen`;
    }

    // If it's the category document input, toggle the Create Doc button
    if (input.id === 'categoryDocument') {
      toggleCreateDocBtn();
    }
  }

  function toggleColorPicker() {
    const themeChoice = document.querySelector('input[name="themeChoice"]:checked')?.value;
    colorPickerContainer.style.display = themeChoice === 'custom' ? 'block' : 'none';
  }

  function toggleSocialMediaLink() {
    socialMediaLinkContainer.style.display = socialMediaPlatform.value ? 'block' : 'none';
  }

  function updateSocialMediaLinks() {
    socialMediaLinks.innerHTML = '';
    socialMediaList.forEach((link, index) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${link.platform}:</strong> ${link.url}`;
      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.className = 'btn btn-cancel';
      removeBtn.onclick = () => {
        socialMediaList.splice(index, 1);
        updateSocialMediaLinks();
      };
      li.appendChild(removeBtn);
      socialMediaLinks.appendChild(li);
    });
  }

  /**
   * Displays a confirmation modal.
   * @param {string} message - The confirmation message.
   * @param {function(boolean): void} callback - Callback function called with true/false based on user choice.
   */
  function showConfirm(message, callback) {
    const confirmModal = document.getElementById('confirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');

    confirmMessage.textContent = message;
    confirmModal.style.display = 'flex'; // Use flex to center the content

    // Ensure previous listeners are removed before adding new ones
    confirmYes.onclick = null;
    confirmNo.onclick = null;

    confirmYes.onclick = () => {
      callback(true);
      confirmModal.style.display = 'none';
    };
    confirmNo.onclick = () => {
      callback(false);
      confirmModal.style.display = 'none';
    };
  }

  // --- Initial Setup and Event Listeners ---

  // Handle Create Document Button (sends user to a separate doc creation page)
  createDocBtn.addEventListener('click', () => {
    const category = categorySelect.value;
    if (!category) return showError('Please select a category first.');
    // Redirect to the document creation page with the category pre-selected
    window.location.href = `create-doc.html?category=${encodeURIComponent(category)}`;
  });

  // Dynamic Content & Price Updates
  categorySelect.addEventListener('change', () => {
    toggleCategoryDocument();
    fetchTemplates();
    updatePrice();
  });

  templateSelect.addEventListener('change', updatePrice);
  countrySelect.addEventListener('change', updatePrice);

  durationInput.addEventListener('input', () => {
    document.getElementById('duration-value').textContent = durationInput.value;
    updatePrice();
  });

  pagesInput.addEventListener('input', () => {
    document.getElementById('pages-value').textContent = pagesInput.value;
    toggleExtraPagesField();
    updatePrice();
  });

  // UI Toggles
  window.addEventListener('scroll', toggleMobilePricePopup);
  window.addEventListener('resize', toggleMobilePricePopup);

  domainChoiceRadios.forEach(radio => radio.addEventListener('change', toggleDomainNameField));
  themeChoiceRadios.forEach(radio => radio.addEventListener('change', toggleColorPicker));

  // File Upload Handlers
  logoInput.addEventListener('change', () => updateFileLabel(logoInput, logoName));
  mediaInput.addEventListener('change', () => updateFileLabel(mediaInput, mediaName));
  othersInput.addEventListener('change', () => updateFileLabel(othersInput, othersName));
  categoryDocumentInput.addEventListener('change', () => updateFileLabel(categoryDocumentInput, categoryDocumentName));

  // Social Media Link Management
  socialMediaPlatform.addEventListener('change', toggleSocialMediaLink);
  addSocialMediaLink.addEventListener('click', () => {
    const platform = socialMediaPlatform.value;
    const url = socialMediaLink.value.trim();
    if (platform && url) {
      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(url)) {
        showError('Please enter a valid URL (starting with http:// or https://).');
        return;
      }
      socialMediaList.push({ platform, url });
      updateSocialMediaLinks();
      socialMediaPlatform.value = '';
      socialMediaLink.value = '';
      toggleSocialMediaLink();
    } else {
      showError('Please select a platform and enter a URL.');
    }
  });

  /**
   * Main form submission handler.
   */
  customForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Show initial confirmation
    showConfirm('Are you sure you want to submit the form details?', async (confirmed) => {
      if (!confirmed) return;

      // --- Pre-Submission Validation ---
      const pages = parseInt(pagesInput.value) || 5;
      if (pages > 5) {
        for (let i = 1; i <= pages - 5; i++) {
          const pageName = customForm.querySelector(`#extraPage${i}`)?.value?.trim();
          if (!pageName) {
            showError('Please provide names for all extra pages.');
            return;
          }
        }
      }

      // --- Start Loading & Disable Button ---
      loadingPopup.style.display = 'flex'; // Show the full-page spinner
      submitButton.disabled = true;

      try {
        const formData = new FormData(customForm);
        const logoFile = logoInput.files[0];
        const mediaFiles = Array.from(mediaInput.files);
        const otherFiles = Array.from(othersInput.files);
        const categoryDocumentFile = categoryDocumentInput.files[0];
        const category = formData.get('category');
        const templateId = formData.get('template');
        const country = formData.get('country');
        const duration = parseInt(formData.get('duration'));
        const pages = parseInt(formData.get('pages'));

        // Recalculate Price and fetch Template Name for database record
        let price = 0;
        let currency = '';
        let templateName = '';
        if (templateId && country) {
          const { data, error } = await supabase
            .from('templates')
            .select('name, price_ugx, price_ksh, price_tsh, price_usd, rate_per_month, rate_per_page')
            .eq('id', templateId)
            .single();

          if (error || !data) throw new Error('Template not found');

          templateName = data.name;
          let basePrice;
          switch (country) {
            case 'UG': basePrice = data.price_ugx || 0; currency = 'UGX'; break;
            case 'KE': basePrice = data.price_ksh || 0; currency = 'KSH'; break;
            case 'TZ': basePrice = data.price_tsh || 0; currency = 'TSH'; break;
            default: basePrice = data.price_usd || 0; currency = 'USD';
          }
          const ratePerMonth = (data.rate_per_month || 0) / 100;
          const ratePerPage = (data.rate_per_page || 0) / 100;
          price = basePrice * Math.pow(1 + ratePerMonth, Math.max(0, duration - 12)) * Math.pow(1 + ratePerPage, Math.max(0, pages - 5));
        }

        // --- File Upload Logic ---

        // Helper function for uploading a single file
        const uploadFile = async (file, type) => {
          if (!file) return null;
          const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const { data, error } = await supabase.storage
            .from('custom_requests')
            .upload(fileName, file, { cacheControl: '3600', upsert: false, contentType: file.type });
          if (error) throw new Error(`${type} upload failed: ${error.message}`);
          return { url: `${supabaseUrl}/storage/v1/object/public/custom_requests/${data.path}`, type: type };
        };

        // Upload single files
        const logoData = await uploadFile(logoFile, 'logo');
        const categoryDocData = await uploadFile(categoryDocumentFile, 'category_doc');

        // Upload multiple media files
        const mediaData = await Promise.all(mediaFiles.map(file => uploadFile(file, 'media')));
        const otherData = await Promise.all(otherFiles.map(file => uploadFile(file, 'other')));

        // Combine all file data into one array, filtering out nulls
        const allFilesData = [logoData, categoryDocData, ...mediaData, ...otherData].filter(Boolean);

        // Clear file inputs after successful upload to prevent double-submission
        logoInput.value = '';
        mediaInput.value = '';
        othersInput.value = '';
        categoryDocumentInput.value = '';
        updateFileLabel(logoInput, logoName);
        updateFileLabel(mediaInput, mediaName);
        updateFileLabel(othersInput, othersName);
        updateFileLabel(categoryDocumentInput, categoryDocumentName);

// Collect extra page names
const extraPageNames = [];
if (pages > 5) {
  for (let i = 1; i <= pages - 5; i++) {
    const pageName = formData.get(`extraPage${i}`);
    if (pageName && pageName.trim()) extraPageNames.push(pageName.trim());
  }
}

// --- Database Insertion ---
const dataToInsert = {
  name: `${formData.get('firstName')} ${formData.get('lastName')}`,
  email: formData.get('email'),
  phone: formData.get('phone'),
  category: category,
  template: templateName,
  price: price.toFixed(2),
  currency: currency,
  message: formData.get('purpose') || '', // Using 'purpose' for the message field
  files: allFilesData, // Array of {url, type} objects

  social_media: socialMediaList
    .map(link => `${link.platform}: ${link.url}`)
    .join('; '), // Stored as a delimited string

  target_audience: formData.get('targetAudience'),
  country: country,
  domain_choice: formData.get('domainChoice'),
  domain_name: formData.get('domainName') || null,
  duration: duration,
  pages: pages,
  extra_pages: extraPageNames.join(', '),
  theme_color:
    formData.get('themeChoice') === 'custom'
      ? formData.get('customColor')
      : 'default',
  created_at: new Date().toISOString()
};

const { error: dbError } = await supabase
  .from('custom_requests')
  .insert([dataToInsert]);

if (dbError) throw new Error('Database save failed: ' + dbError.message);

// --- Success Action: Redirect ---
window.location.href = 'submission-success.html';

} catch (error) {
  let userMessage = 'Submission failed. Please check your inputs and try again.';

  if (error.message.includes('upload')) {
    userMessage = `File upload failed. Details: ${error.message}`;
  } else if (
    error.message.includes('save') ||
    error.message.includes('Database')
  ) {
    userMessage =
      'Unable to save details to the database. Please try submitting again.';
  } else if (error.message.includes('Template not found')) {
    userMessage = 'Selected template is unavailable. Please choose another.';
  }

  showError(userMessage);

} finally {
  // --- End Loading & Re-enable Button ---
  loadingPopup.style.display = 'none';
  submitButton.disabled = false;
}

// --- Initialize UI State ---
toggleCategoryDocument();
toggleDomainNameField();
toggleExtraPagesField();
toggleColorPicker();
toggleSocialMediaLink();
fetchTemplates();
updatePrice();
