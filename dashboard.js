const SETTINGS_KEY = "cayaBirthdaySettings";
const ADMIN_SESSION_KEY = "cayaDashboardPassword";
let currentSettings;

const defaultSettings = {
    unlockDate: "2026-05-06",
    countdownKicker: "Menuju 06 Mei",
    countdownTitle: "Countdown Ulang Tahunmu 🎂",
    lockedMessage: "Isi web ini akan terbuka otomatis pada 06 Mei.",
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
        { question: "Apa hadiah paling manis dari hubungan ini?", options: ["Saling punya rumah pulang", "Menang debat", "Jarang chat"], answer: 0 },
        { question: "Kalau lagi kangen, yang paling cocok dilakukan apa?", options: ["Ngambek diam-diam", "Bilang baik-baik", "Hilang tanpa kabar"], answer: 1 },
        { question: "Berapa persen sayang yang bisa dihitung sistem?", options: ["100%", "999999%", "Cuma sedikit"], answer: 1 }
    ],
    carousel: [
        { src: "awal_kenal.jpg", title: "Awal Kenal", caption: "Momen pertama yang jadi awal semua cerita." },
        { src: "jadian.jpg", title: "Jadian", caption: "Hari yang bikin cerita ini terasa lebih serius dan hangat." },
        { src: "foto_favorit.jpg", title: "Foto Favorit", caption: "Ganti file ini dengan foto favorit kalian berdua." }
    ],
    movingGallery: [],
    letterTitle: "Surat Untukmu 💙",
    letterParagraphs: [
        "Selamat ulang tahun, sayang. Semoga umur barumu selalu dipenuhi hal-hal baik, langkah yang dimudahkan, hati yang dikuatkan, dan mimpi-mimpi yang pelan-pelan jadi nyata.",
        "Terima kasih sudah hadir dan jadi bagian paling hangat dalam hari-hariku. Aku sayang kamu, bukan cuma di hari spesial ini, tapi di hari biasa, hari capek, hari lucu, dan hari-hari kecil yang sering lewat diam-diam.",
        "Semoga kamu selalu ingat: kamu berharga, kamu dicintai, dan aku bangga punya kamu."
    ],
    surpriseTitle: "Happy Birthday, Sayang 🎂",
    surpriseText: "Semoga hari ini jadi salah satu hari yang kamu inget dengan senyum. Aku sayang kamu lebih dari yang bisa ditulis di web ini.",
    surpriseStrong: "Hadiah utamanya: aku akan terus milih kamu, hari ini dan seterusnya. 💙",
    curhatTitle: "Pesan Untukmu 💌",
    curhatPrompt: "Kalo ada yang mau diungkapin, tulis di bawah ya sayang..."
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

async function getSavedSettings() {
    const response = await fetch(`/api/settings?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
        const result = await response.json().catch(() => ({ error: "API belum aktif." }));
        throw new Error(result.error || "API belum aktif.");
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

    Object.entries(data).forEach(([key, value]) => {
        const field = $(key);
        if (!field) return;

        if (Array.isArray(value)) {
            field.value = typeof value[0] === "string" ? lines(value) : pretty(value);
        } else {
            field.value = value;
        }
    });

    $("letterParagraphs").value = data.letterParagraphs.join("\n\n");
    renderGuiEditors();
}

function collectSettings() {
    return {
        unlockDate: $("unlockDate").value || defaultSettings.unlockDate,
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
        letterTitle: $("letterTitle").value.trim(),
        letterParagraphs: parseParagraphs("letterParagraphs"),
        surpriseTitle: $("surpriseTitle").value.trim(),
        surpriseText: $("surpriseText").value.trim(),
        surpriseStrong: $("surpriseStrong").value.trim(),
        curhatTitle: $("curhatTitle").value.trim(),
        curhatPrompt: $("curhatPrompt").value.trim()
    };
}

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
                message = JSON.parse(text).error || text;
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

    const dataUrl = await compressImage(file);
    const polaroids = currentSettings.polaroids;

    polaroids[index] = {
        ...(polaroids[index] || { title: `Foto ${index + 1}`, alt: `Foto ${index + 1}`, caption: "" }),
        image: dataUrl
    };

    renderPolaroidEditor();
    $("statusText").textContent = "Gambar polaroid sudah masuk. Jangan lupa klik Simpan Pengaturan.";
    $("statusText").style.color = "#075985";
}

async function uploadCarouselImage(event, index) {
    const file = event.target.files[0];
    if (!file) return;

    const dataUrl = await compressImage(file);
    const carousel = currentSettings.carousel;

    carousel[index] = {
        ...(carousel[index] || { title: `Foto ${index + 1}`, caption: "" }),
        src: dataUrl
    };

    renderCarouselEditor();
    $("statusText").textContent = "Gambar carousel sudah masuk. Jangan lupa klik Simpan Pengaturan.";
    $("statusText").style.color = "#075985";
}

async function uploadMovingGalleryImage(event, index) {
    const file = event.target.files[0];
    if (!file) return;

    const dataUrl = await compressImage(file);
    const gallery = currentSettings.movingGallery;

    gallery[index] = {
        ...(gallery[index] || { title: `Foto ${index + 1}`, caption: "" }),
        src: dataUrl
    };

    renderMovingGalleryEditor();
    $("statusText").textContent = "Gambar galeri bergerak sudah masuk. Jangan lupa klik Simpan Pengaturan.";
    $("statusText").style.color = "#075985";
}

function renderGuiEditors() {
    currentSettings.littleThings ||= [];
    currentSettings.detailedTimeline ||= [];
    currentSettings.polaroids ||= [];
    currentSettings.carousel ||= [];
    currentSettings.movingGallery ||= [];
    currentSettings.quiz ||= [];
    $("musicFileName").textContent = currentSettings.musicName || (currentSettings.musicSrc ? "Musik dashboard tersimpan." : "Belum ada musik upload.");
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
    head.innerHTML = `<h4>${title}</h4>`;
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
    currentSettings.movingGallery.forEach((item, index) => {
        const card = cardShell(`Galeri ${index + 1}`, () => {
            currentSettings.movingGallery.splice(index, 1);
            renderMovingGalleryEditor();
        });
        card.append(imagePicker("Upload foto", item.src, (event) => uploadMovingGalleryImage(event, index)), inputField("Judul", item.title, (value) => item.title = value), inputField("Caption", item.caption, (value) => item.caption = value, true));
        target.appendChild(card);
    });
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
        card.append(inputField("Pertanyaan", item.question, (value) => item.question = value, true), inputField("Pilihan 1", item.options[0], (value) => item.options[0] = value), inputField("Pilihan 2", item.options[1], (value) => item.options[1] = value), inputField("Pilihan 3", item.options[2], (value) => item.options[2] = value), inputField("Jawaban benar (1/2/3)", String((item.answer || 0) + 1), (value) => item.answer = Math.max(0, Math.min(2, Number(value) - 1 || 0))));
        target.appendChild(card);
    });
}

function collectLittleThings() { return currentSettings.littleThings; }
function collectTimeline() { return currentSettings.detailedTimeline; }
function collectPolaroids() { return currentSettings.polaroids; }
function collectCarousel() { return currentSettings.carousel; }
function collectMovingGallery() { return currentSettings.movingGallery; }
function collectQuiz() { return currentSettings.quiz; }

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
    currentSettings.quiz.push({ question: "Pertanyaan baru?", options: ["Pilihan 1", "Pilihan 2", "Pilihan 3"], answer: 0 });
    renderQuizEditor();
}

function uploadMusic(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
        $("statusText").textContent = "File musik terlalu besar. Pakai audio pendek di bawah 4 MB agar aman disimpan.";
        $("statusText").style.color = "#b91c1c";
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        currentSettings.musicSrc = reader.result;
        currentSettings.musicName = file.name;
        $("musicFileName").textContent = file.name;
        $("statusText").textContent = "Musik sudah masuk. Jangan lupa klik Simpan Pengaturan.";
        $("statusText").style.color = "#075985";
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
        .catch(() => {
            sessionStorage.removeItem(ADMIN_SESSION_KEY);
            document.body.classList.add("dashboard-locked");
        });
}
