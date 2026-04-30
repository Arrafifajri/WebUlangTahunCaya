const SETTINGS_KEY = "cayaBirthdaySettings";
const SETTINGS_VERSION_KEY = "cayaBirthdaySettingsVersion";
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
    polaroids: [
        {
            image: "awal_kenal.jpg",
            title: "Maret 2023",
            alt: "Awal Kenal",
            caption: "Waktu pertama kali kita ngobrol. Langit hari itu rasanya cerah banget, persis perasaan aku."
        },
        {
            image: "jadian.jpg",
            title: "Agustus 2023",
            alt: "Jadian",
            caption: "Hari paling bersejarah! Akhirnya kamu nerima aku jadi bagian dari hidupmu."
        }
    ],
    detailedTimeline: [
        {
            title: "First Date 🎬",
            text: "Nonton bioskop bareng pertama kali. Masih malu-malu banget, deg-degan parah rasanya pengen waktu berhenti aja.",
            date: "September 2023"
        },
        {
            title: "Kehujanan Bareng 🌧️",
            text: "Lagi asik motoran eh hujan deres. Neduh di pinggir jalan sambil minum kopi anget, momen sederhana tapi berbekas banget.",
            date: "November 2023"
        },
        {
            title: "Tahun Baru Pertama 🎆",
            text: "Lewatin pergantian tahun berdua. Liat kembang api sambil janji bakal terus bareng-bareng di tahun-tahun berikutnya.",
            date: "Desember 2023"
        }
    ],
    littleThings: [
        { label: "Lagu favorit", value: "Tulis lagu favoritmu di sini" },
        { label: "Makanan favorit", value: "Tulis makanan favoritmu di sini" },
        { label: "Kebiasaan lucu", value: "Tulis kebiasaan kecil yang paling kamu inget" },
        { label: "Hal yang aku kagumi", value: "Cara kamu tetap kuat dan baik hati" }
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

function mergeSettings(base, saved) {
    return { ...base, ...(saved || {}) };
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadSettings() {
    try {
        return mergeSettings(defaultSettings, JSON.parse(localStorage.getItem(SETTINGS_KEY)));
    } catch (error) {
        return defaultSettings;
    }
}

let settings = loadSettings();

async function loadRemoteSettings() {
    // Retry singkat untuk perangkat yang koneksi mobile-nya tidak stabil.
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const response = await fetch(`/api/settings?t=${Date.now()}`, { cache: "no-store" });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const remoteSettings = await response.json();
            settings = mergeSettings(defaultSettings, remoteSettings);
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            return;
        } catch (error) {
            if (attempt === 3) {
                settings = loadSettings();
                return;
            }
            await sleep(300 * attempt);
        }
    }
}

async function syncSettingsVersion() {
    try {
        const response = await fetch(`/api/version?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        const remoteVersion = String(data?.version || "");
        if (!remoteVersion) return;

        const localVersion = localStorage.getItem(SETTINGS_VERSION_KEY) || "";
        if (localVersion !== remoteVersion) {
            localStorage.removeItem(SETTINGS_KEY);
            localStorage.setItem(SETTINGS_VERSION_KEY, remoteVersion);
        }
    } catch (error) {
        // Abaikan error versi, app tetap jalan pakai flow biasa.
    }
}

const music = document.getElementById("birthdayMusic");
const envelope = document.querySelector(".envelope-wrapper");
const clickInstruction = document.querySelector(".click-instruction");
const musicSource = music ? music.querySelector("source") : null;
let wishes = settings.wishes;
let quizQuestions = settings.quiz;
let carouselPhotos = settings.carousel;
let currentQuizIndex = 0;
let quizScore = 0;
let carouselIndex = 0;

if (window.AOS) {
    AOS.init({
        duration: 900,
        once: true
    });
}

function padNumber(value) {
    return String(value).padStart(2, "0");
}

function getUnlockDate() {
    const raw = String(settings.unlockDate || "").trim();

    // Format utama dashboard: YYYY-MM-DD
    let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (match) {
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        return new Date(year, month - 1, day, 0, 0, 0, 0);
    }

    // Fallback jika ada format DD/MM/YYYY dari input manual
    match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
    if (match) {
        const day = Number(match[1]);
        const month = Number(match[2]);
        const year = Number(match[3]);
        return new Date(year, month - 1, day, 0, 0, 0, 0);
    }

    return new Date(2026, 4, 6, 0, 0, 0, 0);
}

function isBirthdayUnlocked() {
    return new Date() >= getUnlockDate();
}

function updateCountdown() {
    const now = new Date();
    const target = getUnlockDate();
    const distance = target - now;
    const message = document.getElementById("countdownMessage");

    if (distance <= 0) {
        document.getElementById("days").textContent = "00";
        document.getElementById("hours").textContent = "00";
        document.getElementById("minutes").textContent = "00";
        document.getElementById("seconds").textContent = "00";
        message.textContent = settings.unlockedMessage;
        unlockEnvelope();
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((distance / (1000 * 60)) % 60);
    const seconds = Math.floor((distance / 1000) % 60);

    document.getElementById("days").textContent = padNumber(days);
    document.getElementById("hours").textContent = padNumber(hours);
    document.getElementById("minutes").textContent = padNumber(minutes);
    document.getElementById("seconds").textContent = padNumber(seconds);
    message.textContent = settings.lockedMessage;
    lockEnvelope();
}

function lockEnvelope() {
    document.body.classList.add("content-locked");
    document.body.classList.add("locked");
    envelope.classList.add("is-waiting");
    clickInstruction.textContent = settings.lockedInstruction;
}

function unlockEnvelope() {
    document.body.classList.remove("content-locked");
    document.body.classList.remove("locked");
    envelope.classList.remove("is-waiting");
    clickInstruction.textContent = settings.unlockedInstruction;
}

function setText(selector, text) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = text;
    }
}

function renderReasons() {
    const grid = document.querySelector(".reason-grid");
    if (!grid) return;
    grid.innerHTML = "";
    settings.reasons.forEach((reason) => {
        const card = document.createElement("div");
        card.className = "reason-card";
        card.textContent = reason;
        grid.appendChild(card);
    });
}

function renderPolaroids() {
    const wrapper = document.querySelector(".polaroid-wrapper");
    if (!wrapper) return;
    wrapper.innerHTML = "";

    settings.polaroids.forEach((item, index) => {
        const outer = document.createElement("div");
        outer.className = "polaroid-item";
        outer.setAttribute("data-aos", "fade-down");
        outer.setAttribute("data-aos-delay", String(100 + index * 200));

        const button = document.createElement("button");
        button.className = `polaroid ${index % 2 === 0 ? "swinging" : "swinging-reverse"}`;
        button.type = "button";
        button.onclick = () => openLightbox(item.image, item.alt || item.title, `${item.title} - ${item.caption}`);

        const pin = document.createElement("div");
        pin.className = "pin";

        const image = document.createElement("img");
        image.src = item.image;
        image.alt = item.alt || item.title;
        image.onerror = () => showPhotoFallback(image);

        const caption = document.createElement("div");
        caption.className = "caption";
        caption.innerHTML = `<h3>${item.title}</h3><p>${item.caption}</p>`;

        button.append(pin, image, caption);
        outer.appendChild(button);
        wrapper.appendChild(outer);
    });
}

function renderDetailedTimeline() {
    const container = document.querySelector(".timeline-container");
    if (!container) return;
    container.innerHTML = "";

    settings.detailedTimeline.forEach((item, index) => {
        const block = document.createElement("div");
        block.className = "timeline-block";
        block.setAttribute("data-aos", index % 2 === 0 ? "fade-right" : "fade-left");
        block.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <h3>${item.title}</h3>
                <p>${item.text}</p>
                <span class="timeline-date">${item.date}</span>
            </div>
        `;
        container.appendChild(block);
    });
}

function renderLittleThings() {
    const grid = document.querySelector(".memory-grid");
    if (!grid) return;
    grid.innerHTML = "";

    settings.littleThings.forEach((item) => {
        const card = document.createElement("article");
        card.className = "memory-card";
        card.innerHTML = `<span>${item.label}</span><strong>${item.value}</strong>`;
        grid.appendChild(card);
    });
}

function renderPlaylist() {
    const list = document.querySelector(".playlist-list");
    if (!list) return;
    list.innerHTML = "";

    settings.playlist.forEach((song, index) => {
        const card = document.createElement("article");
        card.className = "song-card";
        card.innerHTML = `
            <span>${padNumber(index + 1)}</span>
            <div>
                <h3>${song.title}</h3>
                <p>${song.text}</p>
            </div>
            <a href="${song.link}" target="_blank" rel="noreferrer">Buka</a>
        `;
        list.appendChild(card);
    });
}

function renderMemoryMap() {
    const board = document.querySelector(".map-board");
    if (!board) return;
    board.innerHTML = "";

    settings.memoryMap.forEach((place, index) => {
        const card = document.createElement("article");
        card.className = "map-pin";
        card.innerHTML = `<span>${padNumber(index + 1)}</span><h3>${place.title}</h3><p>${place.text}</p>`;
        board.appendChild(card);
    });
}

function renderLetterAndSurprise() {
    const letter = document.querySelector(".long-letter");
    if (letter) {
        const closeButton = letter.querySelector(".modal-close");
        letter.innerHTML = "";
        if (closeButton) {
            letter.appendChild(closeButton);
        }
        const title = document.createElement("h2");
        title.textContent = settings.letterTitle;
        letter.appendChild(title);
        settings.letterParagraphs.forEach((paragraph) => {
            const p = document.createElement("p");
            p.textContent = paragraph;
            letter.appendChild(p);
        });
    }

    setText(".surprise-modal h2", settings.surpriseTitle);
    setText(".surprise-modal p", settings.surpriseText);
    setText(".surprise-modal strong", settings.surpriseStrong);
    setText(".curhat-section h2", settings.curhatTitle);
    setText(".curhat-section > p", settings.curhatPrompt);
}

function applySettings() {
    setText(".gate-countdown .section-kicker", settings.countdownKicker);
    setText(".gate-countdown h2", settings.countdownTitle);
    setText(".letter h1", settings.heroTitle);
    setText(".letter p", settings.heroMessage);
    setText(".love-reasons h2", settings.loveTitle);
    if (music) {
        const selectedSrc = settings.musicSrc && settings.musicSrc.trim() ? settings.musicSrc : "musik.mp3";
        if (musicSource) {
            musicSource.src = selectedSrc;
        } else {
            music.src = selectedSrc;
        }
        music.loop = true;
        music.preload = "auto";
        music.load();
    }
    renderReasons();
    renderPolaroids();
    renderDetailedTimeline();
    renderLittleThings();
    renderPlaylist();
    renderMemoryMap();
    renderLetterAndSurprise();
    wishes = settings.wishes;
    quizQuestions = settings.quiz;
    carouselPhotos = settings.carousel;
}

function createHeart() {
    const heart = document.createElement("div");
    heart.classList.add("heart");
    heart.textContent = Math.random() > 0.5 ? "\uD83D\uDC99" : "\uD83E\uDD0D";
    heart.style.left = Math.random() * window.innerWidth + "px";
    heart.style.top = window.innerHeight + "px";
    heart.style.fontSize = 14 + Math.random() * 22 + "px";
    heart.style.animationDuration = 2.4 + Math.random() * 1.8 + "s";

    document.body.appendChild(heart);

    setTimeout(() => {
        heart.remove();
    }, 4200);
}

function createConfettiPiece() {
    const confetti = document.createElement("div");
    confetti.classList.add("confetti");
    confetti.style.left = Math.random() * window.innerWidth + "px";
    confetti.style.background = ["#0077b6", "#87ceeb", "#ffffff", "#ffb3c6"][Math.floor(Math.random() * 4)];
    confetti.style.animationDuration = 2.2 + Math.random() * 1.4 + "s";
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(confetti);

    setTimeout(() => {
        confetti.remove();
    }, 3800);
}

async function startMusic() {
    if (!music) return;

    const ensurePlayable = () => new Promise((resolve) => {
        if (music.readyState >= 2) {
            resolve();
            return;
        }

        const onReady = () => {
            music.removeEventListener("canplay", onReady);
            music.removeEventListener("loadedmetadata", onReady);
            resolve();
        };

        music.addEventListener("canplay", onReady, { once: true });
        music.addEventListener("loadedmetadata", onReady, { once: true });
        music.load();
    });

    try {
        music.loop = true;
        music.muted = false;
        await ensurePlayable();
        await music.play();
    } catch (error) {
        // Browser bisa menolak pemutaran bila interaksi dianggap belum valid.
        // Musik akan dicoba lagi pada interaksi berikutnya (klik amplop/kejutan).
    }
}

function goToSection(selector) {
    const target = document.querySelector(selector);
    if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function bukaSurat() {
    if (!isBirthdayUnlocked()) {
        createHeart();
        alert("Belum waktunya dibuka. Tunggu sampai 06 Mei ya.");
        return;
    }

    if (!envelope.classList.contains("is-opened")) {
        envelope.classList.add("is-opened");
        document.body.classList.add("envelope-open");
        startMusic();

        const interval = setInterval(createHeart, 160);

        setTimeout(() => {
            clearInterval(interval);
            document.body.classList.remove("locked");
            goToSection(".love-reasons");
        }, 2500);
    }
}

function showPhotoFallback(image) {
    image.style.display = "none";
    image.parentElement.classList.add("missing-photo");
}

function drawWish() {
    if (!isBirthdayUnlocked()) return;

    const wishText = document.getElementById("wishText");
    const wish = wishes[Math.floor(Math.random() * wishes.length)];
    wishText.textContent = wish;

    for (let i = 0; i < 10; i++) {
        setTimeout(createHeart, i * 80);
    }
}

function runLoveMeter() {
    if (!isBirthdayUnlocked()) return;

    const fill = document.getElementById("loveMeterFill");
    const result = document.getElementById("loveMeterResult");
    fill.style.width = "0%";
    result.textContent = "Menghitung...";

    setTimeout(() => {
        fill.style.width = "100%";
        result.textContent = "999999% sayang. Sistem menyerah, perasaan menang.";
        for (let i = 0; i < 12; i++) {
            setTimeout(createHeart, i * 70);
        }
    }, 450);
}

function renderQuiz() {
    const questionElement = document.getElementById("quizQuestion");
    const optionsElement = document.getElementById("quizOptions");
    const resultElement = document.getElementById("quizResult");

    if (!questionElement || !optionsElement || !resultElement) return;

    if (currentQuizIndex >= quizQuestions.length) {
        questionElement.textContent = "Quiz selesai!";
        optionsElement.innerHTML = "";
        resultElement.textContent = `Skor kamu ${quizScore}/${quizQuestions.length}. Hadiahnya: aku makin sayang.`;
        return;
    }

    const currentQuestion = quizQuestions[currentQuizIndex];
    questionElement.textContent = currentQuestion.question;
    resultElement.textContent = "";
    optionsElement.innerHTML = "";

    currentQuestion.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = option;
        button.onclick = () => answerQuiz(index);
        optionsElement.appendChild(button);
    });
}

function answerQuiz(index) {
    if (!isBirthdayUnlocked()) return;

    const currentQuestion = quizQuestions[currentQuizIndex];
    const resultElement = document.getElementById("quizResult");

    if (index === currentQuestion.answer) {
        quizScore++;
        resultElement.textContent = "Benar. Kamu memang paham cerita kita.";
    } else {
        resultElement.textContent = "Hampir. Tapi tetap lucu, jadi nilainya aman.";
    }

    currentQuizIndex++;
    setTimeout(renderQuiz, 900);
}

function renderCarousel() {
    const photo = carouselPhotos[carouselIndex];
    const image = document.getElementById("carouselImage");
    const title = document.getElementById("carouselTitle");
    const caption = document.getElementById("carouselCaption");

    if (!image || !title || !caption) return;

    image.style.display = "block";
    image.parentElement.classList.remove("missing-carousel-photo");
    image.src = photo.src;
    image.alt = photo.title;
    title.textContent = photo.title;
    caption.textContent = photo.caption;
}

function moveCarousel(direction) {
    if (!isBirthdayUnlocked()) return;

    carouselIndex = (carouselIndex + direction + carouselPhotos.length) % carouselPhotos.length;
    renderCarousel();
}

function showCarouselFallback(image) {
    image.style.display = "none";
    image.parentElement.classList.add("missing-carousel-photo");
}

function openLightbox(src, title, caption) {
    if (!isBirthdayUnlocked()) return;

    const lightbox = document.getElementById("lightbox");
    const image = document.getElementById("lightboxImage");

    image.src = src;
    image.alt = title;
    image.onerror = () => {
        image.style.display = "none";
        document.querySelector(".photo-modal").classList.add("missing-photo-large");
    };
    image.onload = () => {
        image.style.display = "block";
        document.querySelector(".photo-modal").classList.remove("missing-photo-large");
    };

    document.getElementById("lightboxTitle").textContent = title;
    document.getElementById("lightboxCaption").textContent = caption;
    lightbox.classList.add("is-open");
}

function closeLightbox() {
    document.getElementById("lightbox").classList.remove("is-open");
}

function openLetter() {
    if (!isBirthdayUnlocked()) return;
    document.getElementById("letterModal").classList.add("is-open");
}

function closeLetter() {
    document.getElementById("letterModal").classList.remove("is-open");
}

function openSurprise() {
    if (!isBirthdayUnlocked()) return;

    document.getElementById("surpriseModal").classList.add("is-open");
    startMusic();

    for (let i = 0; i < 50; i++) {
        setTimeout(createConfettiPiece, i * 35);
    }

    for (let i = 0; i < 16; i++) {
        setTimeout(createHeart, i * 90);
    }
}

function closeSurprise() {
    document.getElementById("surpriseModal").classList.remove("is-open");
}

function closeModalOnBackdrop(event, id) {
    if (event.target.id === id) {
        event.target.classList.remove("is-open");
    }
}

function kirimPesan() {
    if (!isBirthdayUnlocked()) return;

    const textarea = document.getElementById("pesanCurhat");
    const pesan = textarea.value.trim();

    if (pesan === "") {
        alert("Jangan lupa isi pesannya ya sayang... \uD83E\uDD7A");
        return;
    }

    localStorage.setItem("pesanUltahCaya", pesan);
    textarea.value = "";
    renderLastMessage();
    alert("Pesan kamu sudah sampai di hati aku! \u2764\uFE0F");
}

function renderLastMessage() {
    const lastMessage = document.getElementById("lastMessage");
    const savedMessage = localStorage.getItem("pesanUltahCaya");

    if (savedMessage) {
        lastMessage.textContent = `Pesan terakhir: "${savedMessage}"`;
    }
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeLightbox();
        closeLetter();
        closeSurprise();
    }
});

async function initPage() {
    await syncSettingsVersion();
    await loadRemoteSettings();
    applySettings();
    updateCountdown();
    renderLastMessage();
    renderQuiz();
    renderCarousel();
    setInterval(updateCountdown, 1000);
}

initPage();
