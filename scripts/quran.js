// scripts/quran.js

// Load reciters
async function loadReciters() {
  try {
    const res = await fetch("https://api.quran.com/v4/resources/recitations");
    if (!res.ok) throw new Error("Failed to fetch reciters");

    const data = await res.json();
    const reciterDropdown = document.getElementById("reciter");

    reciterDropdown.innerHTML = ""; // clear loading text
    data.recitations.forEach((reciter) => {
      const option = document.createElement("option");
      option.value = reciter.id;
      option.textContent = reciter.translated_name.name;
      reciterDropdown.appendChild(option);
    });
  } catch (error) {
    console.error(error);
    alert("Could not load reciters. Please refresh.");
  }
}

// Load Surahs
async function loadSurahs() {
  try {
    const res = await fetch("https://api.quran.com/v4/chapters");
    if (!res.ok) throw new Error("Failed to fetch surahs");

    const data = await res.json();
    const surahDropdown = document.getElementById("surah");

    data.chapters.forEach((surah) => {
      const option = document.createElement("option");
      option.value = surah.id;
      option.textContent = `${surah.id}. ${surah.name_simple} (${surah.translated_name.name})`;
      surahDropdown.appendChild(option);
    });
  } catch (error) {
    console.error(error);
    alert("Could not load surahs. Please refresh.");
  }
}

// Play selected reciter + surah
async function playAudio() {
  const reciterId = document.getElementById("reciter").value;
  const surahId = document.getElementById("surah").value;
  const audioPlayer = document.getElementById("audioPlayer");

  if (!reciterId || !surahId) return;

  try {
    const res = await fetch(
      `https://api.quran.com/v4/recitations/${reciterId}?chapter=${surahId}`
    );
    if (!res.ok) throw new Error("Failed to fetch audio");

    const data = await res.json();
    if (data.audio_files.length > 0) {
      audioPlayer.src = data.audio_files[0].url;
      audioPlayer.play();
    } else {
      alert("No audio found for this reciter/surah.");
    }
  } catch (error) {
    console.error(error);
    alert("Error playing surah.");
  }
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  loadReciters();
  loadSurahs();

  document.getElementById("reciter").addEventListener("change", playAudio);
  document.getElementById("surah").addEventListener("change", playAudio);
});
