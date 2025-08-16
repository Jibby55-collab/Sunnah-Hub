/* Qur'an Player — Fallback-only (guaranteed to work on Vercel)
   - Skips any remote API completely (no CORS)
   - Uses known-good mirrors for popular reciters
   - Keeps search + auto-next + multiple DOM id variants
*/

const SURAH_NAMES = [
  "Al-Fātiḥah","Al-Baqarah","Āl ʿImrān","An-Nisā’","Al-Mā’idah","Al-Anʿām","Al-Aʿrāf","Al-Anfāl","At-Tawbah","Yūnus","Hūd","Yūsuf","Ar-Raʿd","Ibrāhīm","Al-Ḥijr","An-Naḥl","Al-Isrā’","Al-Kahf","Maryam","Ṭā Hā","Al-Anbiyā’","Al-Ḥajj","Al-Mu’minūn","An-Nūr","Al-Furqān","Ash-Shuʿarā’","An-Naml","Al-Qaṣaṣ","Al-ʿAnkabūt","Ar-Rūm","Luqmān","As-Sajdah","Al-Aḥzāb","Saba’","Fāṭir","Yā Sīn","As-Ṣaffāt","Ṣād","Az-Zumar","Ghāfir","Fuṣṣilat","Ash-Shūrā","Az-Zukhruf","Ad-Dukhān","Al-Jāthiyah","Al-Aḥqāf","Muḥammad","Al-Fatḥ","Al-Ḥujurāt","Qāf","Adh-Dhāriyāt","Aṭ-Ṭūr","An-Najm","Al-Qamar","Ar-Raḥmān","Al-Wāqiʿah","Al-Ḥadīd","Al-Mujādilah","Al-Ḥashr","Al-Mumtaḥanah","Aṣ-Ṣaff","Al-Jumuʿah","Al-Munāfiqūn","At-Taghābun","Aṭ-Ṭalāq","At-Taḥrīm","Al-Mulk","Al-Qalam","Al-Ḥāqqah","Al-Maʿārij","Nūḥ","Al-Jinn","Al-Muzzammil","Al-Muddaththir","Al-Qiyāmah","Al-Insān","Al-Mursalāt","An-Naba’","An-Nāziʿāt","ʿAbasa","At-Takwīr","Al-Infiṭār","Al-Muṭaffifīn","Al-Inshiqāq","Al-Burūj","Aṭ-Ṭāriq","Al-Aʿlā","Al-Ghāshiyah","Al-Fajr","Al-Balad","Ash-Shams","Al-Layl","Aḍ-Ḍuḥā","Ash-Sharḥ","At-Tīn","Al-ʿAlaq","Al-Qadr","Al-Bayyinah","Az-Zalzalah","Al-ʿĀdiyāt","Al-Qāriʿah","At-Takāthur","Al-ʿAṣr","Al-Humazah","Al-Fīl","Quraysh","Al-Māʿūn","Al-Kawthar","Al-Kāfirūn","An-Naṣr","Al-Masad","Al-Ikhlāṣ","Al-Falaq","An-Nās"
];

const RECITERS = [
  { id: 10001, name: "Mishary Rashid Alafasy",  server: "https://server8.mp3quran.net/afs/"   },
  { id: 10002, name: "Saud Al-Shuraim",          server: "https://server8.mp3quran.net/shur/"  },
  { id: 10003, name: "Abdul Rahman As-Sudais",   server: "https://server8.mp3quran.net/sds/"   },
  { id: 10004, name: "Yasser Al-Dossari",        server: "https://server8.mp3quran.net/yasser/"},
  { id: 10005, name: "Abdul Basit Abdus Samad",  server: "https://server8.mp3quran.net/basit/" },
  { id: 10006, name: "Saad Al-Ghamdi",           server: "https://server8.mp3quran.net/gmd/"   },
  { id: 10007, name: "Muhammad Ayyub",           server: "https://server8.mp3quran.net/ayy/"   },
  { id: 10008, name: "Abdullah Al-Juhany",       server: "https://server11.mp3quran.net/jhn/"  },
];

const $ = (id) => document.getElementById(id);

// Be flexible with ids used in different versions of your HTML:
const reciterEl     = $("reciterSelect") || $("reciter");
const reciterSearch = $("reciterSearch") || $("search-reciter");
const surahSearch   = $("search")        || $("search-surah");
const autoNext      = $("autoNext");
const player        = $("player")        || $("audio-player");
const nowEl         = $("now");

// Ensure a surah list exists; create one if missing
let listEl = $("surahList");
if (!listEl) {
  listEl = document.createElement("ul");
  listEl.id = "surahList";
  listEl.style.listStyle = "none";
  listEl.style.padding = "0";
  listEl.style.marginTop = "16px";
  // Insert just before the audio player if possible
  (player?.parentNode || document.body).insertBefore(listEl, player || null);
}

const pad3 = n => String(n).padStart(3, "0");
const status = (t) => { if (nowEl) nowEl.textContent = t || ""; };

let currentServer = null;
let lastPlayedSurah = null;

// init
(function init(){
  // populate reciters instantly
  reciterEl.innerHTML = RECITERS
    .map((r, i) => `<option value="${i}">${r.name}</option>`)
    .join("");

  // pick first by default
  onChooseReciter(0);

  reciterEl.addEventListener("change", e => onChooseReciter(Number(e.target.value)));

  if (reciterSearch) {
    reciterSearch.addEventListener("input", () => {
      const q = reciterSearch.value.toLowerCase().trim();
      const list = q
        ? RECITERS.filter(r => r.name.toLowerCase().includes(q))
        : RECITERS;
      reciterEl.innerHTML = list.map((r,i)=>`<option value="${i}" data-name="${r.name}">${r.name}</option>`).join("");
      onChooseReciter(0, list);
    });
  }

  if (surahSearch) {
    surahSearch.addEventListener("input", () => renderSurahs(surahSearch.value.toLowerCase().trim()));
  }

  if (player && autoNext) {
    try { autoNext.checked = localStorage.getItem("qh_autonext")==="1"; } catch {}
    autoNext.addEventListener("change", () => {
      try { localStorage.setItem("qh_autonext", autoNext.checked ? "1" : "0"); } catch {}
    });
    player.addEventListener("ended", handleEnded);
  }
})();

function onChooseReciter(idx, list = RECITERS){
  const chosen = list[idx];
  currentServer = chosen?.server || null;
  status(`Selected: ${chosen?.name || "—"}`);
  renderSurahs(surahSearch ? surahSearch.value.toLowerCase().trim() : "");
}

function renderSurahs(query=""){
  listEl.innerHTML = "";
  SURAH_NAMES.forEach((name, i) => {
    const num = i+1;
    const show = !query || name.toLowerCase().includes(query) || String(num).includes(query);
    if (!show) return;

    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";
    li.style.padding = "10px 12px";
    li.style.margin = "6px 0";
    li.style.border = "1px solid #e6e8ee";
    li.style.borderRadius = "12px";
    li.style.background = "#fff";

    const label = document.createElement("div");
    label.innerHTML = `<strong>${num}. ${name}</strong>`;

    const btn = document.createElement("button");
    btn.textContent = "Play";
    btn.style.padding = "8px 12px";
    btn.style.border = "0";
    btn.style.borderRadius = "10px";
    btn.style.background = "#1e8e3e";
    btn.style.color = "#fff";
    btn.style.cursor = "pointer";

    btn.addEventListener("click", () => playSurah(num));

    li.appendChild(label);
    li.appendChild(btn);
    listEl.appendChild(li);
  });
}

async function playSurah(n){
  if (!currentServer || !player) return;
  const base = currentServer.endsWith("/") ? currentServer : currentServer + "/";
  const url = `${base}${pad3(n)}.mp3`;
  lastPlayedSurah = n;

  status(`Loading Sūrah ${n}…`);
  player.src = url;
  try {
    await player.play();
    status(`Now playing Sūrah ${n}`);
  } catch {
    status(`Couldn’t play Sūrah ${n}. Try another reciter.`);
  }
}

function handleEnded(){
  if (!autoNext || !autoNext.checked) return;
  if (!lastPlayedSurah || lastPlayedSurah >= 114) return;
  playSurah(lastPlayedSurah + 1);
}
