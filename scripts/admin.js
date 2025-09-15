import { supabase } from "./supabase-config.js";

// ========== Template Upload ==========
const uploadForm = document.getElementById("uploadForm");
if (uploadForm) {
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(uploadForm);

    // Upload image
    const imageFile = formData.get("image");
    let imageUrl = "";
    if (imageFile && imageFile.name) {
      const filePath = `templates/${Date.now()}_${imageFile.name}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from("templates")
        .upload(filePath, imageFile);

      if (storageError) {
        document.getElementById("result").innerText =
          "Error uploading file: " + storageError.message;
        return;
      }
      const { data: publicUrl } = supabase.storage
        .from("templates")
        .getPublicUrl(filePath);
      imageUrl = publicUrl.publicUrl;
    }

    const { error } = await supabase.from("templates").insert([
      {
        name: formData.get("name"),
        category: formData.get("category"),
        description: formData.get("description"),
        link: formData.get("link"),
        price_ugx: formData.get("priceUGX"),
        price_ksh: formData.get("priceKSH"),
        price_tsh: formData.get("priceTSH"),
        price_usd: formData.get("priceUSD"),
        extra_month_ugx: formData.get("extraMonthUGX"),
        extra_month_ksh: formData.get("extraMonthKSH"),
        extra_month_tsh: formData.get("extraMonthTSH"),
        extra_month_usd: formData.get("extraMonthUSD"),
        extra_page_ugx: formData.get("extraPageUGX"),
        extra_page_ksh: formData.get("extraPageKSH"),
        extra_page_tsh: formData.get("extraPageTSH"),
        extra_page_usd: formData.get("extraPageUSD"),
        image: imageUrl,
      },
    ]);

    if (error) {
      document.getElementById("result").innerText =
        "Error: " + error.message;
    } else {
      document.getElementById("result").innerText =
        "Template uploaded successfully!";
      uploadForm.reset();
      loadTemplates();
    }
  });
}

// ========== Load Templates ==========
async function loadTemplates() {
  const { data, error } = await supabase.from("templates").select("*");
  const templateList = document.getElementById("templateList");
  if (error) {
    templateList.innerHTML = "<p>Error loading templates.</p>";
    return;
  }
  templateList.innerHTML = "";
  data.forEach((tpl) => {
    const div = document.createElement("div");
    div.className = "template-card";
    div.innerHTML = `
      <img src="${tpl.image}" alt="${tpl.name}" class="template-thumb"/>
      <h4>${tpl.name}</h4>
      <p>${tpl.description}</p>
      <p><strong>UGX:</strong> ${tpl.price_ugx} | 
         <strong>Ksh:</strong> ${tpl.price_ksh} | 
         <strong>Tsh:</strong> ${tpl.price_tsh} | 
         <strong>USD:</strong> ${tpl.price_usd}</p>
      <button onclick="editTemplate(${tpl.id})" class="btn">Edit</button>
      <button onclick="deleteTemplate(${tpl.id})" class="btn btn-cancel">Delete</button>
    `;
    templateList.appendChild(div);
  });
}
window.addEventListener("DOMContentLoaded", loadTemplates);

// ========== Edit Template ==========
window.editTemplate = async function (id) {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    alert("Error loading template: " + error.message);
    return;
  }

  document.getElementById("editName").value = data.name;
  document.getElementById("editCategory").value = data.category;
  document.getElementById("editDescription").value = data.description;
  document.getElementById("editLink").value = data.link;
  document.getElementById("editPriceUGX").value = data.price_ugx;
  document.getElementById("editPriceKSH").value = data.price_ksh;
  document.getElementById("editPriceTSH").value = data.price_tsh;
  document.getElementById("editPriceUSD").value = data.price_usd;
  document.getElementById("editExtraMonthUGX").value = data.extra_month_ugx;
  document.getElementById("editExtraMonthKSH").value = data.extra_month_ksh;
  document.getElementById("editExtraMonthTSH").value = data.extra_month_tsh;
  document.getElementById("editExtraMonthUSD").value = data.extra_month_usd;
  document.getElementById("editExtraPageUGX").value = data.extra_page_ugx;
  document.getElementById("editExtraPageKSH").value = data.extra_page_ksh;
  document.getElementById("editExtraPageTSH").value = data.extra_page_tsh;
  document.getElementById("editExtraPageUSD").value = data.extra_page_usd;

  const modal = document.getElementById("editTemplateModal");
  modal.style.display = "block";

  const editForm = document.getElementById("editTemplateForm");
  editForm.onsubmit = async (e) => {
    e.preventDefault();
    const { error: updateError } = await supabase
      .from("templates")
      .update({
        name: document.getElementById("editName").value,
        category: document.getElementById("editCategory").value,
        description: document.getElementById("editDescription").value,
        link: document.getElementById("editLink").value,
        price_ugx: document.getElementById("editPriceUGX").value,
        price_ksh: document.getElementById("editPriceKSH").value,
        price_tsh: document.getElementById("editPriceTSH").value,
        price_usd: document.getElementById("editPriceUSD").value,
        extra_month_ugx: document.getElementById("editExtraMonthUGX").value,
        extra_month_ksh: document.getElementById("editExtraMonthKSH").value,
        extra_month_tsh: document.getElementById("editExtraMonthTSH").value,
        extra_month_usd: document.getElementById("editExtraMonthUSD").value,
        extra_page_ugx: document.getElementById("editExtraPageUGX").value,
        extra_page_ksh: document.getElementById("editExtraPageKSH").value,
        extra_page_tsh: document.getElementById("editExtraPageTSH").value,
        extra_page_usd: document.getElementById("editExtraPageUSD").value,
      })
      .eq("id", id);

    if (updateError) {
      alert("Error updating template: " + updateError.message);
    } else {
      alert("Template updated successfully!");
      modal.style.display = "none";
      loadTemplates();
    }
  };
};

// ========== Delete Template ==========
window.deleteTemplate = async function (id) {
  if (!confirm("Are you sure you want to delete this template?")) return;
  const { error } = await supabase.from("templates").delete().eq("id", id);
  if (error) {
    alert("Error deleting: " + error.message);
  } else {
    alert("Template deleted.");
    loadTemplates();
  }
};

// ========== Close Edit Modal ==========
window.closeEditModal = function () {
  document.getElementById("editTemplateModal").style.display = "none";
};
