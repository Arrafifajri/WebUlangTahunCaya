// TAGLINE: Script dashboard admin. Semua perubahan konten dikumpulkan di sini lalu disimpan ke D1/KV.
const SETTINGS_KEY = "cayaBirthdaySettings";
const ADMIN_SESSION_KEY = "cayaDashboardPassword";
// TAGLINE: currentSettings adalah draft lokal dashboard sebelum tombol Simpan ditekan.
let currentSettings;

const defaultSettings = {
    unlockDate: "2026-05-06T00:00",
    countdownKicker: "Menuju 06 Mei",
    countdownTitle: "Countdown Ulang Tahunmu 🎂",
    lockedMessage: "Isi web ini akan terbuka otomatis sesuai tanggal dan jam yang kamu tentukan.",
    unlockedMessage: "Waktunya buka amplop. Selamat ulang tahun, sayang! 💙",
    heroTitle: "HBD Sayang! ☁️",
    heroMessage: "Sejauh langit membentang, sebanyak itu doaku buat kamu. I love you!",
    lockedInstruction: "Tunggu sampai 06 Mei ya...",
    unlockedInstruction: "Tap amplopnya buat buka 💌",
    musicSrc: "",
    musicName: "",
    loveTitle: "Kenapa Aku Sayang Kamu 💙",
    reasons: [
        "Karena senyummu bikin tenang",
        "Karena kamu selalu ngerti aku",
        "Karena hadirmu bikin hidup lebih indah",
        "Karena kamu rumah terbaikku"
    ],
    littleThings: [
        { label: "Lagu favorit", value: "Tulis lagu favoritmu di sini" },
        { label: "Makanan favorit", value: "Tulis makanan favoritmu di sini" },
        { label: "Kebiasaan lucu", value: "Tulis kebiasaan kecil yang paling kamu inget" },
        { label: "Hal yang aku kagumi", value: "Cara kamu tetap kuat dan baik hati" }
    ],
    polaroids: [
        { image: "awal_kenal.jpg", title: "Maret 2023", alt: "Awal Kenal", caption: "Waktu pertama kali kita ngobrol. Langit hari itu rasanya cerah banget, persis perasaan aku." },
        { image: "jadian.jpg", title: "Agustus 2023", alt: "Jadian", caption: "Hari paling bersejarah! Akhirnya kamu nerima aku jadi bagian dari hidupmu." }
    ],
    detailedTimeline: [
        { title: "First Date 🎬", text: "Nonton bioskop bareng pertama kali. Masih malu-malu banget, deg-degan parah rasanya pengen waktu berhenti aja.", date: "September 2023" },
        { title: "Kehujanan Bareng 🌧️", text: "Lagi asik motoran eh hujan deres. Neduh di pinggir jalan sambil minum kopi anget, momen sederhana tapi berbekas banget.", date: "November 2023" },
        { title: "Tahun Baru Pertama 🎆", text: "Lewatin pergantian tahun berdua. Liat kembang api sambil janji bakal terus bareng-bareng di tahun-tahun berikutnya.", date: "Desember 2023" }
    ],
    wishes: [
        "Semoga kamu selalu sehat dan hatimu sering merasa tenang.",
        "Semoga semua mimpi yang kamu simpan pelan-pelan jadi nyata.",
        "Semoga hari-harimu dipenuhi orang baik dan kabar baik.",
        "Semoga kamu selalu ingat kalau kamu sangat berharga.",
        "Semoga langkahmu ringan, rezekimu luas, dan senyummu sering muncul."
    ],
    quiz: [
        { question: "Kalau aku lagi insecure, kamu bakal gimana?", options: ["Peluk dan yakinin aku nggak akan kemana-mana", "Kasih penjelasan logis biar aku tenang", "Ngajak bercanda sampai aku salting"] },
        { question: "Kalau kita lagi kangen tapi belum bisa ketemu, kamu pilih apa?", options: ["Telepon sampai sama-sama tenang", "Kirim pesan panjang yang manis", "Ngajak bahas rencana ketemu berikutnya"] },
        { question: "Kalau aku lagi capek banget, kamu mau jadi apa?", options: ["Tempat pulang yang paling adem", "Penyemangat yang nggak maksa", "Partner jajan biar mood balik"] }
    ],
    carousel: [
        { src: "awal_kenal.jpg", title: "Awal Kenal", caption: "Momen pertama yang jadi awal semua cerita." },
        { src: "jadian.jpg", title: "Jadian", caption: "Hari yang bikin cerita ini terasa lebih serius dan hangat." },
        { src: "foto_favorit.jpg", title: "Foto Favorit", caption: "Ganti file ini dengan foto favorit kalian berdua." }
    ],
    movingGallery: [],
    movingGallerySpeed: 1,
    letterTitle: "Surat Untukmu 💙",
    letterParagraphs: [
        "Selamat ulang tahun, sayang. Semoga umur barumu selalu dipenuhi hal-hal baik, langkah yang dimudahkan, hati yang dikuatkan, dan mimpi-mimpi yang pelan-pelan jadi nyata.",
        "Terima kasih sudah hadir dan jadi bagian paling hangat dalam hari-hariku. Aku sayang kamu, bukan cuma di hari spesial ini, tapi di hari biasa, hari capek, hari lucu, dan hari-hari kecil yang sering lewat diam-diam.",
        "Semoga kamu selalu ingat: kamu berharga, kamu dicintai, dan aku bangga punya kamu."
    ],
    surpriseTitle: "Happy Birthday, Sayang 🎂",
    surpriseText: "Semoga hari ini jadi salah satu hari yang kamu inget dengan senyum. Aku sayang kamu lebih dari yang bisa ditulis di web ini.",
    surpriseStrong: "Hadiah utamanya: aku akan terus milih kamu, hari ini dan seterusnya. 💙",
    videoTitle: "Video Untukmu",
    videoText: "Simpan video kecil yang paling kamu suka di sini.",
    videoSrc: "",
    videoName: "",
    curhatTitle: "Kalau hati kamu mau cerita 💌",
    curhatPrompt: "Tulis perasaan kamu di sini. Nanti pesannya tersimpan rapi dan cuma bisa aku baca dari dashboard."
};

function $(id) {
    return document.getElementById(id);
}

function getAdminPassword() {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) || "";
}

async function verifyPassword(password) {
    const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
            "x-admin-password": password
        }
    });

    if (!response.ok) {
        const result = await response.json().catch(() => ({ error: "Login gagal." }));
        throw new Error(result.error || "Login gagal.");
    }
}

// TAGLINE: Login dashboard memakai secret ADMIN_PASSWORD dari Cloudflare.
async function loginDashboard(event) {
    event.preventDefault();
    const password = $("loginPassword").value;
    const status = $("loginStatus");

    try {
        status.textContent = "Memeriksa password...";
        await verifyPassword(password);
        sessionStorage.setItem(ADMIN_SESSION_KEY, password);
        document.body.classList.remove("dashboard-locked");
        status.textContent = "";
        await fillForm();
        await loadQuizResults();
        await loadFeelingMessages();
    } catch (error) {
        status.textContent = error.message;
    }
}

function logoutDashboard() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    document.body.classList.add("dashboard-locked");
    $("loginPassword").value = "";
    $("loginStatus").textContent = "Kamu sudah logout.";
}

// TAGLINE: Ambil settings aktif dari D1, dipakai saat dashboard pertama dibuka.
async function getSavedSettings() {
    const response = await fetch(`/api/settings?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
        const result = await response.json().catch(() => ({ error: "API belum aktif." }));
        const detail = result.detail ? ` ${result.detail}` : "";
        throw new Error(`${result.error || "API belum aktif."}${detail}`);
    }

    const data = await response.json();
    return { ...defaultSettings, ...data };
}

function pretty(value) {
    return JSON.stringify(value, null, 2);
}

function lines(value) {
    return value.join("\n");
}

function parseLines(id) {
    return $(id).value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function parseParagraphs(id) {
    return $(id).value.split(/\n\s*\n/).map((line) => line.trim()).filter(Boolean);
}

function parseJson(id) {
    try {
        return JSON.parse($(id).value);
    } catch (error) {
        throw new Error(`Format JSON di bagian "${id}" belum valid.`);
    }
}

function formatPhotoDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${String(date.getDate()).padStart(2, "0")} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function dateFromCompactParts(year, month, day) {
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function extractDateFromText(value) {
    const text = decodeURIComponent(String(value || "")).toLowerCase();
    let match = /(?:img|screenshot|photo|vid|wa|pict)?[-_\s]*(20\d{2})[-_\s]?([01]\d)[-_\s]?([0-3]\d)/i.exec(text);
    if (match) return dateFromCompactParts(match[1], match[2], match[3]);

    match = /([0-3]\d)[-_\s.]([01]\d)[-_\s.](20\d{2})/.exec(text);
    if (match) return dateFromCompactParts(match[3], match[2], match[1]);

    return null;
}

function readString(dataView, offset, length) {
    let value = "";
    for (let index = 0; index < length; index++) {
        const code = dataView.getUint8(offset + index);
        if (code) value += String.fromCharCode(code);
    }
    return value;
}

function parseExifDate(value) {
    const match = /^(\d{4}):(\d{2}):(\d{2})/.exec(String(value || "").trim());
    return match ? dateFromCompactParts(match[1], match[2], match[3]) : null;
}

function readExifDateFromArrayBuffer(buffer) {
    const view = new DataView(buffer);
    if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) return null;

    let offset = 2;
    while (offset + 4 < view.byteLength) {
        if (view.getUint8(offset) !== 0xff) break;

        const marker = view.getUint8(offset + 1);
        const length = view.getUint16(offset + 2, false);
        if (marker === 0xe1 && readString(view, offset + 4, 6) === "Exif\0\0") {
            return readExifDateFromTiff(view, offset + 10);
        }

        offset += 2 + length;
    }

    return null;
}

function readExifDateFromTiff(view, tiffOffset) {
    const endian = readString(view, tiffOffset, 2);
    const littleEndian = endian === "II";
    if (!littleEndian && endian !== "MM") return null;

    const firstIfdOffset = view.getUint32(tiffOffset + 4, littleEndian);
    const tags = readIfdTags(view, tiffOffset, tiffOffset + firstIfdOffset, littleEndian);
    const directDate = tags.get(0x9003) || tags.get(0x9004) || tags.get(0x0132);
    if (directDate) return parseExifDate(directDate);

    const exifOffset = tags.get(0x8769);
    if (!exifOffset) return null;

    const exifTags = readIfdTags(view, tiffOffset, tiffOffset + exifOffset, littleEndian);
    return parseExifDate(exifTags.get(0x9003) || exifTags.get(0x9004) || exifTags.get(0x0132));
}

function readIfdTags(view, tiffOffset, ifdOffset, littleEndian) {
    const tags = new Map();
    if (ifdOffset + 2 > view.byteLength) return tags;

    const entries = view.getUint16(ifdOffset, littleEndian);
    for (let index = 0; index < entries; index++) {
        const entryOffset = ifdOffset + 2 + index * 12;
        if (entryOffset + 12 > view.byteLength) break;

        const tag = view.getUint16(entryOffset, littleEndian);
        const type = view.getUint16(entryOffset + 2, littleEndian);
        const count = view.getUint32(entryOffset + 4, littleEndian);
        const valueOffset = entryOffset + 8;

        if (type === 2) {
            const stringOffset = count <= 4 ? valueOffset : tiffOffset + view.getUint32(valueOffset, littleEndian);
            if (stringOffset > 0 && stringOffset + count <= view.byteLength) {
                tags.set(tag, readString(view, stringOffset, count).trim());
            }
        } else if (type === 4 && count === 1) {
            tags.set(tag, view.getUint32(valueOffset, littleEndian));
        }
    }

    return tags;
}

async function getPhotoDateTitle(file) {
    try {
        const buffer = await file.arrayBuffer();
        const exifDate = readExifDateFromArrayBuffer(buffer);
        if (exifDate) return formatPhotoDate(exifDate);
    } catch (error) {
        // Tidak semua gambar punya EXIF, jadi lanjut ke fallback.
    }

    const filenameDate = extractDateFromText(file.name);
    if (filenameDate) return formatPhotoDate(filenameDate);

    return formatPhotoDate(new Date(file.lastModified || Date.now()));
}

function normalizeMovingGalleryTitle(item) {
    const detectedDate = extractDateFromText(`${item.title || ""} ${item.src || ""}`);
    if (detectedDate) {
        item.title = formatPhotoDate(detectedDate);
    }
    item.caption ||= "";
    return item;
}

function normalizeDateTimeLocalValue(value) {
    const text = String(value || "").trim();
    if (!text) return "";

    let match = /^(\d{4}-\d{2}-\d{2})$/.exec(text);
    if (match) return `${match[1]}T00:00`;

    match = /^(\d{4}-\d{2}-\d{2})[T\s](\d{2}):(\d{2})/.exec(text);
    if (match) return `${match[1]}T${match[2]}:${match[3]}`;

    match = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2})[:.](\d{2}))?$/.exec(text);
    if (match) {
        const day = match[1];
        const month = match[2];
        const year = match[3];
        const hour = match[4] || "00";
        const minute = match[5] || "00";
        return `${year}-${month}-${day}T${hour}:${minute}`;
    }

    return text;
}

// TAGLINE: Isi semua field dashboard dari currentSettings dan render editor GUI.
async function fillForm() {
    let data;
    try {
        data = await getSavedSettings();
    } catch (error) {
        data = structuredClone(defaultSettings);
        const status = $("statusText");
        if (status) {
            status.textContent = `${error.message} Form memakai template awal sampai kamu simpan ke D1.`;
            status.style.color = "#b91c1c";
        }
    }
    currentSettings = structuredClone(data);
    currentSettings.unlockDate = normalizeDateTimeLocalValue(currentSettings.unlockDate || defaultSettings.unlockDate);
    currentSettings.movingGallery = (currentSettings.movingGallery || []).map(normalizeMovingGalleryTitle);
    if (/^pesan untukmu/i.test(String(currentSettings.curhatTitle || "").trim())) {
        currentSettings.curhatTitle = defaultSettings.curhatTitle;
    }
    if (/kalo ada yang mau diungkapin|whatsapp|bot/i.test(String(currentSettings.curhatPrompt || "").trim())) {
        currentSettings.curhatPrompt = defaultSettings.curhatPrompt;
    }

    Object.entries(currentSettings).forEach(([key, value]) => {
        const field = $(key);
        if (!field) return;

        if (Array.isArray(value)) {
            field.value = typeof value[0] === "string" ? lines(value) : pretty(value);
        } else {
            field.value = value;
        }
    });

    if (String(data.videoSrc || "").startsWith("/api/media") || String(data.videoSrc || "").startsWith("data:video/")) {
        $("videoSrc").value = "";
    }

    $("letterParagraphs").value = data.letterParagraphs.join("\n\n");
    updateGallerySpeedLabel();
    renderGuiEditors();
}

// TAGLINE: Kumpulkan seluruh nilai form menjadi payload yang siap disimpan.
function collectSettings() {
    const videoLink = $("videoSrc").value.trim();
    const gallerySpeed = Math.min(2.5, Math.max(0.5, Number($("movingGallerySpeed").value) || 1));

    return {
        unlockDate: normalizeDateTimeLocalValue($("unlockDate").value) || defaultSettings.unlockDate,
        countdownKicker: $("countdownKicker").value.trim(),
        countdownTitle: $("countdownTitle").value.trim(),
        lockedMessage: $("lockedMessage").value.trim(),
        unlockedMessage: $("unlockedMessage").value.trim(),
        heroTitle: $("heroTitle").value.trim(),
        heroMessage: $("heroMessage").value.trim(),
        lockedInstruction: $("lockedInstruction").value.trim(),
        unlockedInstruction: $("unlockedInstruction").value.trim(),
        loveTitle: $("loveTitle").value.trim(),
        reasons: parseLines("reasons"),
        musicSrc: currentSettings.musicSrc || "",
        musicName: currentSettings.musicName || "",
        littleThings: collectLittleThings(),
        polaroids: collectPolaroids(),
        detailedTimeline: collectTimeline(),
        wishes: parseLines("wishes"),
        quiz: collectQuiz(),
        carousel: collectCarousel(),
        movingGallery: collectMovingGallery(),
        movingGallerySpeed: gallerySpeed,
        letterTitle: $("letterTitle").value.trim(),
        letterParagraphs: parseParagraphs("letterParagraphs"),
        surpriseTitle: $("surpriseTitle").value.trim(),
        surpriseText: $("surpriseText").value.trim(),
        surpriseStrong: $("surpriseStrong").value.trim(),
        videoTitle: $("videoTitle").value.trim(),
        videoText: $("videoText").value.trim(),
        videoSrc: videoLink || currentSettings.videoSrc || "",
        videoName: videoLink ? "" : currentSettings.videoName || "",
        curhatTitle: $("curhatTitle").value.trim(),
        curhatPrompt: $("curhatPrompt").value.trim()
    };
}

// TAGLINE: Simpan pengaturan ke D1; media besar sudah berupa URL dari KV.
async function saveSettings() {
    const status = $("statusText");

    try {
        const data = collectSettings();
        const password = getAdminPassword();

        const response = await fetch("/api/settings", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-admin-password": password
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const text = await response.text();
            let message = text;

            try {
                const parsed = JSON.parse(text);
                message = `${parsed.error || text}${parsed.detail ? ` ${parsed.detail}` : ""}`;
            } catch (error) {
                message = text || `HTTP ${response.status}`;
            }

            throw new Error(`API ${response.status}: ${message}`);
        }

        status.textContent = "Tersimpan ke Cloudflare D1. Refresh index.html untuk melihat perubahan.";
        status.style.color = "#047857";
    } catch (error) {
        status.textContent = `${error.message} Perubahan belum disimpan ke Cloudflare.`;
        status.style.color = "#b91c1c";
    }
}

// TAGLINE: Upload media dashboard ke Cloudflare KV agar D1 tetap ringan.
async function uploadMediaToKv(dataUrl, filename, kind) {
    const response = await fetch("/api/media", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-admin-password": getAdminPassword()
        },
        body: JSON.stringify({ dataUrl, filename, kind })
    });

    if (!response.ok) {
        const result = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        const detail = result.detail ? ` ${result.detail}` : "";
        throw new Error(`${result.error || `HTTP ${response.status}`}${detail}`);
    }

    return response.json();
}

function compressImage(file, maxSize = 1400, quality = 0.82) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const image = new Image();

            image.onload = () => {
                const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
                const canvas = document.createElement("canvas");
                canvas.width = Math.round(image.width * scale);
                canvas.height = Math.round(image.height * scale);

                const context = canvas.getContext("2d");
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/jpeg", quality));
            };

            image.onerror = () => reject(new Error("Gambar tidak bisa dibaca."));
            image.src = reader.result;
        };

        reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
        reader.readAsDataURL(file);
    });
}

async function uploadPolaroidImage(event, index) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        $("statusText").textContent = `Mengupload ${file.name} ke Cloudflare KV...`;
        $("statusText").style.color = "#075985";

        const dataUrl = await compressImage(file);
        const media = await uploadMediaToKv(dataUrl, file.name, "polaroid");
        const polaroids = currentSettings.polaroids;

        polaroids[index] = {
            ...(polaroids[index] || { title: `Foto ${index + 1}`, alt: `Foto ${index + 1}`, caption: "" }),
            image: media.src
        };

        renderPolaroidEditor();
        $("statusText").textContent = "Gambar polaroid sudah masuk. Jangan lupa klik Simpan Pengaturan.";
        $("statusText").style.color = "#075985";
    } catch (error) {
        $("statusText").textContent = `${error.message} Gambar belum tersimpan.`;
        $("statusText").style.color = "#b91c1c";
    }
}

async function uploadCarouselImage(event, index) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        $("statusText").textContent = `Mengupload ${file.name} ke Cloudflare KV...`;
        $("statusText").style.color = "#075985";

        const dataUrl = await compressImage(file);
        const media = await uploadMediaToKv(dataUrl, file.name, "carousel");
        const carousel = currentSettings.carousel;

        carousel[index] = {
            ...(carousel[index] || { title: `Foto ${index + 1}`, caption: "" }),
            src: media.src
        };

        renderCarouselEditor();
        $("statusText").textContent = "Gambar carousel sudah masuk. Jangan lupa klik Simpan Pengaturan.";
        $("statusText").style.color = "#075985";
    } catch (error) {
        $("statusText").textContent = `${error.message} Gambar belum tersimpan.`;
        $("statusText").style.color = "#b91c1c";
    }
}

async function uploadMovingGalleryImage(event, index) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        $("statusText").textContent = `Mengupload ${file.name} ke Cloudflare KV...`;
        $("statusText").style.color = "#075985";

        const title = await getPhotoDateTitle(file);
        const dataUrl = await compressImage(file, 1200, 0.78);
        const media = await uploadMediaToKv(dataUrl, file.name, "gallery");
        const gallery = currentSettings.movingGallery;

        gallery[index] = {
            ...(gallery[index] || { title, caption: "" }),
            title,
            src: media.src
        };

        renderMovingGalleryEditor();
        $("statusText").textContent = "Gambar galeri bergerak sudah masuk. Jangan lupa klik Simpan Pengaturan.";
        $("statusText").style.color = "#075985";
    } catch (error) {
        $("statusText").textContent = `${error.message} Gambar belum tersimpan.`;
        $("statusText").style.color = "#b91c1c";
    }
}

async function uploadMovingGalleryImages(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    $("statusText").textContent = `Memproses ${files.length} foto galeri ke Cloudflare KV...`;
    $("statusText").style.color = "#075985";

    let uploaded = 0;
    try {
        for (const file of files) {
            $("statusText").textContent = `Upload ${uploaded + 1}/${files.length}: ${file.name}`;
            const title = await getPhotoDateTitle(file);
            const dataUrl = await compressImage(file, 1100, 0.74);
            const media = await uploadMediaToKv(dataUrl, file.name, "gallery");
            currentSettings.movingGallery.push({
                src: media.src,
                title,
                caption: ""
            });
            uploaded++;
        }
    } catch (error) {
        event.target.value = "";
        renderMovingGalleryEditor();
        $("statusText").textContent = `${uploaded}/${files.length} foto berhasil. Upload berhenti: ${error.message}`;
        $("statusText").style.color = "#b91c1c";
        return;
    }

    event.target.value = "";
    renderMovingGalleryEditor();
    $("statusText").textContent = `${files.length} foto galeri sudah masuk. Jangan lupa klik Simpan Pengaturan.`;
    $("statusText").style.color = "#075985";
}

// TAGLINE: Render semua editor berulang seperti foto, timeline, quiz, dan galeri.
function renderGuiEditors() {
    currentSettings.littleThings ||= [];
    currentSettings.detailedTimeline ||= [];
    currentSettings.polaroids ||= [];
    currentSettings.carousel ||= [];
    currentSettings.movingGallery ||= [];
    currentSettings.quiz ||= [];
    $("musicFileName").textContent = currentSettings.musicName || (currentSettings.musicSrc ? "Musik dashboard tersimpan." : "Belum ada musik upload.");
    $("videoFileName").textContent = currentSettings.videoName || (currentSettings.videoSrc ? "Video dashboard tersimpan." : "Belum ada video upload.");
    renderLittleThingsEditor();
    renderTimelineEditor();
    renderPolaroidEditor();
    renderCarouselEditor();
    renderMovingGalleryEditor();
    renderQuizEditor();
}

function cardShell(title, onRemove) {
    const card = document.createElement("article");
    card.className = "edit-card";
    const head = document.createElement("div");
    head.className = "edit-card-head";
    const heading = document.createElement("h4");
    heading.textContent = title;
    head.appendChild(heading);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "danger-button";
    button.textContent = "Hapus";
    button.onclick = onRemove;
    head.appendChild(button);
    card.appendChild(head);
    return card;
}

function inputField(labelText, value, onInput, multiline = false) {
    const label = document.createElement("label");
    label.textContent = labelText;
    const field = document.createElement(multiline ? "textarea" : "input");
    if (multiline) field.rows = 3;
    field.value = value || "";
    field.oninput = () => onInput(field.value);
    label.appendChild(field);
    return label;
}

function imagePicker(labelText, src, onChange) {
    const label = document.createElement("label");
    label.className = "upload-box compact-upload";
    label.textContent = labelText;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = onChange;
    const img = document.createElement("img");
    if (src) img.src = src;
    label.append(input, img);
    return label;
}

function renderLittleThingsEditor() {
    const target = $("littleThingsEditor");
    target.innerHTML = "";
    currentSettings.littleThings.forEach((item, index) => {
        const card = cardShell(`Item ${index + 1}`, () => {
            currentSettings.littleThings.splice(index, 1);
            renderLittleThingsEditor();
        });
        card.append(inputField("Label", item.label, (value) => item.label = value), inputField("Isi", item.value, (value) => item.value = value, true));
        target.appendChild(card);
    });
}

function renderTimelineEditor() {
    const target = $("timelineEditor");
    target.innerHTML = "";
    currentSettings.detailedTimeline.forEach((item, index) => {
        const card = cardShell(`Timeline ${index + 1}`, () => {
            currentSettings.detailedTimeline.splice(index, 1);
            renderTimelineEditor();
        });
        card.append(inputField("Judul", item.title, (value) => item.title = value), inputField("Tanggal", item.date, (value) => item.date = value), inputField("Cerita", item.text, (value) => item.text = value, true));
        target.appendChild(card);
    });
}

function renderPolaroidEditor() {
    const target = $("polaroidEditor");
    target.innerHTML = "";
    currentSettings.polaroids.forEach((item, index) => {
        const card = cardShell(`Polaroid ${index + 1}`, () => {
            currentSettings.polaroids.splice(index, 1);
            renderPolaroidEditor();
        });
        card.append(imagePicker("Upload foto", item.image, (event) => uploadPolaroidImage(event, index)), inputField("Judul", item.title, (value) => item.title = value), inputField("Alt foto", item.alt, (value) => item.alt = value), inputField("Caption", item.caption, (value) => item.caption = value, true));
        target.appendChild(card);
    });
}

function renderCarouselEditor() {
    const target = $("carouselEditor");
    target.innerHTML = "";
    currentSettings.carousel.forEach((item, index) => {
        const card = cardShell(`Carousel ${index + 1}`, () => {
            currentSettings.carousel.splice(index, 1);
            renderCarouselEditor();
        });
        card.append(imagePicker("Upload foto", item.src, (event) => uploadCarouselImage(event, index)), inputField("Judul", item.title, (value) => item.title = value), inputField("Caption", item.caption, (value) => item.caption = value, true));
        target.appendChild(card);
    });
}

function renderMovingGalleryEditor() {
    const target = $("movingGalleryEditor");
    target.innerHTML = "";
    target.classList.add("gallery-strip-editor");

    if (!currentSettings.movingGallery.length) {
        const empty = document.createElement("div");
        empty.className = "empty-gallery-state";
        empty.textContent = "Belum ada foto galeri. Klik Upload banyak untuk menambahkan beberapa foto sekaligus.";
        target.appendChild(empty);
        return;
    }

    currentSettings.movingGallery.forEach((item, index) => {
        const card = document.createElement("article");
        card.className = "gallery-thumb-card";

        const imageLabel = imagePicker("Ganti foto", item.src, (event) => uploadMovingGalleryImage(event, index));
        imageLabel.classList.add("gallery-thumb-picker");

        const meta = document.createElement("div");
        meta.className = "gallery-thumb-meta";
        meta.append(
            inputField("Tanggal foto", item.title, (value) => item.title = value),
            inputField("Caption", item.caption, (value) => item.caption = value, true)
        );

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "danger-button icon-danger";
        remove.textContent = "Hapus";
        remove.onclick = () => {
            currentSettings.movingGallery.splice(index, 1);
            renderMovingGalleryEditor();
        };

        card.append(imageLabel, meta, remove);
        target.appendChild(card);
    });
}

function updateGallerySpeedLabel() {
    const field = $("movingGallerySpeed");
    const label = $("movingGallerySpeedLabel");
    if (!field || !label) return;

    const value = Math.min(2.5, Math.max(0.5, Number(field.value) || 1));
    field.value = String(value);

    if (value < 0.85) {
        label.textContent = `Pelan ${value.toFixed(1)}x`;
    } else if (value > 1.15) {
        label.textContent = `Cepat ${value.toFixed(1)}x`;
    } else {
        label.textContent = "Normal 1.0x";
    }
}

function renderQuizEditor() {
    const target = $("quizEditor");
    target.innerHTML = "";
    currentSettings.quiz.forEach((item, index) => {
        item.options ||= ["", "", ""];
        const card = cardShell(`Pertanyaan ${index + 1}`, () => {
            currentSettings.quiz.splice(index, 1);
            renderQuizEditor();
        });
        delete item.answer;
        card.append(
            inputField("Pertanyaan", item.question, (value) => item.question = value, true),
            inputField("Pilihan A", item.options[0], (value) => item.options[0] = value),
            inputField("Pilihan B", item.options[1], (value) => item.options[1] = value),
            inputField("Pilihan C", item.options[2], (value) => item.options[2] = value)
        );
        target.appendChild(card);
    });
}

function collectLittleThings() { return currentSettings.littleThings; }
function collectTimeline() { return currentSettings.detailedTimeline; }
function collectPolaroids() { return currentSettings.polaroids; }
function collectCarousel() { return currentSettings.carousel; }
function collectMovingGallery() { return currentSettings.movingGallery; }
function collectQuiz() {
    return currentSettings.quiz.map((item) => ({
        question: item.question || "",
        options: (item.options || []).slice(0, 3)
    }));
}

function addLittleThing() {
    currentSettings.littleThings.push({ label: "Label baru", value: "Isi baru" });
    renderLittleThingsEditor();
}

function addTimelineItem() {
    currentSettings.detailedTimeline.push({ title: "Momen baru", text: "Tulis ceritanya di sini.", date: "Tanggal" });
    renderTimelineEditor();
}

function addPolaroid() {
    currentSettings.polaroids.push({ image: "", title: "Foto baru", alt: "Foto baru", caption: "Tulis caption foto." });
    renderPolaroidEditor();
}

function addCarouselItem() {
    currentSettings.carousel.push({ src: "", title: "Foto baru", caption: "Tulis caption foto." });
    renderCarouselEditor();
}

function addMovingGalleryItem() {
    currentSettings.movingGallery.push({ src: "", title: "Foto baru", caption: "Tulis caption foto." });
    renderMovingGalleryEditor();
}

function addQuizItem() {
    currentSettings.quiz.push({ question: "Pertanyaan baru?", options: ["Pilihan A", "Pilihan B", "Pilihan C"] });
    renderQuizEditor();
}

function formatMonitorDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Waktu tidak terbaca";

    return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date);
}

function formatDuration(ms) {
    const totalSeconds = Math.max(0, Math.round((Number(ms) || 0) / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes <= 0) return `${seconds} detik`;
    return `${minutes} menit ${seconds} detik`;
}

function createTextElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
}

function renderMonitorSummary(results) {
    const target = $("quizMonitorSummary");
    if (!target) return;

    target.innerHTML = "";
    const totalSessions = results.length;
    const totalAnswers = results.reduce((sum, item) => sum + ((item.answers || []).length || Number(item.score) || 0), 0);
    const averageReasonLength = totalAnswers
        ? Math.round(results.reduce((sum, item) => sum + (item.answers || []).reduce((answerSum, answer) => answerSum + String(answer.reason || "").length, 0), 0) / totalAnswers)
        : 0;
    const averageDuration = totalSessions
        ? Math.round(results.reduce((sum, item) => sum + (Number(item.durationMs) || 0), 0) / totalSessions)
        : 0;
    const latestSession = results[0]?.createdAt ? formatMonitorDate(results[0].createdAt) : "-";

    [
        ["Sesi masuk", String(totalSessions)],
        ["Total jawaban", String(totalAnswers)],
        ["Rata-rata alasan", `${averageReasonLength} huruf`],
        ["Terbaru", latestSession],
        ["Rata-rata waktu", formatDuration(averageDuration)]
    ].forEach(([label, value]) => {
        const card = document.createElement("article");
        card.className = "monitor-stat";
        card.append(createTextElement("span", "", label), createTextElement("strong", "", value));
        target.appendChild(card);
    });
}

function renderQuizResults(results) {
    renderMonitorSummary(results);

    const target = $("quizResultsMonitor");
    if (!target) return;
    target.innerHTML = "";

    if (!results.length) {
        target.appendChild(createTextElement("p", "empty-monitor", "Belum ada data quiz yang masuk."));
        return;
    }

    results.forEach((result, resultIndex) => {
        const card = document.createElement("article");
        card.className = "quiz-result-card";

        const head = document.createElement("div");
        head.className = "quiz-result-head";
        const titleBlock = document.createElement("div");
        titleBlock.append(
            createTextElement("h3", "", `Sesi ${resultIndex + 1}`),
            createTextElement("p", "", formatMonitorDate(result.createdAt))
        );
        const answerCount = (result.answers || []).length || result.score || 0;
        const score = createTextElement("strong", "quiz-score-badge", `${answerCount}/${result.total} jawaban`);
        head.append(titleBlock, score);

        const meta = document.createElement("div");
        meta.className = "quiz-result-meta";
        meta.append(
            createTextElement("span", "", `Durasi: ${formatDuration(result.durationMs)}`),
            createTextElement("span", "", `Session: ${String(result.sessionId || "").slice(0, 12)}`),
            createTextElement("span", "", result.userAgent ? "Device terbaca" : "Device kosong")
        );

        const answers = document.createElement("div");
        answers.className = "quiz-answer-list";
        (result.answers || []).forEach((answer, answerIndex) => {
            const row = document.createElement("div");
            row.className = "quiz-answer-row is-open-answer";

            const question = createTextElement("p", "quiz-answer-question", `${answerIndex + 1}. ${answer.question || "Pertanyaan kosong"}`);
            const selected = createTextElement("span", "", `Jawaban dia: ${answer.selectedLetter ? `${answer.selectedLetter}. ` : ""}${answer.selectedOption || "-"}`);
            const reason = createTextElement("p", "quiz-answer-reason", `Alasan: ${answer.reason || "Belum ada alasan tersimpan."}`);
            row.append(question, selected, reason);
            answers.appendChild(row);
        });

        card.append(head, meta, answers);
        target.appendChild(card);
    });
}

// TAGLINE: Monitoring jawaban quiz yang dikirim dari halaman publik.
async function loadQuizResults() {
    const target = $("quizResultsMonitor");
    const password = getAdminPassword();
    if (!target || !password) return;

    try {
        target.innerHTML = "";
        target.appendChild(createTextElement("p", "empty-monitor", "Mengambil data monitoring..."));

        const response = await fetch(`/api/quiz-results?t=${Date.now()}`, {
            headers: {
                "x-admin-password": password
            },
            cache: "no-store"
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({ error: "Gagal membaca monitoring quiz." }));
            throw new Error(`${result.error || "Gagal membaca monitoring quiz."}${result.detail ? ` ${result.detail}` : ""}`);
        }

        const data = await response.json();
        renderQuizResults(Array.isArray(data.results) ? data.results : []);
    } catch (error) {
        renderMonitorSummary([]);
        target.innerHTML = "";
        target.appendChild(createTextElement("p", "empty-monitor error-monitor", error.message));
    }
}

function renderFeelingMessages(messages) {
    const target = $("feelingMessagesMonitor");
    if (!target) return;

    target.innerHTML = "";
    if (!messages.length) {
        target.appendChild(createTextElement("p", "empty-monitor", "Belum ada pesan perasaan yang masuk."));
        return;
    }

    messages.forEach((item, index) => {
        const card = document.createElement("article");
        card.className = "feeling-message-card";

        const head = document.createElement("div");
        head.className = "feeling-message-head";
        head.append(
            createTextElement("h3", "", `Pesan ${index + 1}`),
            createTextElement("span", "", formatMonitorDate(item.createdAt))
        );

        const text = createTextElement("p", "feeling-message-text", item.message || "-");
        const meta = document.createElement("div");
        meta.className = "quiz-result-meta";
        meta.append(
            createTextElement("span", "", "Tersimpan di D1"),
            createTextElement("span", "", item.userAgent ? "Device terbaca" : "Device kosong")
        );

        card.append(head, text, meta);
        target.appendChild(card);
    });
}

// TAGLINE: Monitoring pesan perasaan yang tersimpan di D1.
async function loadFeelingMessages() {
    const target = $("feelingMessagesMonitor");
    const password = getAdminPassword();
    if (!target || !password) return;

    try {
        target.innerHTML = "";
        target.appendChild(createTextElement("p", "empty-monitor", "Mengambil pesan perasaan..."));

        const response = await fetch(`/api/feelings?t=${Date.now()}`, {
            headers: {
                "x-admin-password": password
            },
            cache: "no-store"
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({ error: "Gagal membaca pesan perasaan." }));
            throw new Error(`${result.error || "Gagal membaca pesan perasaan."}${result.detail ? ` ${result.detail}` : ""}`);
        }

        const data = await response.json();
        renderFeelingMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (error) {
        target.innerHTML = "";
        target.appendChild(createTextElement("p", "empty-monitor error-monitor", error.message));
    }
}

function uploadMusic(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
        $("statusText").textContent = "File musik terlalu besar. Pakai audio pendek di bawah 8 MB agar aman disimpan.";
        $("statusText").style.color = "#b91c1c";
        return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
        try {
            $("statusText").textContent = `Mengupload ${file.name} ke Cloudflare KV...`;
            $("statusText").style.color = "#075985";
            const media = await uploadMediaToKv(reader.result, file.name, "music");
            currentSettings.musicSrc = media.src;
            currentSettings.musicName = file.name;
            $("musicFileName").textContent = file.name;
            $("statusText").textContent = "Musik sudah masuk ke KV. Jangan lupa klik Simpan Pengaturan.";
            $("statusText").style.color = "#075985";
        } catch (error) {
            $("statusText").textContent = `${error.message} Musik belum tersimpan.`;
            $("statusText").style.color = "#b91c1c";
        }
    };
    reader.readAsDataURL(file);
}

function uploadVideo(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
        $("statusText").textContent = "File video terlalu besar. Pakai video pendek di bawah 8 MB, atau tempel link YouTube/MP4 saja.";
        $("statusText").style.color = "#b91c1c";
        event.target.value = "";
        return;
    }

    if (!file.type.startsWith("video/")) {
        $("statusText").textContent = "File yang dipilih bukan video. Pilih MP4, WebM, atau OGG.";
        $("statusText").style.color = "#b91c1c";
        event.target.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
        try {
            $("statusText").textContent = `Mengupload ${file.name} ke Cloudflare KV...`;
            $("statusText").style.color = "#075985";
            const media = await uploadMediaToKv(reader.result, file.name, "video");
            currentSettings.videoSrc = media.src;
            currentSettings.videoName = file.name;
            $("videoSrc").value = "";
            $("videoFileName").textContent = file.name;
            $("statusText").textContent = "Video sudah masuk ke KV. Jangan lupa klik Simpan Pengaturan.";
            $("statusText").style.color = "#075985";
        } catch (error) {
            $("statusText").textContent = `${error.message} Video belum tersimpan.`;
            $("statusText").style.color = "#b91c1c";
        } finally {
            event.target.value = "";
        }
    };
    reader.onerror = () => {
        $("statusText").textContent = "Gagal membaca file video.";
        $("statusText").style.color = "#b91c1c";
        event.target.value = "";
    };
    reader.readAsDataURL(file);
}

function resetSettings() {
    const ok = confirm("Reset semua pengaturan dashboard ke bawaan?");
    if (!ok) return;

    localStorage.removeItem(SETTINGS_KEY);
    fillForm();
    $("statusText").textContent = "Pengaturan dikembalikan ke bawaan.";
    $("statusText").style.color = "#075985";
}

if (getAdminPassword()) {
    verifyPassword(getAdminPassword())
        .then(() => {
            document.body.classList.remove("dashboard-locked");
            return fillForm();
        })
        .then(async () => {
            await loadQuizResults();
            await loadFeelingMessages();
        })
        .catch(() => {
            sessionStorage.removeItem(ADMIN_SESSION_KEY);
            document.body.classList.add("dashboard-locked");
        });
}
