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
    videoTitle: "",
    videoText: "",
    videoSrc: "",
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
let isOpeningEnvelope = false;
let skyAnimationStarted = false;
let skyRevealStarted = false;
let motionEngineStarted = false;

function cleanupLegacySettingsCache() {
    try {
        localStorage.removeItem(LEGACY_SETTINGS_KEY);
    } catch (error) {
        // Kalau storage browser sedang penuh/bermasalah, flow utama tetap lanjut ambil D1.
    }
}

function initSkyCanvas() {
    if (skyAnimationStarted) return;
    skyAnimationStarted = true;

    const canvas = document.getElementById("skyCanvas");
    if (!canvas) return;

    const context = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const state = {
        width: 0,
        height: 0,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
        clouds: [],
        sparkles: [],
        flyer: { x: -120, y: 120, speed: 0.42, phase: 0 }
    };

    function resizeSky() {
        state.width = window.innerWidth;
        state.height = window.innerHeight;
        state.dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(state.width * state.dpr);
        canvas.height = Math.floor(state.height * state.dpr);
        canvas.style.width = `${state.width}px`;
        canvas.style.height = `${state.height}px`;
        context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

        state.clouds = Array.from({ length: state.width < 600 ? 7 : 11 }, (_, index) => ({
            x: Math.random() * state.width,
            y: 40 + Math.random() * state.height * 0.62,
            scale: 0.45 + Math.random() * 0.9,
            speed: 0.08 + Math.random() * 0.18,
            opacity: 0.2 + Math.random() * 0.24,
            drift: Math.random() * Math.PI * 2,
            index
        }));

        state.sparkles = Array.from({ length: state.width < 600 ? 24 : 42 }, () => ({
            x: Math.random() * state.width,
            y: Math.random() * state.height * 0.72,
            radius: 0.8 + Math.random() * 1.8,
            phase: Math.random() * Math.PI * 2,
            speed: 0.012 + Math.random() * 0.018
        }));
    }

    function drawCloud(cloud) {
        context.save();
        context.globalAlpha = cloud.opacity;
        context.translate(cloud.x, cloud.y + Math.sin(cloud.drift) * 8);
        context.scale(cloud.scale, cloud.scale);
        context.fillStyle = "#ffffff";
        context.beginPath();
        context.ellipse(0, 20, 54, 22, 0, 0, Math.PI * 2);
        context.ellipse(38, 15, 42, 20, 0, 0, Math.PI * 2);
        context.ellipse(-34, 18, 36, 18, 0, 0, Math.PI * 2);
        context.ellipse(10, 2, 34, 28, 0, 0, Math.PI * 2);
        context.fill();
        context.restore();
    }

    function drawSparkle(sparkle) {
        const pulse = 0.45 + Math.sin(sparkle.phase) * 0.35;
        context.save();
        context.globalAlpha = Math.max(0.08, pulse);
        context.fillStyle = "#ffffff";
        context.shadowColor = "rgba(255,255,255,0.9)";
        context.shadowBlur = 12;
        context.beginPath();
        context.arc(sparkle.x, sparkle.y, sparkle.radius, 0, Math.PI * 2);
        context.fill();
        context.restore();
    }

    function drawFlyer() {
        const flyer = state.flyer;
        const bob = Math.sin(flyer.phase) * 16;
        context.save();
        context.translate(flyer.x, flyer.y + bob);
        context.rotate(Math.sin(flyer.phase * 0.6) * 0.12);

        const gradient = context.createLinearGradient(-58, 0, 8, 0);
        gradient.addColorStop(0, "rgba(255,255,255,0)");
        gradient.addColorStop(1, "rgba(255,255,255,0.74)");
        context.fillStyle = gradient;
        context.fillRect(-62, -3, 58, 6);

        context.fillStyle = "rgba(255,255,255,0.92)";
        context.shadowColor = "rgba(2,62,138,0.18)";
        context.shadowBlur = 18;
        context.beginPath();
        context.arc(18, 0, 20, 0, Math.PI * 2);
        context.fill();

        context.shadowBlur = 0;
        context.fillStyle = "#0077b6";
        context.font = "700 22px serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("♡", 18, 1);
        context.restore();
    }

    function renderSky() {
        context.clearRect(0, 0, state.width, state.height);
        context.fillStyle = "rgba(240,248,255,0.02)";
        context.fillRect(0, 0, state.width, state.height);

        state.sparkles.forEach((sparkle) => {
            sparkle.phase += sparkle.speed;
            drawSparkle(sparkle);
        });

        state.clouds.forEach((cloud) => {
            cloud.x += reduceMotion ? 0 : cloud.speed;
            cloud.drift += 0.006;
            if (cloud.x > state.width + 140) {
                cloud.x = -160;
                cloud.y = 40 + Math.random() * state.height * 0.62;
            }
            drawCloud(cloud);
        });

        if (!reduceMotion) {
            state.flyer.x += state.flyer.speed;
            state.flyer.phase += 0.018;
            if (state.flyer.x > state.width + 120) {
                state.flyer.x = -120;
                state.flyer.y = 90 + Math.random() * Math.min(240, state.height * 0.36);
            }
            drawFlyer();
            requestAnimationFrame(renderSky);
        } else {
            drawFlyer();
        }
    }

    resizeSky();
    renderSky();
    window.addEventListener("resize", resizeSky);
}

function initSkyReveal() {
    if (skyRevealStarted) return;
    skyRevealStarted = true;

    const targets = document.querySelectorAll("main > section");
    targets.forEach((target) => target.classList.add("sky-reveal"));

    if (!("IntersectionObserver" in window)) {
        targets.forEach((target) => target.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });

    targets.forEach((target) => observer.observe(target));
}

function initMotionEngine() {
    if (motionEngineStarted) return;
    motionEngineStarted = true;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    document.body.classList.add("js-motion");

    const motion = {
        startedAt: performance.now(),
        gallery: new WeakMap()
    };

    function getGalleryState(track) {
        let state = motion.gallery.get(track);
        const distance = Math.max(0, track.scrollWidth / 2);
        const direction = track.classList.contains("gallery-track-left") ? -1 : 1;
        const speed = track.classList.contains("gallery-track-slow") ? 0.52 : 0.76;

        if (!state || Math.abs(state.distance - distance) > 2) {
            state = {
                x: direction > 0 ? -distance : 0,
                distance,
                direction,
                speed
            };
            motion.gallery.set(track, state);
        }

        return state;
    }

    function animateGallery() {
        document.querySelectorAll(".gallery-line").forEach((line) => {
            const track = line.querySelector(".gallery-track");
            if (!track) return;

            const state = getGalleryState(track);
            if (!state.distance) return;

            if (!line.classList.contains("is-dragging") && !line.matches(":hover")) {
                state.x += state.direction * state.speed;
                if (state.direction > 0 && state.x >= 0) state.x = -state.distance;
                if (state.direction < 0 && Math.abs(state.x) >= state.distance) state.x = 0;
            }

            track.style.transform = `translate3d(${state.x}px, 0, 0)`;
        });
    }

    function animateHero(time) {
        const elapsed = (time - motion.startedAt) / 1000;
        const gate = document.querySelector(".gate-countdown");
        const envelopeBox = document.querySelector(".envelope-wrapper");
        const envelopeEl = document.querySelector(".envelope");
        const cards = document.querySelectorAll(".countdown-card");

        if (gate && !document.body.classList.contains("envelope-open")) {
            gate.style.transform = `translate3d(0, ${Math.sin(elapsed * 1.2) * -6}px, 0)`;
        }

        if (envelopeEl && envelopeBox && !envelopeBox.classList.contains("is-opened")) {
            if (envelopeBox.classList.contains("is-waiting")) {
                envelopeEl.style.transform = "scale(0.96)";
            } else {
                const lift = Math.sin(elapsed * 1.8) * -4;
                const scale = 1 + Math.sin(elapsed * 1.4) * 0.008;
                envelopeEl.style.transform = `translate3d(0, ${lift}px, 0) scale(${scale})`;
            }
        }

        cards.forEach((card, index) => {
            const float = Math.sin(elapsed * 1.7 + index * 0.7) * 3;
            card.style.transform = `translate3d(0, ${float}px, 0)`;
        });
    }

    function animateSections(time) {
        const elapsed = (time - motion.startedAt) / 1000;
        document.querySelectorAll(".reason-card, .memory-card, .quiz-card, .meter-card").forEach((card, index) => {
            if (!card.closest(".is-visible") && !card.classList.contains("is-visible")) return;
            const float = Math.sin(elapsed * 0.9 + index * 0.62) * 1.8;
            card.style.translate = `0 ${float}px`;
        });
    }

    function frame(time) {
        animateHero(time);
        animateGallery();
        animateSections(time);
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
    window.addEventListener("resize", () => {
        motion.gallery = new WeakMap();
    });
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
                const result = await response.json().catch(() => null);
                const detail = result?.detail ? ` ${result.detail}` : "";
                throw new Error(`${result?.error || `HTTP ${response.status}`}${detail}`);
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
        enableEnvelope();
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

function enableEnvelope() {
    document.body.classList.remove("locked");
    if (envelope) envelope.classList.remove("is-waiting");
    if (clickInstruction) clickInstruction.textContent = settings.unlockedInstruction;
}

function unlockContentAfterEnvelope() {
    document.body.classList.remove("content-locked");
    document.body.classList.remove("locked");
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
        const title = document.createElement("h3");
        title.textContent = item.title || "";
        const text = document.createElement("p");
        text.textContent = item.caption || "";
        caption.append(title, text);

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
                const track = line.querySelector(".gallery-track");
                if (track) {
                    const current = Number(track.dataset.dragOffset || 0);
                    track.dataset.dragOffset = String(current - deltaX * 0.02);
                }
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
        const dot = document.createElement("div");
        dot.className = "timeline-dot";
        const content = document.createElement("div");
        content.className = "timeline-content";
        const title = document.createElement("h3");
        title.textContent = item.title || "";
        const text = document.createElement("p");
        text.textContent = item.text || "";
        const date = document.createElement("span");
        date.className = "timeline-date";
        date.textContent = item.date || "";
        content.append(title, text, date);
        block.append(dot, content);
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
        const label = document.createElement("span");
        label.textContent = item.label || "";
        const value = document.createElement("strong");
        value.textContent = item.value || "";
        card.append(label, value);
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

function getEmbeddableVideoUrl(url) {
    const raw = String(url || "").trim();
    if (!raw) return "";

    try {
        const parsed = new URL(raw);
        if (parsed.hostname.includes("youtube.com")) {
            const id = parsed.searchParams.get("v");
            return id ? `https://www.youtube.com/embed/${id}` : raw;
        }
        if (parsed.hostname.includes("youtu.be")) {
            const id = parsed.pathname.replace("/", "");
            return id ? `https://www.youtube.com/embed/${id}` : raw;
        }
    } catch (error) {
        return raw;
    }

    return raw;
}

function renderVideoSection() {
    const frame = document.getElementById("videoFrame");
    if (!frame) return;

    setText("#videoTitle", settings.videoTitle || "Video Untukmu");
    setText("#videoText", settings.videoText || "Tambahkan link video dari dashboard.");
    frame.innerHTML = "";

    const src = getEmbeddableVideoUrl(settings.videoSrc);
    if (!src) {
        frame.innerHTML = `<div class="video-placeholder">Video akan muncul di sini</div>`;
        return;
    }

    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(src)) {
        const video = document.createElement("video");
        video.src = src;
        video.controls = true;
        video.playsInline = true;
        video.preload = "metadata";
        frame.appendChild(video);
        return;
    }

    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.title = settings.videoTitle || "Video";
    iframe.loading = "lazy";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    frame.appendChild(iframe);
}

function applySettings() {
    setText(".gate-countdown .section-kicker", settings.countdownKicker);
    setText(".gate-countdown h2", settings.countdownTitle);
    setText(".letter h1", settings.heroTitle);
    setText(".letter p", settings.heroMessage);
    setText(".love-reasons h2", settings.loveTitle);
    if (music) {
        const selectedSrc = settings.musicSrc && settings.musicSrc.trim() ? settings.musicSrc : "";
        if (musicSource) {
            musicSource.src = selectedSrc;
        } else {
            if (selectedSrc) {
                music.src = selectedSrc;
            } else {
                music.removeAttribute("src");
            }
        }
        music.loop = true;
        music.preload = selectedSrc ? "auto" : "none";
        if (selectedSrc) music.load();
    }
    renderReasons();
    renderPolaroids();
    renderMovingGallery();
    renderDetailedTimeline();
    renderLittleThings();
    renderLetterAndSurprise();
    renderVideoSection();
    wishes = settings.wishes;
    quizQuestions = settings.quiz;
    carouselPhotos = settings.carousel;
}

function createHeart() {
    const heart = document.createElement("div");
    heart.classList.add("heart");
    heart.textContent = Math.random() > 0.5 ? "\uD83D\uDC99" : "\uD83E\uDD0D";
    const startX = Math.random() * window.innerWidth;
    const driftX = -30 + Math.random() * 60;
    heart.style.left = `${startX}px`;
    heart.style.top = `${window.innerHeight}px`;
    heart.style.fontSize = 14 + Math.random() * 22 + "px";

    document.body.appendChild(heart);

    const duration = 2400 + Math.random() * 1800;
    heart.animate([
        { opacity: 1, transform: "translate3d(0, 0, 0) scale(1) rotate(0deg)" },
        { opacity: 0.88, transform: `translate3d(${driftX * 0.7}px, -105px, 0) scale(1.38) rotate(8deg)` },
        { opacity: 0, transform: `translate3d(${driftX}px, -230px, 0) scale(1.9) rotate(18deg)` }
    ], {
        duration,
        easing: "cubic-bezier(.2,.85,.25,1)",
        fill: "forwards"
    }).onfinish = () => heart.remove();
}

function createConfettiPiece() {
    const confetti = document.createElement("div");
    confetti.classList.add("confetti");
    const startX = Math.random() * window.innerWidth;
    const driftX = -80 + Math.random() * 160;
    const rotation = 240 + Math.random() * 720;
    confetti.style.left = `${startX}px`;
    confetti.style.background = ["#0077b6", "#87ceeb", "#ffffff", "#ffb3c6"][Math.floor(Math.random() * 4)];
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(confetti);

    confetti.animate([
        { opacity: 1, transform: `translate3d(0, 0, 0) rotate(0deg)` },
        { opacity: 0.9, transform: `translate3d(${driftX * 0.4}px, 48vh, 0) rotate(${rotation * 0.55}deg)` },
        { opacity: 0, transform: `translate3d(${driftX}px, 105vh, 0) rotate(${rotation}deg)` }
    ], {
        duration: 2200 + Math.random() * 1400,
        easing: "linear",
        fill: "forwards"
    }).onfinish = () => confetti.remove();
}

async function startMusic() {
    if (!music) return;
    const selectedSrc = music.currentSrc || music.getAttribute("src") || musicSource?.getAttribute("src") || "";
    if (!selectedSrc) return;

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
    if (isOpeningEnvelope) return;

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
        isOpeningEnvelope = true;
        envelope.classList.add("is-opened");
        document.body.classList.add("envelope-open");
        startMusic();

        let interval = null;
        requestAnimationFrame(() => {
            createHeart();
            interval = setInterval(createHeart, 220);
        });

        setTimeout(() => {
            if (interval) clearInterval(interval);
            unlockContentAfterEnvelope();
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
    if (!wishes.length) return;

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
    if (!carouselPhotos.length) return;

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
    initSkyCanvas();
    initMotionEngine();
    cleanupLegacySettingsCache();
    await syncSettingsVersion();
    const hadCachedSettings = loadCachedRemoteSettings();
    if (hadCachedSettings) {
        applySettings();
        document.body.classList.add("db-ready");
        updateCountdown();
        renderLastMessage();
        renderQuiz();
        renderCarousel();
        initSkyReveal();
        if (countdownTimer) clearInterval(countdownTimer);
        countdownTimer = setInterval(updateCountdown, 1000);
    }

    await loadRemoteSettings();
    if (!settingsReady) return;
    applySettings();
    document.body.classList.add("db-ready");
    updateCountdown();
    renderLastMessage();
    renderQuiz();
    renderCarousel();
    initSkyReveal();
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(updateCountdown, 1000);
}

initPage();



