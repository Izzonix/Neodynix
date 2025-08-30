import { db, storage, auth } from './firebase-config.js';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

document.addEventListener('DOMContentLoaded', () => {
  // Ensure admin is authenticated
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      signInAnonymously(auth).catch(error => {
        console.error('Authentication error:', error);
        alert('Failed to authenticate. Please try again.');
      });
    }
  });

  // Toggle sections
  const btnTemplates = document.getElementById('btnTemplates');
  const btnSendEmail = document.getElementById('btnSendEmail');
  const sectionTemplates = document.getElementById('sectionTemplates');
  const sectionSendEmail = document.getElementById('sectionSendEmail');

  btnTemplates.addEventListener('click', () => {
    btnTemplates.classList.add('active');
    btnSendEmail.classList.remove('active');
    sectionTemplates.style.display = 'block';
    sectionSendEmail.style.display = 'none';
    fetchTemplates();
  });

  btnSendEmail.addEventListener('click', () => {
    btnSendEmail.classList.add('active');
    btnTemplates.classList.remove('active');
    sectionSendEmail.style.display = 'block';
    sectionTemplates.style.display = 'none';
  });

  // Template upload preview and form submit
  const imageFile = document.getElementById('imageFile');
  const preview = document.getElementById('imagePreview');
  const uploadForm = document.getElementById('uploadForm');

  imageFile.addEventListener('change', () => {
    const file = imageFile.files[0];
    if (!file) {
      preview.innerHTML = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.innerHTML = `<img src="${e.target.result}" alt="preview" style="max-width: 100%; border-radius: 8px;">`;
    };
    reader.readAsDataURL(file);
  });

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(uploadForm);
    const file = imageFile.files[0];
    if (!file) {
      alert('Please select an image.');
      return;
    }

    try {
      // Upload image to Firebase Storage
      const storageRef = ref(storage, `templates/${file.name}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);

      // Add template to Firestore
      await addDoc(collection(db, 'templates'), {
        name: formData.get('name'),
        category: formData.get('category'),
        description: formData.get('description'),
        link: formData.get('link'),
        image: imageUrl
      });

      alert('Template uploaded successfully!');
      uploadForm.reset();
      preview.innerHTML = '';
      fetchTemplates();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload. Check console for details.');
    }
  });

  // Fetch and display templates for management
  async function fetchTemplates() {
    try {
      const querySnapshot = await getDocs(collection(db, 'templates'));
      const templateList = document.getElementById('templateList');
      templateList.innerHTML = '';

      querySnapshot.forEach(doc => {
        const template = doc.data();
        const templateItem = document.createElement('div');
        templateItem.className = 'template-item';
        templateItem.innerHTML = `
          <img src="${template.image}" alt="${template.name}" />
          <p><strong>${template.name}</strong></p>
          <p>Category: ${template.category}</p>
          <p>Description: ${template.description}</p>
          <p><a href="${template.link}" target="_blank">Preview</a></p>
          <button onclick="editTemplate('${doc.id}')">Edit</button>
          <button onclick="deleteTemplate('${doc.id}')">Delete</button>
        `;
        templateList.appendChild(templateItem);
      });
    } catch (err) {
      console.error('Fetch templates error:', err);
      alert('Failed to load templates. Check console for details.');
    }
  }

  // Edit template
  window.editTemplate = async (id) => {
    const name = prompt('Enter new template name:');
    const category = prompt('Enter new category (Business, Portfolio, School, Church, Other):');
    const description = prompt('Enter new description:');
    const link = prompt('Enter new preview link:');
    const file = imageFile.files[0];

    try {
      const templateRef = doc(db, 'templates', id);
      const updateData = {};
      if (name) updateData.name = name;
      if (category) updateData.category = category;
      if (description) updateData.description = description;
      if (link) updateData.link = link;
      if (file) {
        const storageRef = ref(storage, `templates/${file.name}`);
        await uploadBytes(storageRef, file);
        updateData.image = await getDownloadURL(storageRef);
      }

      if (Object.keys(updateData).length > 0) {
        await updateDoc(templateRef, updateData);
        alert('Template updated successfully!');
        fetchTemplates();
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('Failed to update. Check console for details.');
    }
  };

  // Delete template
  window.deleteTemplate = async (id) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteDoc(doc(db, 'templates', id));
        alert('Template deleted successfully!');
        fetchTemplates();
      } catch (err) {
        console.error('Delete error:', err);
        alert('Failed to delete. Check console for details.');
      }
    }
  };

  // Send email form logic
  const emailForm = document.getElementById('emailForm');
  emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    emailjs.init('YOUR_EMAILJS_USER_ID'); // Replace with your EmailJS user ID

    const templateParams = {
      to_email: emailForm.customerEmail.value,
      custom_link: emailForm.customLink.value,
      price: emailForm.price.value,
      currency: emailForm.currency.value
    };

    try {
      const response = await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams);
      alert('Email sent successfully!');
      emailForm.reset();
    } catch (error) {
      console.error('Email send error:', error);
      alert('Failed to send email. Check console for details.');
    }
  });

  // Load templates on page load
  fetchTemplates();
});
