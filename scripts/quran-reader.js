/* Qur'an Reader
 * Arabic + selectable translation from AlQuranCloud (CORS-friendly).
 * Tafsir is attempted from Quran.com v4 (may require CORS allowance).
 * If tafsir fails, we show a helpful message in the UI.
 */

const SURAH_NAMES = [
  "Al-Fātiḥah","Al-Baqarah","Āl ʿImrān","An-Nisā’","Al-Mā’idah","Al-Anʿām","Al-Aʿrāf","Al-Anfāl","At-Tawbah","Yūnus","Hūd","Yūsuf","Ar-Raʿd","Ibrāhīm","Al-Ḥijr","An-Naḥl","Al-Isrā’","Al-Kahf","Maryam","Ṭā Hā","Al-Anbiyā’","Al-Ḥajj","Al-Mu’minūn","An-Nūr","Al-Furqān","Ash-Shuʿarā’","An-Naml","Al-Qaṣaṣ","Al-ʿAnkabūt","Ar-Rūm","Luqmān","As-Sajdah","Al-Aḥzāb","Saba’","Fāṭir","Yā Sīn","As-Ṣaffāt","Ṣād","Az-Zumar","Ghāfir","Fuṣṣilat","Ash-Shūrā","Az-Zukhruf","Ad-Dukhān","Al-Jāthiyah","Al-Aḥqāf","Muḥammad","Al-Fatḥ","Al-Ḥujurāt","Qāf","Adh-Dhāriyāt","Aṭ-Ṭūr","An-Najm","Al-Qamar","Ar-Raḥmān","Al-Wāqiʿah","Al-Ḥadīd","Al-Mujādilah","Al-Ḥashr","Al-Mumtaḥanah","Aṣ-Ṣaff","Al-Jumuʿah","Al-Munāfiqūn","At-Taghābun","Aṭ-Ṭalāq","At-Taḥrīm","Al-Mulk","Al-Qalam","Al-Ḥāqqah","Al-Maʿārij","Nūḥ","Al-Jinn","Al-Muzzammil","Al-Muddaththir","Al-Qiyāmah","Al-Insān","Al-Mursalāt","An-Naba’","An-Nāziʿāt","ʿAbasa","At-Takwīr","Al-Infiṭār","Al-Muṭaffifīn","Al-Inshiqāq","Al-Burūj","Aṭ-Ṭāriq","Al-Aʿlā","Al-Ghāshiyah","Al-Fajr","Al-Balad","Ash-Shams","Al-Layl","Aḍ-Ḍuḥā","Ash-Sharḥ","At-Tīn","Al-ʿAlaq","Al-Qadr","Al-Bayyinah","Az-Zalzalah","Al-ʿĀdiyāt","Al-Qāriʿah","At-Takāthur","Al-ʿAṣr","Al-Humazah","Al-Fīl","Quraysh","Al-Māʿūn","Al-Kawthar","Al-Kāfirūn","An-Naṣr","Al-Masad","Al-Ikhlāṣ","Al-Falaq","An-Nās"
];

const $ = id => document.getElementById(id);
const surahSelect = $("surahSelect");
const transSelect  = $("transSelect");
const tafsirSelect = $("tafsirSelect");
const openTafsir   = $("openTafsir");
const ayahList     = $("ayahList");
const statusEl     = $("status");
const tafsirPanel  = $("tafsirPanel");
const tafsirTitle  = $("tafsirTitle");
const tafsirBody   = $("tafsirBody");

// Build surah select
(() => {
  const opts = SURAH_NAMES.map((n,i)=>`<option value="${i+1}">${i+1}. ${n}</option>`).join("");
  surahSelect.innerHTML = opts;
  surahSelect.value = "1";
})();

// Wire listeners
surahSelect.addEventListener("change", () => loadSurah());
transSelect.addEventListener("change", () => loadSurah());
openTafsir.addEventListener("click", () => loadTafsir());

// Initial load
loadSurah();

/* -------------------- Core loaders -------------------- */

async function loadSurah(){
  const s   = Number(surahSelect.value);
  const tr  = transSelect.value;

  // Arabic + translation (two calls to AlQuranCloud)
  const arabicURL = `https://api.alquran.cloud/v1/surah/${s}/ar.quran-uthmani`;
  const transURL  = `https://api.alquran.cloud/v1/surah/${s}/${encodeURIComponent(tr)}`;

  ayahList.innerHTML = "";
  inform(`Loading Sūrah ${s} — ${SURAH_NAMES[s-1]}…`);

  try {
    const [ar, trd] = await Promise.all([ fetchJSON(arabicURL), fetchJSON(transURL) ]);

    if (!ar || !ar.data || !ar.data.ayahs) throw new Error("Arabic failed");
    if (!trd || !trd.data || !trd.data.ayahs) throw new Error("Translation failed");

    const aAyahs  = ar.data.ayahs;
    const tAyahs  = trd.data.ayahs;
    const len     = Math.min(aAyahs.length, tAyahs.length);

    let html = "";
    for (let i=0; i<len; i++){
      const A = aAyahs[i];
      const T = tAyahs[i];
      html += `
        <article class="ayah">
          <div class="a-ar">${escapeHTML(A.text)}</div>
          <div class="a-tr">${escapeHTML(T.text)}</div>
          <div class="ayah-meta">
            <span>Ayah ${A.numberInSurah} • Juzʾ ${A.juz}</span>
            <span class="muted">${ar.data.edition.englishName} / ${trd.data.edition.englishName}</span>
          </div>
        </article>
      `;
    }
    ayahList.innerHTML = html;
    inform(`Loaded: Sūrah ${s} — ${SURAH_NAMES[s-1]} (${len} āyāt).`);
  } catch (e) {
    console.error(e);
    ayahList.innerHTML = "";
    inform("Couldn’t load the surah right now. Please try again.");
  }
}

async function loadTafsir(){
  const s = Number(surahSelect.value);
  const mode = tafsirSelect.value;     // 'jalalayn' | 'ibn-kathir' (ids guessed; API may differ)
  tafsirPanel.style.display = "block";
  tafsirTitle.textContent = `Tafsīr — ${prettyTafsirName(mode)} for Sūrah ${s}`;
  tafsirBody.textContent = "Loading…";

  /* Quran.com v4 API (note: some deployments may see CORS). 
     We try ayah-by-ayah fetch and join. If it fails, show a graceful message. */
  try {
    // First: get surah info (how many verses) from AlQuranCloud (we already have it)
    const meta = await fetchJSON(`https://api.alquran.cloud/v1/surah/${s}`);
    if (!meta || !meta.data || !meta.data.ayahs) throw new Error("meta fail");
    const ayahCount = meta.data.ayahs.length;

    const chunks = [];
    // Quran.com tafsir endpoint pattern (subject to change by provider):
    // GET https://api.quran.com/api/v4/tafsir/{tafsir_id}/ayah/{surah}:{ayah}
    const tafsirId = tafsirIdFromMode(mode);

    for (let i=1; i<=ayahCount; i++){
      const key = `${s}:${i}`;
      const url = `https://api.quran.com/api/v4/tafsir/${tafsirId}/ayah/${key}`;
      const t  = await fetchJSON(url, 9000);
      if (t && t.tafsir && t.tafsir.text) {
        chunks.push(`<p><strong>${key}</strong> — ${t.tafsir.text}</p>`);
      } else {
        chunks.push(`<p><strong>${key}</strong> — <span class="muted">No tafsīr returned.</span></p>`);
      }
    }
    tafsirBody.innerHTML = chunks.join("");
  } catch (e) {
    console.warn("Tafsir fetch failed (likely CORS or provider change).", e);
    tafsirBody.innerHTML = `
      <p class="muted">
        Couldn’t load tafsīr from the provider in this environment.  
        Your Qur’an text and translations are still available above.  
        We can switch to a different tafsīr source or pre-bundle one as a JSON in a follow-up.
      </p>`;
  }
}

/* -------------------- helpers -------------------- */

function tafsirIdFromMode(mode){
  // Quran.com IDs (these can change; using common values used in demos):
  // Jalalayn: 97  | Ibn Kathir (Arabic): 169 (these may vary)
  if (mode === "jalalayn") return 97;
  if (mode === "ibn-kathir") return 169;
  return 97;
}

function prettyTafsirName(mode){
  if (mode === "jalalayn") return "Jalalayn";
  if (mode === "ibn-kathir") return "Ibn Kathīr";
  return mode;
}

function inform(msg){ statusEl.textContent = msg || ""; }

async function fetchJSON(url, timeout=10000){
  const ctrl = new AbortController();
  const id = setTimeout(()=>ctrl.abort(), timeout);
  try {
    const r = await fetch(url, { cache:"no-store", signal: ctrl.signal });
    clearTimeout(id);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    clearTimeout(id);
    return null;
  }
}

function escapeHTML(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}