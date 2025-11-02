import { supabase, supabaseUrl } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  const categorySelect = document.getElementById('category');
  const templateSelect = document.getElementById('templateSelect');
  const countrySelect = document.getElementById('country');
  const priceOutput = document.getElementById('price');
  const currencyOutput = document.getElementById('currency');
  const mobilePriceOutput = document.getElementById('mobile-price');
  const mobileCurrencyOutput = document.getElementById('mobile-currency');
  const customForm = document.getElementById('customForm');
  const loadingPopup = document.getElementById('loading-popup');
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
  let socialMediaList = [];

  // Toggle category document field
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

  // Toggle create doc button
  function toggleCreateDocBtn() {
    const hasFile = categoryDocumentInput.files.length > 0;
    createDocBtnContainer.style.display = categorySelect.value && !hasFile ? 'block' : 'none';
  }

  // Toggle mobile price popup
  function toggleMobilePricePopup() {
    const priceBox = document.querySelector('.price-box');
    const rect = priceBox.getBoundingClientRect();
    const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
    mobilePricePopup.style.display = priceOutput.textContent !== '0' && !isVisible ? 'block' : 'none';
  }

  // Fetch templates
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
      console.error('Error fetching templates:', error.message);
      templateSelect.innerHTML = '<option value="">Error loading templates</option>';
    }
  }

  // Update price
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

      const ratePerMonth = (data.rate_per_month || 0) / 100;
      const ratePerPage = (data.rate_per_page || 0) / 100;
      const totalPrice = basePrice * Math.pow(1 + ratePerMonth, duration - 12) * Math.pow(1 + ratePerPage, pages - 5);

      priceOutput.textContent = totalPrice.toFixed(2);
      currencyOutput.textContent = currency;
      mobilePriceOutput.textContent = totalPrice.toFixed(2);
      mobileCurrencyOutput.textContent = currency;
      toggleMobilePricePopup();
    } catch (error) {
      console.error('Price fetch error:', error.message);
      priceOutput.textContent = '0';
      currencyOutput.textContent = '';
      mobilePriceOutput.textContent = '0';
      mobileCurrencyOutput.textContent = '';
      mobilePricePopup.style.display = 'none';
    }
  }

  // Toggle domain name field
  function toggleDomainNameField() {
    const domainChoice = document.querySelector('input[name="domainChoice"]:checked').value;
    domainNameContainer.style.display = domainChoice === 'custom' ? 'block' : 'none';
  }

  // Toggle extra pages
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

  // Update file label
  function updateFileLabel(input, labelElement) {
    if (input.files.length === 0) {
      labelElement.textContent = input.multiple ? 'No files chosen' : 'No file chosen';
    } else if (input.files.length === 1) {
      labelElement.textContent = input.files[0].name;
    } else {
      labelElement.textContent = `${input.files.length} files chosen`;
    }
    toggleCreateDocBtn();
  }

  // Toggle color picker
  function toggleColorPicker() {
    const themeChoice = document.querySelector('input[name="themeChoice"]:checked')?.value;
    colorPickerContainer.style.display = themeChoice === 'custom' ? 'block' : 'none';
  }

  // Toggle social media input
  function toggleSocialMediaLink() {
    socialMediaLinkContainer.style.display = socialMediaPlatform.value ? 'block' : 'none';
  }

  // Update social media list
  function updateSocialMediaLinks() {
    socialMediaLinks.innerHTML = '';
    socialMediaList.forEach((link, index) => {
      const li = document.createElement('li');
      li.textContent = `${link.platform}: ${link.url}`;
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

  // Show confirmation modal
  function showConfirm(message, callback) {
    const confirmModal = document.getElementById('confirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');

    confirmMessage.textContent = message;
    confirmModal.style.display = 'block';

    const yesHandler = () => {
      callback(true);
      confirmModal.style.display = 'none';
      confirmYes.removeEventListener('click', yesHandler);
      confirmNo.removeEventListener('click', noHandler);
    };
    const noHandler = () => {
      callback(false);
      confirmModal.style.display = 'none';
      confirmYes.removeEventListener('click', yesHandler);
      confirmNo.removeEventListener('click', noHandler);
    };

    confirmYes.addEventListener('click', yesHandler);
    confirmNo.addEventListener('click', noHandler);
  }

  // === FIXED: Create Document Button ===
  createDocBtn.addEventListener('click', () => {
    const category = categorySelect.value;
    if (!category) {
      alert('Please select a category first.');
      return;
    }
    const url = `create-doc.html?category=${encodeURIComponent(category)}`;
    window.location.href = url;
  });

  // Event Listeners
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

  window.addEventListener('scroll', toggleMobilePricePopup);
  window.addEventListener('resize', toggleMobilePricePopup);

  domainChoiceRadios.forEach(radio => radio.addEventListener('change', toggleDomainNameField));
  themeChoiceRadios.forEach(radio => radio.addEventListener('change', toggleColorPicker));

  logoInput.addEventListener('change', () => updateFileLabel(logoInput, logoName));
  mediaInput.addEventListener('change', () => updateFileLabel(mediaInput, mediaName));
  othersInput.addEventListener('change', () => updateFileLabel(othersInput, othersName));
  categoryDocumentInput.addEventListener('change', () => updateFileLabel(categoryDocumentInput, categoryDocumentName));

  socialMediaPlatform.addEventListener('change', toggleSocialMediaLink);
  addSocialMediaLink.addEventListener('click', () => {
    const platform = socialMediaPlatform.value;
    const url = socialMediaLink.value.trim();
    if (platform && url) {
      socialMediaList.push({ platform, url });
      updateSocialMediaLinks();
      socialMediaPlatform.value = '';
      socialMediaLink.value = '';
      toggleSocialMediaLink();
    }
  });

  // Form submission
  customForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showConfirm('Submit form details?', async (confirmed) => {
      if (!confirmed) return;

      loadingPopup.style.display = 'flex';
      customForm.querySelector('button[type="submit"]').disabled = true;

      try {
        const formData = new FormData(customForm);
        const logoFile = logoInput.files[0];
        const mediaFiles = Array.from(mediaInput.files);
        const otherFiles = Array.from(othersInput.files);
        const categoryDocumentFile = categoryDocumentInput.files[0];
        const category = formData.get('category');
        const templateId = formData.get('template');
        const country = formData.get('country');
        const duration = parseInt(formData.get('duration')) || 12;
        const pages = parseInt(formData.get('pages')) || 5;

        const extraPageNames = [];
        if (pages > 5) {
          for (let i = 1; i <= pages - 5; i++) {
            const pageName = formData.get(`extraPage${i}`);
            if (pageName) extraPageNames.push(pageName);
          }
        }

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
          price = basePrice * Math.pow(1 + ratePerMonth, duration - 12) * Math.pow(1 + ratePerPage, pages - 5);
        }

        let logoUrl = null;
        if (logoFile) {
          const fileName = `${Date.now()}-${logoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const { data, error } = await supabase.storage
            .from('custom_requests')
            .upload(fileName, logoFile, { cacheControl: '3600', upsert: false, contentType: logoFile.type });
          if (error) throw new Error(`Logo upload failed: ${error.message}`);
          logoUrl = `${supabaseUrl}/storage/v1/object/public/custom_requests/${data.path}`;
        }

        const mediaUrls = [];
        for (const file of mediaFiles) {
          const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const { data, error } = await supabase.storage
            .from('custom_requests')
            .upload(fileName, file, { cacheControl: '3600', upsert: false, contentType: file.type });
          if (error) throw new Error(`Media upload failed: ${error.message}`);
          mediaUrls.push(`${supabaseUrl}/storage/v1/object/public/custom_requests/${data.path}`);
        }

        const otherUrls = [];
        for (const file of otherFiles) {
          const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const { data, error } = await supabase.storage
            .from('custom_requests')
            .upload(fileName, file, { cacheControl: '3600', upsert: false, contentType: file.type });
          if (error) throw new Error(`Other file upload failed: ${error.message}`);
          otherUrls.push(`${supabaseUrl}/storage/v1/object/public/custom_requests/${data.path}`);
        }

        let categoryDocUrl = null;
        if (categoryDocumentFile) {
          const fileName = `${Date.now()}-${categoryDocumentFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const { data, error } = await supabase.storage
            .from('custom_requests')
            .upload(fileName, categoryDocumentFile, { cacheControl: '3600', upsert: false, contentType: categoryDocumentFile.type });
          if (error) throw new Error(`Document upload failed: ${error.message}`);
          categoryDocUrl = `${supabaseUrl}/storage/v1/object/public/custom_requests/${data.path}`;
        }

        const allFiles = [...(logoUrl ? [logoUrl] : []), ...mediaUrls, ...otherUrls];

        const data = {
          name: `${formData.get('firstName')} ${formData.get('lastName')}`,
          email: formData.get('email'),
          phone: formData.get('phone'),
          category: formData.get('category'),
          template: templateName,
          price: price.toFixed(2),
          currency: currency,
          message: formData.get('purpose') || '',
          files: allFiles,
          social_media: socialMediaList.map(link => `${link.platform}: ${link.url}`),
          target_audience: formData.get('targetAudience'),
          country: formData.get('country'),
          domain_choice: formData.get('domainChoice'),
          domain_name: formData.get('domainName'),
          duration: parseInt(formData.get('duration')),
          pages: parseInt(formData.get('pages')),
          extra_pages: extraPageNames.join(', '),
          theme_color: formData.get('themeChoice') === 'custom' ? formData.get('customColor') : 'default',
          category_document: categoryDocUrl,
          created_at: new Date().toISOString()
        };

        const { error } = await supabase.from('custom_requests').insert(data);
        if (error) throw new Error(`Database insert failed: ${error.message}`);

        showConfirm('Form submitted successfully!', () => {
          customForm.reset();
          toggleCategoryDocument();
          toggleDomainNameField();
          toggleExtraPagesField();
          toggleColorPicker();
          toggleSocialMediaLink();
          socialMediaList = [];
          updateSocialMediaLinks();
          fetchTemplates();
          updatePrice();
          updateFileLabel(logoInput, logoName);
          updateFileLabel(mediaInput, mediaName);
          updateFileLabel(othersInput, othersName);
          updateFileLabel(categoryDocumentInput, categoryDocumentName);
        });
      } catch (error) {
        showConfirm(`Submission failed: ${error.message}`, () => {});
      } finally {
        loadingPopup.style.display = 'none';
        customForm.querySelector('button[type="submit"]').disabled = false;
      }
    });
  });

  // Initialize
  toggleCategoryDocument();
  toggleDomainNameField();
  toggleExtraPagesField();
  toggleColorPicker();
  toggleSocialMediaLink();
  fetchTemplates();
  updatePrice();
});
