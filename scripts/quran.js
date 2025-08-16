// API base URLs
const QURAN_API = "https://api.alquran.cloud/v1/surah/";
const TAFSEER_API = "https://api.quran-tafseer.com/tafseer/1/"; // Example English tafseer

const surahSelect = document.getElementById("surahSelect");
const languageSelect = document.getElementById("languageSelect");
const quranText = document.getElementById("quranText");
const tafseerText = document.getElementById("tafseerText");

// Load Surah list
fetch("https://api.alquran.cloud/v1/surah")
  .then(res => res.json())
  .then(data => {
    data.data.forEach(surah => {
      const option = document.createElement("option");
      option.value = surah.number;
      option.textContent = `${surah.number}. ${surah.englishName} (${surah.name})`;
      surahSelect.appendChild(option);
    });
  });

// Load Qur'an and Tafseer when Surah changes
surahSelect.addEventListener("change", () => {
  const surahNumber = surahSelect.value;
  const lang = languageSelect.value;

  // Fetch Qur'an Arabic text
  fetch(`${QURAN_API}${surahNumber}`)
    .then(res => res.json())
    .then(data => {
      quranText.innerHTML = data.data.ayahs.map(a => `<p>${a.text}</p>`).join("");
    });

  // Fetch Tafseer (example uses English)
  fetch(`${TAFSEER_API}${surahNumber}`)
    .then(res => res.json())
    .then(data => {
      tafseerText.innerHTML = data.text || "No tafseer available.";
    });
});
