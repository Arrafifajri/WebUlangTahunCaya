const LEGACY_SETTINGS_KEY = "cayaBirthdaySettings";
const SETTINGS_KEY = "cayaBirthdaySettingsLite";
const SETTINGS_VERSION_KEY = "cayaBirthdaySettingsVersion";
const defaultSettings = {
    unlockDate: "",
    countdownKicker: "",
    countdownTitle: "Memuat data...",
    lockedMessage: "Mengambil pengaturan dari database...",
    unlockedMessage: "",
    heroTitle: "",
    heroMessage: "",
    lockedInstruction: "Memuat data...",
    unlockedInstruction: "",
    musicSrc: "",
    musicName: "",
    loveTitle: "",
    reasons: [],
    polaroids: [],
    detailedTimeline: [],
    littleThings: [],
    wishes: [],
    quiz: [],
    carousel: [],
    movingGallery: [],
    letterTitle: "",
    letterParagraphs: [],
    surpriseTitle: "",
    surpriseText: "",
    surpriseStrong: "",
    curhatTitle: "",
    curhatPrompt: ""
};
function mergeSettings(base, saved) {
    return { ...base, ...(saved || {}) };
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

let settings = { ...defaultSettings };
let settingsReady = false;
let countdownTimer = null;
let lockedScrollY = 0;

function cleanupLegacySettingsCache() {
    try {
        localStorage.removeItem(LEGACY_SETTINGS_KEY);
    } catch (error) {
        // Kalau storage browser sedang penuh/bermasalah, flow utama tetap lanjut ambil D1.
    }
}

function loadCachedRemoteSettings() {
    try {
        const cached = JSON.parse(localStorage.getItem(SETTINGS_KEY));
        if (!cached || cached.__source !== "d1") return false;
        delete cached.__source;
        settings = mergeSettings(defaultSettings, cached);
        settingsReady = true;
        return true;
    } catch (error) {
        return false;
    }
}

function makeLightweightSettingsCache(value) {
    return {
        ...value,
        __source: "d1",
        musicSrc: "",
        polaroids: (value.polaroids || []).map((item) => ({ ...item, image: "" })),
        carousel: (value.carousel || []).map((item) => ({ ...item, src: "" })),
        movingGallery: (value.movingGallery || []).map((item) => ({ ...item, src: "" }))
    };
}

function saveSettingsCache(value) {
    try {
        localStorage.removeItem(SETTINGS_KEY);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(makeLightweightSettingsCache(value)));
    } catch (error) {
        localStorage.removeItem(SETTINGS_KEY);
    }
}

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
            settingsReady = true;
            saveSettingsCache(settings);
            return;
        } catch (error) {
            if (attempt === 3) {
                settingsReady = false;
                showSettingsError(error.message || "Database tidak bisa dibaca.");
                return;
            }
            await sleep(300 * attempt);
        }
    }
}

function showSettingsError(message) {
    document.body.classList.remove("locked");
    document.body.classList.remove("db-ready");
    document.body.classList.add("content-locked");
    setText(".gate-countdown .section-kicker", "DATABASE");
    setText(".gate-countdown h2", "Data belum terbaca");
    setText("#countdownMessage", `Tidak bisa membaca settings dari Cloudflare D1. ${message}`);
    setText(".click-instruction", "Cek dashboard dan binding D1 dulu ya.");
    ["days", "hours", "minutes", "seconds"].forEach((id) => {
        const element = document.getElementById(id);
        if (element) element.textContent = "--";
    });
    if (envelope) envelope.classList.add("is-waiting");
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

    return null;
}

function isBirthdayUnlocked() {
    const unlockDate = getUnlockDate();
    return Boolean(settingsReady && unlockDate && new Date() >= unlockDate);
}

function updateCountdown() {
    if (!settingsReady) return;

    const now = new Date();
    const target = getUnlockDate();
    if (!target) {
        showSettingsError("Tanggal unlockDate kosong atau formatnya salah.");
        return;
    }
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
    if (envelope) envelope.classList.add("is-waiting");
    if (clickInstruction) clickInstruction.textContent = settings.lockedInstruction;
}

function unlockEnvelope() {
    document.body.classList.remove("content-locked");
    document.body.classList.remove("locked");
    if (envelope) envelope.classList.remove("is-waiting");
    if (clickInstruction) clickInstruction.textContent = settings.unlockedInstruction;
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

function getGalleryPhotos() {
    return (settings.movingGallery || []).filter((item) => item && item.src).map((item) => ({
        src: item.src,
        title: item.title || "Foto",
        caption: item.caption || ""
    }));
}

function renderMovingGallery() {
    const gallery = document.getElementById("movingGallery");
    if (!gallery) return;

    const tracks = gallery.querySelectorAll(".gallery-track");
    const photos = getGalleryPhotos();
    tracks.forEach((track) => {
        track.innerHTML = "";
    });

    if (!photos.length) {
        gallery.classList.add("is-empty");
        return;
    }

    gallery.classList.remove("is-empty");
    tracks.forEach((track, trackIndex) => {
        const rowPhotos = [];
        const offset = trackIndex % photos.length;
        for (let i = 0; i < Math.max(photos.length * 4, 16); i++) {
            rowPhotos.push(photos[(i + offset) % photos.length]);
        }

        rowPhotos.forEach((photo) => {
            const button = document.createElement("button");
            button.className = "gallery-marquee-card";
            button.type = "button";
            button.onclick = () => openLightbox(photo.src, photo.title, photo.caption || photo.title);

            const image = document.createElement("img");
            image.src = photo.src;
            image.alt = photo.title;
            image.loading = "lazy";
            image.onerror = () => button.classList.add("missing-gallery-photo");

            button.append(image);
            track.appendChild(button);
        });
    });
    enableGalleryDrag(gallery);
}

function enableGalleryDrag(gallery) {
    gallery.querySelectorAll(".gallery-line").forEach((line) => {
        if (line.dataset.dragReady === "true") return;
        line.dataset.dragReady = "true";

        let startX = 0;
        let startY = 0;
        let startScrollLeft = 0;
        let isDragging = false;
        let moved = false;

        line.addEventListener("pointerdown", (event) => {
            startX = event.clientX;
            startY = event.clientY;
            startScrollLeft = line.scrollLeft;
            isDragging = true;
            moved = false;
            line.classList.add("is-dragging");
        });

        line.addEventListener("pointermove", (event) => {
            if (!isDragging) return;
            const deltaX = event.clientX - startX;
            const deltaY = event.clientY - startY;

            if (Math.abs(deltaY) > Math.abs(deltaX) + 8) {
                line.classList.remove("is-dragging");
                isDragging = false;
                return;
            }

            if (Math.abs(deltaX) > 5) {
                moved = true;
                if (line.setPointerCapture) {
                    line.setPointerCapture(event.pointerId);
                }
                line.scrollLeft = startScrollLeft - deltaX;
            }
        });

        const stopDragging = () => {
            line.classList.remove("is-dragging");
            isDragging = false;
            setTimeout(() => {
                moved = false;
            }, 0);
        };

        line.addEventListener("pointerup", stopDragging);
        line.addEventListener("pointercancel", stopDragging);
        line.addEventListener("click", (event) => {
            if (moved) {
                event.preventDefault();
                event.stopPropagation();
            }
        }, true);
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
    renderMovingGallery();
    renderDetailedTimeline();
    renderLittleThings();
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

function lockPageScroll() {
    if (document.body.classList.contains("modal-open")) return;
    lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.classList.add("modal-open");
}

function unlockPageScroll() {
    if (!document.body.classList.contains("modal-open")) return;
    document.body.classList.remove("modal-open");
    document.body.style.top = "";
    window.scrollTo(0, lockedScrollY);
}

function bukaSurat() {
    if (!settingsReady) {
        showSettingsError("Data belum siap.");
        return;
    }

    if (!isBirthdayUnlocked()) {
        createHeart();
        alert(settings.lockedInstruction || "Belum waktunya dibuka.");
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

    if (!quizQuestions.length) {
        questionElement.textContent = "";
        optionsElement.innerHTML = "";
        resultElement.textContent = "";
        return;
    }

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

    if (!image || !title || !caption || !photo) return;

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
    lockPageScroll();
    lightbox.classList.add("is-open");
}

function closeLightbox() {
    document.getElementById("lightbox").classList.remove("is-open");
    unlockPageScroll();
}

function openLetter() {
    if (!isBirthdayUnlocked()) return;
    lockPageScroll();
    document.getElementById("letterModal").classList.add("is-open");
}

function closeLetter() {
    document.getElementById("letterModal").classList.remove("is-open");
    unlockPageScroll();
}

function openSurprise() {
    if (!isBirthdayUnlocked()) return;

    lockPageScroll();
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
    unlockPageScroll();
}

function closeModalOnBackdrop(event, id) {
    if (id === "lightbox") return;
    if (event.target.id === id) {
        event.target.classList.remove("is-open");
        unlockPageScroll();
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
    cleanupLegacySettingsCache();
    const hadCachedSettings = loadCachedRemoteSettings();
    if (hadCachedSettings) {
        applySettings();
        document.body.classList.add("db-ready");
        updateCountdown();
        renderLastMessage();
        renderQuiz();
        renderCarousel();
        if (countdownTimer) clearInterval(countdownTimer);
        countdownTimer = setInterval(updateCountdown, 1000);
    }

    await syncSettingsVersion();
    await loadRemoteSettings();
    if (!settingsReady) return;
    applySettings();
    document.body.classList.add("db-ready");
    updateCountdown();
    renderLastMessage();
    renderQuiz();
    renderCarousel();
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(updateCountdown, 1000);
}

initPage();



