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
  const logoInput = document.getElementById('logo');
  const mediaInput = document.getElementById('media');
  const othersInput = document.getElementById('others');
  const logoName = document.getElementById('logo-name');
  const mediaName = document.getElementById('media-name');
  const othersName = document.getElementById('others-name');
  const mobilePricePopup = document.getElementById('mobile-price-popup');
  const durationInput = document.getElementById('duration');

  // Toggle category-specific fields
  function toggleCategoryFields() {
    const selectedCategory = categorySelect.value;
    document.querySelectorAll('.category-fields').forEach(field => {
      field.style.display = field.classList.contains(`${selectedCategory}-fields`) ? 'block' : 'none';
    });
  }

  // Toggle mobile price popup based on price box visibility
  function toggleMobilePricePopup() {
    const priceBox = document.querySelector('.price-box');
    const rect = priceBox.getBoundingClientRect();
    const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
    mobilePricePopup.style.display = priceOutput.textContent !== '0' && !isVisible ? 'block' : 'none';
  }

  // Fetch templates for the selected category
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

  // Fetch and display template price
  async function updatePrice() {
    const templateId = templateSelect.value;
    const country = countrySelect.value;
    const duration = parseInt(durationInput.value) || 12;
    const pages = parseInt(pagesInput.value) || 5;

    // Reset price if required fields are missing
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

      if (error || !data) {
        console.error('Price fetch error:', error?.message || 'Template not found');
        priceOutput.textContent = '0';
        currencyOutput.textContent = '';
        mobilePriceOutput.textContent = '0';
        mobileCurrencyOutput.textContent = '';
        mobilePricePopup.style.display = 'none';
        return;
      }

      let basePrice, currency;
      switch (country) {
        case 'UG':
          basePrice = data.price_ugx || 0;
          currency = 'UGX';
          break;
        case 'KE':
          basePrice = data.price_ksh || 0;
          currency = 'KSH';
          break;
        case 'TZ':
          basePrice = data.price_tsh || 0;
          currency = 'TSH';
          break;
        default:
          basePrice = data.price_usd || 0;
          currency = 'USD';
      }

      const ratePerMonth = data.rate_per_month || 0;
      const ratePerPage = data.rate_per_page || 0;
      const totalPrice = basePrice + (ratePerMonth * duration) + (ratePerPage * pages);

      priceOutput.textContent = totalPrice.toFixed(2);
      currencyOutput.textContent = currency;
      mobilePriceOutput.textContent = totalPrice.toFixed(2);
      mobileCurrencyOutput.textContent = currency;
      toggleMobilePricePopup();
    } catch (error) {
      console.error('Price fetch exception:', error.message);
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

  // Toggle extra pages field
  function toggleExtraPagesField() {
    const pages = parseInt(pagesInput.value);
    extraPagesContainer.style.display = pages > 5 ? 'block' : 'none';
  }

  // Update file input labels
  function updateFileLabel(input, labelElement) {
    if (input.files.length === 0) {
      labelElement.textContent = input.multiple ? 'No files chosen' : 'No file chosen';
    } else if (input.files.length === 1) {
      labelElement.textContent = input.files[0].name;
    } else {
      labelElement.textContent = `${input.files.length} files chosen`;
    }
  }

  // Toggle color picker
  function toggleColorPicker() {
    const themeChoice = document.querySelector('input[name="themeChoice"]:checked')?.value;
    colorPickerContainer.style.display = themeChoice === 'custom' ? 'block' : 'none';
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

  // Event listeners
  categorySelect.addEventListener('change', () => {
    toggleCategoryFields();
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

  domainChoiceRadios.forEach(radio => {
    radio.addEventListener('change', toggleDomainNameField);
  });

  themeChoiceRadios.forEach(radio => {
    radio.addEventListener('change', toggleColorPicker);
  });

  logoInput.addEventListener('change', () => updateFileLabel(logoInput, logoName));
  mediaInput.addEventListener('change', () => updateFileLabel(mediaInput, mediaName));
  othersInput.addEventListener('change', () => updateFileLabel(othersInput, othersName));

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
        const category = formData.get('category');
        const templateId = formData.get('template');
        const country = formData.get('country');
        const duration = parseInt(formData.get('duration')) || 12;
        const pages = parseInt(formData.get('pages')) || 5;

        // Fetch template details for submission
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
            case 'UG':
              basePrice = data.price_ugx || 0;
              currency = 'UGX';
              break;
            case 'KE':
              basePrice = data.price_ksh || 0;
              currency = 'KSH';
              break;
            case 'TZ':
              basePrice = data.price_tsh || 0;
              currency = 'TSH';
              break;
            default:
              basePrice = data.price_usd || 0;
              currency = 'USD';
          }
          price = basePrice + (data.rate_per_month || 0) * duration + (data.rate_per_page || 0) * pages;
        }

        // Upload logo
        let logoUrl = null;
        if (logoFile) {
          const fileName = `${Date.now()}-${logoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const { data, error } = await supabase.storage
            .from('custom_requests')
            .upload(fileName, logoFile, { cacheControl: '3600', upsert: false, contentType: logoFile.type });
          if (error) throw new Error(`Logo upload failed: ${error.message}`);
          logoUrl = `${supabaseUrl}/storage/v1/object/public/custom_requests/${data.path}`;
        }

        // Upload media files
        const mediaUrls = [];
        for (const file of mediaFiles) {
          const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const { data, error } = await supabase.storage
            .from('custom_requests')
            .upload(fileName, file, { cacheControl: '3600', upsert: false, contentType: file.type });
          if (error) throw new Error(`Media upload failed: ${error.message}`);
          mediaUrls.push(`${supabaseUrl}/storage/v1/object/public/custom_requests/${data.path}`);
        }

        // Upload other files
        const otherUrls = [];
        for (const file of otherFiles) {
          const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const { data, error } = await supabase.storage
            .from('custom_requests')
            .upload(fileName, file, { cacheControl: '3600', upsert: false, contentType: file.type });
          if (error) throw new Error(`Other file upload failed: ${error.message}`);
          otherUrls.push(`${supabaseUrl}/storage/v1/object/public/custom_requests/${data.path}`);
        }

        // Combine all file URLs
        const allFiles = [...(logoUrl ? [logoUrl] : []), ...mediaUrls, ...otherUrls];

        // Prepare form data
        const data = {
          name: `${formData.get('firstName')} ${formData.get('lastName')}`,
          email: formData.get('email'),
          phone: formData.get('phone'),
          category: formData.get('category'),
          template: templateName,
          price: price.toFixed(2),
          currency: currency,
          message: formData.get('purpose') || formData.get('extraPages') || '',
          files: allFiles,
          social_media: formData.get('socialMedia') ? formData.get('socialMedia').split(',').map(s => s.trim()) : [],
          target_audience: formData.get('targetAudience'),
          country: formData.get('country'),
          domain_choice: formData.get('domainChoice'),
          domain_name: formData.get('domainName'),
          duration: parseInt(formData.get('duration')),
          pages: parseInt(formData.get('pages')),
          extra_pages: formData.get('extraPages'),
          theme_color: formData.get('themeChoice') === 'custom' ? formData.get('customColor') : 'default',
          created_at: new Date().toISOString()
        };

        // Add category-specific fields
        if (data.category === 'education') {
          data.school_name = formData.get('schoolName');
          data.num_students = parseInt(formData.get('numStudents')) || null;
        } else if (data.category === 'business') {
          data.business_name = formData.get('businessName');
          data.services = formData.get('services');
          data.contact_person = formData.get('contactPersonBusiness');
        } else if (data.category === 'portfolio') {
          data.portfolio_url = formData.get('portfolioUrl');
          data.projects = formData.get('projects');
          data.contact_person = formData.get('contactPersonPortfolio');
        } else if (data.category === 'ecommerce') {
          data.business_name = formData.get('businessName');
          data.products = formData.get('products');
          data.contact_person = formData.get('contactPersonEcommerce');
        } else if (data.category === 'charity') {
          data.charity_name = formData.get('charityName');
          data.mission = formData.get('mission');
          data.contact_person = formData.get('contactPersonCharity');
        } else if (data.category === 'blog') {
          data.blog_name = formData.get('blogName');
          data.topics = formData.get('topics');
          data.contact_person = formData.get('contactPersonBlog');
        } else if (data.category === 'healthcare') {
          data.facility_name = formData.get('facilityName');
          data.services = formData.get('services');
          data.contact_person = formData.get('contactPersonHealthcare');
        } else if (data.category === 'event') {
          data.event_name = formData.get('eventName');
          data.event_details = formData.get('eventDetails');
          data.contact_person = formData.get('contactPersonEvent');
        } else if (data.category === 'church') {
          data.church_name = formData.get('churchName');
          data.services = formData.get('services');
          data.contact_person = formData.get('contactPersonChurch');
        } else if (data.category === 'nonprofit') {
          data.nonprofit_name = formData.get('nonprofitName');
          data.mission = formData.get('mission');
          data.contact_person = formData.get('contactPersonNonprofit');
        } else if (data.category === 'other') {
          data.other_name = formData.get('otherName');
          data.services = formData.get('services');
          data.contact_person = formData.get('contactPersonOther');
        }

        // Insert data into Supabase
        const { error } = await supabase.from('custom_requests').insert(data);
        if (error) throw new Error(`Database insert failed: ${error.message}`);

        showConfirm('Form submitted successfully!', () => {
          customForm.reset();
          toggleCategoryFields();
          toggleDomainNameField();
          toggleExtraPagesField();
          toggleColorPicker();
          fetchTemplates();
          updatePrice();
          updateFileLabel(logoInput, logoName);
          updateFileLabel(mediaInput, mediaName);
          updateFileLabel(othersInput, othersName);
        });
      } catch (error) {
        showConfirm(`Submission failed: ${error.message}`, () => {});
      } finally {
        loadingPopup.style.display = 'none';
        customForm.querySelector('button[type="submit"]').disabled = false;
      }
    });
  });

  // Initialize form state
  toggleCategoryFields();
  toggleDomainNameField();
  toggleExtraPagesField();
  toggleColorPicker();
  fetchTemplates();
  updatePrice();
});
