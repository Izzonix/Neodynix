import { supabase, supabaseUrl } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  const categorySelect = document.getElementById('category');
  const templateInput = document.getElementById('template');
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
    mobilePricePopup.style.display = isVisible ? 'none' : 'block';
  }

  // Fetch and display template price
  async function updatePrice() {
    const category = categorySelect.value;
    const templateName = templateInput.value.trim();
    const country = countrySelect.value;

    if (!category || !templateName || !country) {
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
        .select('price_ugx, price_ksh, price_tsh, price_usd')
        .eq('category', category)
        .eq('name', templateName)
        .single();

      if (error || !data) {
        priceOutput.textContent = '0';
        currencyOutput.textContent = '';
        mobilePriceOutput.textContent = '0';
        mobileCurrencyOutput.textContent = '';
        mobilePricePopup.style.display = 'none';
        return;
      }

      let price, currency;
      switch (country) {
        case 'UG':
          price = data.price_ugx.toFixed(2);
          currency = 'UGX';
          break;
        case 'KE':
          price = data.price_ksh.toFixed(2);
          currency = 'KSH';
          break;
        case 'TZ':
          price = data.price_tsh.toFixed(2);
          currency = 'TSH';
          break;
        default:
          price = data.price_usd.toFixed(2);
          currency = 'USD';
      }

      priceOutput.textContent = price;
      currencyOutput.textContent = currency;
      mobilePriceOutput.textContent = price;
      mobileCurrencyOutput.textContent = currency;
      toggleMobilePricePopup();
    } catch (error) {
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
    const themeChoice = document.querySelector('input[name="themeChoice"]:checked').value;
    colorPickerContainer.style.display = themeChoice === 'custom' ? 'block' : 'none';
  }

  // Event listeners
  categorySelect.addEventListener('change', () => {
    toggleCategoryFields();
    updatePrice();
  });

  templateInput.addEventListener('input', updatePrice);
  countrySelect.addEventListener('change', updatePrice);
  window.addEventListener('scroll', toggleMobilePricePopup);
  window.addEventListener('resize', toggleMobilePricePopup);

  domainChoiceRadios.forEach(radio => {
    radio.addEventListener('change', toggleDomainNameField);
  });

  pagesInput.addEventListener('input', () => {
    document.getElementById('pages-value').textContent = pagesInput.value;
    toggleExtraPagesField();
  });

  durationInput.addEventListener('input', () => {
    document.getElementById('duration-value').textContent = durationInput.value;
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

        // Prepare form data
        const data = {
          first_name: formData.get('firstName'),
          last_name: formData.get('lastName'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          category: formData.get('category'),
          template: formData.get('template'),
          social_media: formData.get('socialMedia') ? formData.get('socialMedia').split(',').map(s => s.trim()) : [],
          purpose: formData.get('purpose'),
          target_audience: formData.get('targetAudience'),
          country: formData.get('country'),
          domain_choice: formData.get('domainChoice'),
          domain_name: formData.get('domainName'),
          duration: parseInt(formData.get('duration')),
          pages: parseInt(formData.get('pages')),
          extra_pages: formData.get('extraPages'),
          logo_url: logoUrl,
          media_urls: mediaUrls,
          other_urls: otherUrls,
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
  updatePrice();
});
