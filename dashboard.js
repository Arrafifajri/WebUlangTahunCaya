const SETTINGS_KEY = "cayaBirthdaySettings";

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
    playlist: [
        { title: "Lagu waktu kangen", text: "Ganti judul ini dengan lagu yang paling sering ngingetin kamu sama dia.", link: "https://open.spotify.com" },
        { title: "Lagu perjalanan", text: "Cocok buat lagu yang pernah kalian dengar bareng di jalan.", link: "https://www.youtube.com" },
        { title: "Lagu ulang tahun", text: "Simpan lagu paling manis buat penutup hari spesialnya.", link: "https://open.spotify.com" }
    ],
    memoryMap: [
        { title: "Tempat pertama ketemu", text: "Tulis tempatnya di sini, biar jadi penanda awal cerita." },
        { title: "Tempat first date", text: "Tempat yang bikin deg-degan tapi sekarang jadi kenangan lucu." },
        { title: "Tempat makan favorit", text: "Tempat sederhana yang rasanya jadi spesial karena bareng kamu." }
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

function getLocalSettings() {
    try {
        return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) };
    } catch (error) {
        return defaultSettings;
    }
}

async function getSavedSettings() {
    try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        if (!response.ok) throw new Error("API belum aktif");

        const data = await response.json();
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
        return { ...defaultSettings, ...data };
    } catch (error) {
        return getLocalSettings();
    }
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
    const data = await getSavedSettings();

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
        littleThings: parseJson("littleThings"),
        polaroids: parseJson("polaroids"),
        detailedTimeline: parseJson("detailedTimeline"),
        wishes: parseLines("wishes"),
        playlist: parseJson("playlist"),
        memoryMap: parseJson("memoryMap"),
        quiz: parseJson("quiz"),
        carousel: parseJson("carousel"),
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
        const password = $("adminPassword").value;

        const response = await fetch("/api/settings", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-admin-password": password
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({ error: "Gagal menyimpan ke API." }));
            throw new Error(result.error || "Gagal menyimpan ke API.");
        }

        localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
        status.textContent = "Tersimpan ke Cloudflare KV. Refresh index.html untuk melihat perubahan.";
        status.style.color = "#047857";
    } catch (error) {
        status.textContent = `${error.message} Perubahan belum disimpan ke Cloudflare.`;
        status.style.color = "#b91c1c";
    }
}

function resetSettings() {
    const ok = confirm("Reset semua pengaturan dashboard ke bawaan?");
    if (!ok) return;

    localStorage.removeItem(SETTINGS_KEY);
    fillForm();
    $("statusText").textContent = "Pengaturan dikembalikan ke bawaan.";
    $("statusText").style.color = "#075985";
}

fillForm();
