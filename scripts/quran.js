// scripts/quran.js

async function loadReciters() {
  try {
    const response = await fetch("https://api.quran.com:443/v4/resources/recitations");
    const data = await response.json();

    const reciterSelect = document.getElementById("reciter");
    reciterSelect.innerHTML = ""; // Clear loading text

    data.data.forEach(reciter => {
      const option = document.createElement("option");
      option.value = reciter.id;
      option.textContent = reciter.reciter_name;
      reciterSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading reciters:", error);
  }
}

// Call function on page load
document.addEventListener("DOMContentLoaded", loadReciters);
