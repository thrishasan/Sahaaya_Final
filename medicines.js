  // ================= API IMPORTS =================
import { getAllMedicines, addMedicineAPI, deleteMedicineAPI, markMedicineTaken } from "./medicinesAPI.js";
let loadingMedicines = false;

// ================= INITIAL LOAD =================
document.addEventListener("DOMContentLoaded", async () => {
await loadMedicines();
});

document.addEventListener("submit", (e) => {
  e.preventDefault();
});
// ================= ADD MEDICINE =================


async function addMedicine() {
const name = document.getElementById("medName").value.trim();
const dosage = document.getElementById("medDosage").value.trim();
const time = document.getElementById("medTime").value;

if (!name || !dosage || !time) {
alert("Please fill all fields");
return;
}

const med = { name, dosage, time, repeat: "daily", enabled: 1 };

try {
const newMed = await addMedicineAPI(med);
console.log("Added medicine:", newMed);
await loadMedicines(); // refresh table
document.getElementById("medName").value = "";
document.getElementById("medDosage").value = "";
document.getElementById("medTime").value = "";
} catch (err) {
console.error("Failed to add medicine:", err);
alert("Failed to add medicine. See console.");
}
}

// ================= LOAD MEDICINES =================
// ================= LOAD MEDICINES =================
async function loadMedicines() {
if (loadingMedicines) return;
loadingMedicines = true;

const list = document.getElementById("medicineList");
list.innerHTML = "";

try {
const meds = await getAllMedicines();
console.log("LOADED MEDICINES:", meds); // 🔹 debug check

if (!meds || meds.length === 0) {
list.innerHTML = "<tr><td colspan='4'>No medicines added yet</td></tr>";
return;
}

meds.forEach(m => {
const tr = document.createElement("tr");
tr.innerHTML = `
<td>${m.name}</td>
<td>${m.dosage}</td>
<td>${m.time}</td>
<td>
<button type="button" class="delete-btn" data-id="${m.id}">❌</button>
</td>
`;
list.appendChild(tr);

// ✅ Attach delete event reading the data-id attribute
const btn = tr.querySelector(".delete-btn");

btn.addEventListener("click", async (e) => {
  e.preventDefault();
  e.stopPropagation(); // 🔥 IMPORTANT FIX
  e.stopImmediatePropagation();

  const id = e.currentTarget.dataset.id;
  console.log("🧪 DELETE CLICKED ID:", id);

  if (!id) return;

  try {
    await deleteMedicineAPI(id);
    console.log("✅ DELETE SUCCESS");
    await loadMedicines();
  } catch (err) {
    console.error("❌ DELETE FAILED:", err);
  }
});
});
} catch (err) {
console.error("Failed to load medicines:", err);
} finally {
loadingMedicines = false;
}
}

// ================= DELETE MEDICINE =================
 

// ================= MARK TAKEN =================
window.markMedicineTakenUI = async function(id) {
try {
await markMedicineTaken(id);
document.getElementById("medicineModal").style.display = "none";
window.currentMedicine = null;
await loadMedicines();
} catch (err) {
console.error("Failed to mark medicine taken:", err);
}
}

// ================= EXPORT =================
window.addMedicine = addMedicine;
window.loadMedicines = loadMedicines;
window.refreshMedicinesTable = loadMedicines;