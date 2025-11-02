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

  // ... [all your existing functions: toggleCategoryDocument, fetchTemplates, updatePrice, etc.] ...

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

  // === FORM SUBMISSION & ALL OTHER EVENT LISTENERS (unchanged) ===
  // ... [rest of your code exactly as before] ...

  // Initialize form state
  toggleCategoryDocument();
  toggleDomainNameField();
  toggleExtraPagesField();
  toggleColorPicker();
  toggleSocialMediaLink();
  fetchTemplates();
  updatePrice();
});
