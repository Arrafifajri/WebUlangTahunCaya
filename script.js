const LEGACY_SETTINGS_KEY = "cayaBirthdaySettings";
// TAGLINE: Script utama halaman publik. Konten berasal dari dashboard/D1, media besar dari KV.
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
    movingGallerySpeed: 1,
    letterTitle: "",
    letterParagraphs: [],
    surpriseTitle: "",
    surpriseText: "",
    surpriseStrong: "",
    videoTitle: "",
    videoText: "",
    videoSrc: "",
    videoName: "",
    curhatTitle: "",
    curhatPrompt: ""
};
function mergeSettings(base, saved) {
    return { ...base, ...(saved || {}) };
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// TAGLINE: State runtime halaman publik, dipisah supaya alur countdown, musik, dan galeri mudah dilacak.
let settings = { ...defaultSettings };
let settingsReady = false;
let countdownTimer = null;
let lockedScrollY = 0;
let isOpeningEnvelope = false;
let skyAnimationStarted = false;
let skyRevealStarted = false;
let motionEngineStarted = false;
let animationRendererStarted = false;
let animationRefreshQueued = false;
let galleryRenderSeed = Date.now();
let galleryMotionVersion = 0;
let galleryShuffleRound = 0;
let galleryReshuffleQueued = false;
let visualProfile = {
    reduceMotion: false,
    lowPower: false,
    richMotion: true
};

function cleanupLegacySettingsCache() {
    try {
        localStorage.removeItem(LEGACY_SETTINGS_KEY);
    } catch (error) {
        // Kalau storage browser sedang penuh/bermasalah, flow utama tetap lanjut ambil D1.
    }
}

// TAGLINE: Profil visual otomatis, HP kentang dapat animasi lebih ringan tanpa kehilangan suasana.
function initVisualProfile() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const saveData = Boolean(connection?.saveData);
    const slowNetwork = /(^2g$|slow-2g)/i.test(String(connection?.effectiveType || ""));
    const lowMemory = Number(navigator.deviceMemory || 4) <= 2;
    const lowCpu = Number(navigator.hardwareConcurrency || 4) <= 2;
    const smallViewport = Math.min(window.innerWidth || 360, window.innerHeight || 640) < 390;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    visualProfile = {
        reduceMotion,
        lowPower: reduceMotion || saveData || slowNetwork || lowMemory || lowCpu || smallViewport,
        richMotion: !(reduceMotion || saveData || slowNetwork || lowMemory || lowCpu || smallViewport)
    };

    document.body.classList.toggle("reduce-motion-device", visualProfile.reduceMotion);
    document.body.classList.toggle("low-power-device", visualProfile.lowPower);
    document.body.classList.toggle("rich-motion-device", visualProfile.richMotion);
}

// TAGLINE: Animasi langit canvas di background halaman publik.
function initSkyCanvas() {
    if (skyAnimationStarted) return;
    skyAnimationStarted = true;

    const canvas = document.getElementById("skyCanvas");
    if (!canvas) return;

    const context = canvas.getContext("2d");
    const reduceMotion = visualProfile.reduceMotion;
    const lowPower = visualProfile.lowPower;
    let lastSkyFrame = 0;
    const state = {
        width: 0,
        height: 0,
        dpr: lowPower ? 1 : Math.min(window.devicePixelRatio || 1, 2),
        clouds: [],
        sparkles: [],
        flyer: { x: -120, y: 120, speed: 0.42, phase: 0 }
    };

    function resizeSky() {
        state.width = window.innerWidth;
        state.height = window.innerHeight;
        state.dpr = lowPower ? 1 : Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(state.width * state.dpr);
        canvas.height = Math.floor(state.height * state.dpr);
        canvas.style.width = `${state.width}px`;
        canvas.style.height = `${state.height}px`;
        context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

        const cloudCount = lowPower ? (state.width < 600 ? 3 : 5) : (state.width < 600 ? 7 : 11);
        const sparkleCount = lowPower ? (state.width < 600 ? 8 : 14) : (state.width < 600 ? 24 : 42);

        state.clouds = Array.from({ length: cloudCount }, (_, index) => ({
            x: Math.random() * state.width,
            y: 40 + Math.random() * state.height * 0.62,
            scale: 0.45 + Math.random() * 0.9,
            speed: 0.08 + Math.random() * 0.18,
            opacity: 0.2 + Math.random() * 0.24,
            drift: Math.random() * Math.PI * 2,
            index
        }));

        state.sparkles = Array.from({ length: sparkleCount }, () => ({
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

    function renderSky(time = 0) {
        if (lowPower && !reduceMotion && time - lastSkyFrame < 72) {
            requestAnimationFrame(renderSky);
            return;
        }
        lastSkyFrame = time;
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

// TAGLINE: Renderer love ringan, membuat hati/emoji melayang tanpa mengganggu klik.
function initRomanceRenderer() {
    const layer = document.getElementById("romanceRenderer");
    if (!layer || visualProfile.reduceMotion) return;

    const symbols = ["\u2661", "\u2665", "\uD83D\uDC99", "\uD83E\uDD0D", "\u2728"];
    let activeSprites = 0;
    const maxSprites = visualProfile.lowPower ? 6 : 18;
    const initialSprites = visualProfile.lowPower ? 3 : 8;
    const spawnInterval = visualProfile.lowPower ? 2400 : 850;

    function spawnSprite() {
        if (activeSprites > maxSprites) return;
        activeSprites++;

        const sprite = document.createElement("span");
        sprite.className = "romance-sprite";
        sprite.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        const startX = 4 + Math.random() * 92;
        const driftX = -40 + Math.random() * 80;
        const size = visualProfile.lowPower ? 12 + Math.random() * 10 : 14 + Math.random() * 18;
        const duration = visualProfile.lowPower ? 9000 + Math.random() * 4500 : 7000 + Math.random() * 4500;

        sprite.style.left = `${startX}vw`;
        sprite.style.fontSize = `${size}px`;
        sprite.style.setProperty("--sprite-drift", `${driftX}px`);
        layer.appendChild(sprite);

        playRendererAnimation(sprite, {
            loop: false,
            duration,
            easing: "easeOutCubic",
            webEasing: "cubic-bezier(.22,.82,.24,1)",
            animeKeyframes: [
                { opacity: 0, translateY: 32, scale: 0.8, rotate: -8 },
                { opacity: 0.85, translateY: 0, scale: 1, rotate: 4 },
                { opacity: 0, translateX: driftX, translateY: "-92vh", scale: 1.38, rotate: 20 }
            ],
            webKeyframes: [
                { opacity: 0, transform: "translate3d(0, 32px, 0) scale(0.8) rotate(-8deg)" },
                { opacity: 0.85, offset: 0.16, transform: "translate3d(0, 0, 0) scale(1) rotate(4deg)" },
                { opacity: 0, transform: `translate3d(${driftX}px, -92vh, 0) scale(1.38) rotate(20deg)` }
            ]
        });
        setTimeout(() => {
            activeSprites--;
            sprite.remove();
        }, duration + 80);
    }

    for (let index = 0; index < initialSprites; index++) {
        setTimeout(spawnSprite, index * (visualProfile.lowPower ? 520 : 280));
    }
    setInterval(spawnSprite, spawnInterval);
}

// TAGLINE: Resolver target animasi agar Anime.js dan fallback Web Animations memakai API yang sama.
function resolveAnimationTargets(targets) {
    if (!targets) return [];
    if (typeof targets === "string") return Array.from(document.querySelectorAll(targets));
    if (targets instanceof Element) return [targets];
    return Array.from(targets).filter(Boolean);
}

// TAGLINE: Satu renderer animasi; Anime.js dipakai kalau tersedia, Web Animations jadi cadangan offline/CDN gagal.
function playRendererAnimation(targets, options = {}) {
    const elements = resolveAnimationTargets(targets);
    if (!elements.length || visualProfile.reduceMotion) return null;

    const durationScale = visualProfile.lowPower ? Number(options.lowPowerScale || 1.25) : 1;
    const duration = Math.max(120, Number(options.duration || 1000) * durationScale);
    const delay = options.delay || 0;
    const loop = options.loop !== false;

    if (typeof window.anime === "function") {
        const animeOptions = {
            targets: elements,
            duration,
            delay,
            easing: options.easing || "easeInOutSine",
            loop,
            direction: options.direction || "normal",
            autoplay: true
        };

        if (options.animeKeyframes) {
            animeOptions.keyframes = options.animeKeyframes;
        } else if (options.anime) {
            Object.assign(animeOptions, options.anime);
        }

        return window.anime(animeOptions);
    }

    const keyframes = options.webKeyframes || [];
    if (!keyframes.length) return null;

    elements.forEach((element, index) => {
        const resolvedDelay = typeof delay === "function" ? delay(element, index, elements.length) : Number(delay || 0);
        element.animate(keyframes, {
            duration,
            delay: resolvedDelay,
            iterations: loop ? Infinity : 1,
            direction: options.direction || "normal",
            easing: options.webEasing || "ease-in-out",
            fill: options.fill || (loop ? "none" : "forwards")
        });
    });

    return null;
}

// TAGLINE: Penanda supaya elemen yang sama tidak ditempeli animasi dobel saat data dashboard di-render ulang.
function animateFreshElements(targets, key, options) {
    const attr = `data-js-motion-${key}`;
    const freshElements = resolveAnimationTargets(targets).filter((element) => {
        if (element.hasAttribute(attr)) return false;
        element.setAttribute(attr, "true");
        return true;
    });

    if (freshElements.length) {
        playRendererAnimation(freshElements, options);
    }
}

// TAGLINE: Menambahkan charm kecil via JavaScript, jadi CSS fokus ke layout dan bukan sumber animasi utama.
function decorateMotionElements() {
    decorateEnvelopeMatcha();
    decorateMovingGalleryLove();

    const headings = document.querySelectorAll("main > section > h2, .moving-gallery-intro h2, .curhat-card h2");
    headings.forEach((heading) => {
        if (!heading.querySelector(".js-heading-charm.charm-left")) {
            const left = document.createElement("span");
            left.className = "js-heading-charm charm-left";
            left.textContent = "\u2661";
            heading.appendChild(left);
        }
        if (!heading.querySelector(".js-heading-charm.charm-right")) {
            const right = document.createElement("span");
            right.className = "js-heading-charm charm-right";
            right.textContent = "\u2726";
            heading.appendChild(right);
        }
    });

    const sectionCharmCount = visualProfile.lowPower ? 1 : 2;
    document.querySelectorAll("main > section").forEach((section, sectionIndex) => {
        for (let index = 0; index < sectionCharmCount; index++) {
            if (section.querySelector(`.js-section-charm[data-charm-index="${index}"]`)) continue;
            const charm = document.createElement("span");
            charm.className = `js-section-charm charm-${index}`;
            charm.dataset.charmIndex = String(index);
            charm.textContent = (sectionIndex + index) % 2 ? "\u2727" : "\u2661";
            section.appendChild(charm);
        }
    });

    const cardSelectors = ".reason-card, .memory-card, .quiz-card, .meter-card, .wish-jar, .video-frame, .curhat-card";
    document.querySelectorAll(cardSelectors).forEach((card, index) => {
        if (card.querySelector(":scope > .js-card-charm")) return;
        const charm = document.createElement("span");
        charm.className = "js-card-charm";
        charm.textContent = ["\u2661", "\u2726", "\u221E"][index % 3];
        card.appendChild(charm);
    });
}

function decorateEnvelopeMatcha() {
    const envelopeElement = document.querySelector(".envelope");
    if (!envelopeElement || envelopeElement.querySelector(".matcha-envelope-decor")) return;

    const decor = document.createElement("div");
    decor.className = "matcha-envelope-decor";

    ["leaf-a", "leaf-b", "leaf-c"].forEach((name) => {
        const leaf = document.createElement("span");
        leaf.className = `matcha-leaf ${name}`;
        decor.appendChild(leaf);
    });

    ["dot-a", "dot-b", "dot-c"].forEach((name) => {
        const dot = document.createElement("span");
        dot.className = `matcha-blue-dot ${name}`;
        decor.appendChild(dot);
    });

    for (let index = 0; index < 3; index++) {
        const steam = document.createElement("span");
        steam.className = `matcha-steam steam-${index + 1}`;
        decor.appendChild(steam);
    }

    const seal = document.createElement("span");
    seal.className = "matcha-seal";
    seal.textContent = "\u2661";

    envelopeElement.append(decor, seal);
}

function decorateMovingGalleryLove() {
    const section = document.querySelector(".moving-gallery-section");
    if (!section || section.querySelector(".gallery-love-spark")) return;

    for (let index = 0; index < 7; index++) {
        const spark = document.createElement("span");
        spark.className = `gallery-love-spark love-${index + 1}`;
        spark.textContent = index % 3 === 0 ? "\u2661" : index % 3 === 1 ? "\u2665" : "\u2726";
        section.appendChild(spark);
    }
}

// TAGLINE: Renderer utama animasi dekoratif; jumlah dan durasi otomatis diringankan untuk HP lemah.
function refreshJavaScriptAnimationRenderer() {
    if (!animationRendererStarted || visualProfile.reduceMotion) return;

    decorateMotionElements();
    const slowScale = visualProfile.lowPower ? 1.45 : 1;

    animateFreshElements(".gate-countdown", "gate-float", {
        duration: 5200 * slowScale,
        direction: "alternate",
        easing: "easeInOutSine",
        animeKeyframes: [
            { translateY: -5, scale: 1.003 },
            { translateY: 4, scale: 0.998 }
        ],
        webKeyframes: [
            { transform: "translate3d(0, -5px, 0) scale(1.003)" },
            { transform: "translate3d(0, 4px, 0) scale(0.998)" }
        ]
    });

    animateFreshElements(".countdown-card", "countdown-card-float", {
        duration: 3800 * slowScale,
        delay: (element, index) => index * 140,
        direction: "alternate",
        easing: "easeInOutSine",
        animeKeyframes: [
            { translateY: -3 },
            { translateY: 3 }
        ],
        webKeyframes: [
            { transform: "translate3d(0, -3px, 0)" },
            { transform: "translate3d(0, 3px, 0)" }
        ]
    });

    animateFreshElements(".sky-cloud", "countdown-cloud", {
        duration: 12000 * slowScale,
        delay: (element, index) => index * 1100,
        direction: "alternate",
        easing: "easeInOutSine",
        animeKeyframes: [
            { translateX: -14, translateY: 0 },
            { translateX: 18, translateY: -4 }
        ],
        webKeyframes: [
            { transform: "translate3d(-14px, 0, 0)" },
            { transform: "translate3d(18px, -4px, 0)" }
        ]
    });

    animateFreshElements(".cloud", "background-cloud", {
        duration: 52000 * slowScale,
        delay: (element, index) => index * 5200,
        easing: "linear",
        animeKeyframes: [
            { translateX: "-12vw" },
            { translateX: "135vw" }
        ],
        webKeyframes: [
            { transform: "translate3d(-12vw, 0, 0)" },
            { transform: "translate3d(135vw, 0, 0)" }
        ]
    });

    animateFreshElements(".sky-star", "star-twinkle", {
        duration: 2600 * slowScale,
        delay: (element, index) => index * 320,
        direction: "alternate",
        easing: "easeInOutSine",
        animeKeyframes: [
            { opacity: 0.28, scale: 0.72 },
            { opacity: 1, scale: 1.22 }
        ],
        webKeyframes: [
            { opacity: 0.28, transform: "scale(0.72)" },
            { opacity: 1, transform: "scale(1.22)" }
        ]
    });

    animateFreshElements(".love-mascot", "mascot-float", {
        duration: 4300 * slowScale,
        direction: "alternate",
        easing: "easeInOutSine",
        animeKeyframes: [
            { translateX: "-50%", translateY: -5, rotate: -2 },
            { translateX: "-50%", translateY: 7, rotate: 2 }
        ],
        webKeyframes: [
            { transform: "translate3d(-50%, -5px, 0) rotate(-2deg)" },
            { transform: "translate3d(-50%, 7px, 0) rotate(2deg)" }
        ]
    });

    animateFreshElements(".heart-orbit", "heart-orbit", {
        duration: 4300 * slowScale,
        delay: (element, index) => index * 440,
        direction: "alternate",
        easing: "easeInOutSine",
        animeKeyframes: [
            { translateY: -8, scale: 0.92, rotate: -8 },
            { translateY: 9, scale: 1.18, rotate: 10 }
        ],
        webKeyframes: [
            { transform: "translate3d(0, -8px, 0) scale(0.92) rotate(-8deg)" },
            { transform: "translate3d(0, 9px, 0) scale(1.18) rotate(10deg)" }
        ]
    });

    animateFreshElements(".flying-love", "flying-love", {
        duration: 7600 * slowScale,
        easing: "easeInOutQuad",
        animeKeyframes: [
            { translateX: 0, translateY: 0, opacity: 0 },
            { translateX: "46vw", translateY: -8, opacity: 1 },
            { translateX: "92vw", translateY: 4, opacity: 0 }
        ],
        webKeyframes: [
            { opacity: 0, transform: "translate3d(0, 0, 0)" },
            { opacity: 1, transform: "translate3d(46vw, -8px, 0)" },
            { opacity: 0, transform: "translate3d(92vw, 4px, 0)" }
        ]
    });

    animateFreshElements(".fly-body", "fly-body", {
        duration: 1200 * slowScale,
        direction: "alternate",
        easing: "easeInOutSine",
        animeKeyframes: [
            { translateY: -4 },
            { translateY: 5 }
        ],
        webKeyframes: [
            { transform: "translate3d(0, -4px, 0)" },
            { transform: "translate3d(0, 5px, 0)" }
        ]
    });

    animateFreshElements(".matcha-leaf", "matcha-leaf-float", {
        duration: 3800 * slowScale,
        delay: (element, index) => index * 260,
        direction: "alternate",
        easing: "easeInOutSine",
        animeKeyframes: [
            { translateY: -4, rotate: -7, scale: 0.96 },
            { translateY: 5, rotate: 8, scale: 1.06 }
        ],
        webKeyframes: [
            { transform: "translate3d(0, -4px, 0) rotate(-7deg) scale(0.96)" },
            { transform: "translate3d(0, 5px, 0) rotate(8deg) scale(1.06)" }
        ]
    });

    animateFreshElements(".matcha-blue-dot", "matcha-dot-twinkle", {
        duration: 2500 * slowScale,
        delay: (element, index) => index * 220,
        direction: "alternate",
        easing: "easeInOutSine",
        animeKeyframes: [
            { opacity: 0.28, scale: 0.72 },
            { opacity: 1, scale: 1.18 }
        ],
        webKeyframes: [
            { opacity: 0.28, transform: "scale(0.72)" },
            { opacity: 1, transform: "scale(1.18)" }
        ]
    });

    animateFreshElements(".matcha-steam", "matcha-steam-rise", {
        duration: 3100 * slowScale,
        delay: (element, index) => index * 420,
        easing: "easeInOutSine",
        animeKeyframes: [
            { translateY: 16, opacity: 0, scaleY: 0.7 },
            { translateY: -8, opacity: 0.7, scaleY: 1 },
            { translateY: -30, opacity: 0, scaleY: 1.18 }
        ],
        webKeyframes: [
            { opacity: 0, transform: "translate3d(0, 16px, 0) scaleY(0.7)" },
            { opacity: 0.7, transform: "translate3d(0, -8px, 0) scaleY(1)" },
            { opacity: 0, transform: "translate3d(0, -30px, 0) scaleY(1.18)" }
        ]
    });

    animateFreshElements(".matcha-seal", "matcha-seal-pulse", {
        duration: 2200 * slowScale,
        direction: "alternate",
        easing: "easeInOutSine",
        animeKeyframes: [
            { translateX: "-50%", scale: 0.96, rotate: -3 },
            { translateX: "-50%", scale: 1.06, rotate: 3 }
        ],
        webKeyframes: [
            { transform: "translateX(-50%) scale(0.96) rotate(-3deg)" },
            { transform: "translateX(-50%) scale(1.06) rotate(3deg)" }
        ]
    });

    animateFreshElements(".gallery-love-spark", "gallery-love-spark", {
        duration: 6200 * slowScale,
        delay: (element, index) => index * 260,
        direction: "alternate",
        easing: "easeInOutSine",
        animeKeyframes: [
            { translateY: -10, translateX: -8, opacity: 0.18, rotate: -8, scale: 0.82 },
            { translateY: 12, translateX: 10, opacity: 0.68, rotate: 9, scale: 1.12 }
        ],
        webKeyframes: [
            { opacity: 0.18, transform: "translate3d(-8px, -10px, 0) rotate(-8deg) scale(0.82)" },
            { opacity: 0.68, transform: "translate3d(10px, 12px, 0) rotate(9deg) scale(1.12)" }
        ]
    });

    animateFreshElements(".gallery-heart-aura", "gallery-heart-aura", {
        duration: 4200 * slowScale,
        delay: (element, index) => index * 70,
        direction: "alternate",
        easing: "easeInOutSine",
        animeKeyframes: [
            { translateX: "-50%", translateY: "-50%", rotate: 45, scale: 0.94, opacity: 0.5 },
            { translateX: "-50%", translateY: "-50%", rotate: 45, scale: 1.08, opacity: 0.78 }
        ],
        webKeyframes: [
            { opacity: 0.5, transform: "translate(-50%, -50%) rotate(45deg) scale(0.94)" },
            { opacity: 0.78, transform: "translate(-50%, -50%) rotate(45deg) scale(1.08)" }
        ]
    });

    animateFreshElements(".gallery-heart-pin", "gallery-heart-pin", {
        duration: 3400 * slowScale,
        delay: (element, index) => index * 80,
        direction: "alternate",
        easing: "easeInOutSine",
        animeKeyframes: [
            { translateY: -2, rotate: -7, scale: 0.96 },
            { translateY: 4, rotate: 8, scale: 1.08 }
        ],
        webKeyframes: [
            { transform: "translate3d(0, -2px, 0) rotate(-7deg) scale(0.96)" },
            { transform: "translate3d(0, 4px, 0) rotate(8deg) scale(1.08)" }
        ]
    });

    animateFreshElements(".js-heading-charm", "heading-charm", {
        duration: 3600 * slowScale,
        delay: (element, index) => index * 90,
        direction: "alternate",
        easing: "easeInOutSine",
        animeKeyframes: [
            { translateY: -3, rotate: -7, scale: 0.9 },
            { translateY: 5, rotate: 8, scale: 1.08 }
        ],
        webKeyframes: [
            { transform: "translate3d(0, -3px, 0) rotate(-7deg) scale(0.9)" },
            { transform: "translate3d(0, 5px, 0) rotate(8deg) scale(1.08)" }
        ]
    });

    animateFreshElements(".js-section-charm", "section-charm", {
        duration: 7200 * slowScale,
        delay: (element, index) => index * 260,
        direction: "alternate",
        easing: "easeInOutSine",
        animeKeyframes: [
            { translateX: -10, translateY: -8, opacity: 0.24, rotate: -8 },
            { translateX: 12, translateY: 10, opacity: 0.62, rotate: 10 }
        ],
        webKeyframes: [
            { opacity: 0.24, transform: "translate3d(-10px, -8px, 0) rotate(-8deg)" },
            { opacity: 0.62, transform: "translate3d(12px, 10px, 0) rotate(10deg)" }
        ]
    });

    animateFreshElements(".js-card-charm", "card-charm", {
        duration: 5200 * slowScale,
        delay: (element, index) => index * 120,
        direction: "alternate",
        easing: "easeInOutSine",
        animeKeyframes: [
            { translateY: -4, rotate: -8, scale: 0.95 },
            { translateY: 5, rotate: 8, scale: 1.08 }
        ],
        webKeyframes: [
            { transform: "translate3d(0, -4px, 0) rotate(-8deg) scale(0.95)" },
            { transform: "translate3d(0, 5px, 0) rotate(8deg) scale(1.08)" }
        ]
    });

    animateFreshElements(".wish-text", "wish-note", {
        duration: 4600 * slowScale,
        direction: "alternate",
        easing: "easeInOutSine",
        animeKeyframes: [
            { translateY: -2, scale: 0.998 },
            { translateY: 3, scale: 1.006 }
        ],
        webKeyframes: [
            { transform: "translate3d(0, -2px, 0) scale(0.998)" },
            { transform: "translate3d(0, 3px, 0) scale(1.006)" }
        ]
    });

    animateFreshElements(".click-instruction", "click-instruction", {
        duration: 1700 * slowScale,
        direction: "alternate",
        easing: "easeInOutSine",
        animeKeyframes: [
            { translateY: -4 },
            { translateY: 5 }
        ],
        webKeyframes: [
            { transform: "translate3d(0, -4px, 0)" },
            { transform: "translate3d(0, 5px, 0)" }
        ]
    });

    if (!visualProfile.lowPower) {
        animateFreshElements(".swinging", "polaroid-swing", {
            duration: 4600,
            direction: "alternate",
            easing: "easeInOutSine",
            animeKeyframes: [
                { rotate: -2, translateY: -3 },
                { rotate: 2, translateY: 4 }
            ],
            webKeyframes: [
                { transform: "rotate(-2deg) translate3d(0, -3px, 0)" },
                { transform: "rotate(2deg) translate3d(0, 4px, 0)" }
            ]
        });

        animateFreshElements(".swinging-reverse", "polaroid-swing-reverse", {
            duration: 5200,
            direction: "alternate",
            easing: "easeInOutSine",
            animeKeyframes: [
                { rotate: 2, translateY: -2 },
                { rotate: -2, translateY: 4 }
            ],
            webKeyframes: [
                { transform: "rotate(2deg) translate3d(0, -2px, 0)" },
                { transform: "rotate(-2deg) translate3d(0, 4px, 0)" }
            ]
        });
    }
}

function queueJavaScriptAnimationRefresh() {
    if (!animationRendererStarted || animationRefreshQueued) return;
    animationRefreshQueued = true;
    requestAnimationFrame(() => {
        animationRefreshQueued = false;
        refreshJavaScriptAnimationRenderer();
    });
}

function initJavaScriptAnimationRenderer() {
    if (animationRendererStarted) return;
    animationRendererStarted = true;
    if (visualProfile.reduceMotion) return;

    document.body.classList.add("js-rendered-motion");
    refreshJavaScriptAnimationRenderer();
}

// TAGLINE: Section reveal halus saat pengunjung scroll setelah amplop dibuka.
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

// TAGLINE: Mesin animasi JavaScript untuk galeri bergerak dan elemen yang perlu gerak natural.
function initMotionEngine() {
    if (motionEngineStarted) return;
    motionEngineStarted = true;

    const reduceMotion = visualProfile.reduceMotion;
    if (reduceMotion) return;

    document.body.classList.add("js-motion");

    const motion = {
        startedAt: performance.now(),
        lastFrame: 0,
        gallery: new WeakMap(),
        galleryTracks: [],
        galleryVersion: -1
    };
    const minFrameGap = visualProfile.lowPower ? 42 : 0;

    function refreshGalleryTracks() {
        if (motion.galleryVersion === galleryMotionVersion) return;
        motion.galleryTracks = Array.from(document.querySelectorAll(".gallery-line")).map((line) => ({
            line,
            track: line.querySelector(".gallery-track")
        })).filter((item) => item.track);
        motion.galleryVersion = galleryMotionVersion;
    }

    function getGalleryState(track, time) {
        let state = motion.gallery.get(track);
        const distance = Math.max(0, track.scrollWidth / 2);
        const direction = track.classList.contains("gallery-track-left") ? -1 : 1;
        const speedMultiplier = Math.min(2.5, Math.max(0.35, Number(settings.movingGallerySpeed) || 1));
        const speed = (track.classList.contains("gallery-track-slow") ? 30 : 44) * speedMultiplier;

        if (!state || Math.abs(state.distance - distance) > 2 || Math.abs(state.speed - speed) > 0.01) {
            state = {
                x: direction > 0 ? -distance : 0,
                distance,
                direction,
                speed,
                lastTime: time,
                completedCycle: false
            };
            motion.gallery.set(track, state);
        }

        return state;
    }

    function queueGalleryRoundShuffle() {
        if (galleryReshuffleQueued) return;
        galleryReshuffleQueued = true;
        requestAnimationFrame(() => {
            galleryShuffleRound++;
            galleryReshuffleQueued = false;
            renderMovingGallery({ keepRound: true });
            motion.gallery = new WeakMap();
            galleryMotionVersion++;
        });
    }

    function animateGallery(time) {
        refreshGalleryTracks();
        motion.galleryTracks.forEach(({ line, track }) => {
            const rect = line.getBoundingClientRect();
            const isNearViewport = rect.bottom > -160 && rect.top < window.innerHeight + 160;
            if (!isNearViewport) return;

            const state = getGalleryState(track, time);
            if (!state.distance) return;
            const elapsed = Math.min(32, Math.max(0, time - (state.lastTime || time))) / 1000;
            state.lastTime = time;

            if (line.dataset.motionPaused !== "true") {
                state.x += state.direction * state.speed * elapsed;
                let wrapped = false;
                if (state.direction > 0 && state.x >= 0) {
                    state.x = -state.distance;
                    wrapped = true;
                }
                if (state.direction < 0 && Math.abs(state.x) >= state.distance) {
                    state.x = 0;
                    wrapped = true;
                }
                if (wrapped) {
                    state.completedCycle = true;
                    track.dataset.completedCycle = "true";
                    const tracks = motion.galleryTracks.map((item) => item.track);
                    if (tracks.length && tracks.every((item) => item.dataset.completedCycle === "true")) {
                        tracks.forEach((item) => item.dataset.completedCycle = "false");
                        queueGalleryRoundShuffle();
                    }
                }
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
        if (minFrameGap && time - motion.lastFrame < minFrameGap) {
            requestAnimationFrame(frame);
            return;
        }
        motion.lastFrame = time;
        animateGallery(time);
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
    window.addEventListener("resize", () => {
        motion.gallery = new WeakMap();
        galleryMotionVersion++;
        updateGalleryLayoutVars();
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

// TAGLINE: Mengambil settings terbaru dari Cloudflare D1 dengan retry kecil.
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
let quizPendingAnswer = null;
let quizSessionId = "";
let quizStartedAt = null;
let quizAnswers = [];
let quizSubmitted = false;
let carouselIndex = 0;
let videoMusicZoneActive = false;
let musicShouldResumeAfterVideo = false;
let musicFadeFrame = null;
let videoMusicObserver = null;
let videoMusicFallbackHandler = null;
let videoMusicGuardEnabled = false;
let videoMusicCheckFrame = null;
const musicDefaultVolume = 1;

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

    // Format utama dashboard: YYYY-MM-DDTHH:mm
    let match = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(raw);
    if (match) {
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const hour = Number(match[4] || 0);
        const minute = Number(match[5] || 0);
        const second = Number(match[6] || 0);
        return new Date(year, month - 1, day, hour, minute, second, 0);
    }

    // Fallback jika ada format DD/MM/YYYY atau DD/MM/YYYY HH:mm dari input manual.
    match = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2})[:.](\d{2}))?$/.exec(raw);
    if (match) {
        const day = Number(match[1]);
        const month = Number(match[2]);
        const year = Number(match[3]);
        const hour = Number(match[4] || 0);
        const minute = Number(match[5] || 0);
        return new Date(year, month - 1, day, hour, minute, 0, 0);
    }

    return null;
}

function formatUnlockDateTime(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date).replace(/\./g, ":");
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
    const unlockHint = document.getElementById("unlockTimeHint");
    if (unlockHint) {
        unlockHint.textContent = `Dibuka pada ${formatUnlockDateTime(target)}`;
    }

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
    requestAnimationFrame(() => {
        setupVideoMusicGuard(Boolean(getEmbeddableVideoUrl(settings.videoSrc)));
    });
}

function setText(selector, text) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = text;
    }
}

function fitEnvelopeLetter() {
    const letter = document.querySelector(".letter");
    const title = document.querySelector(".letter h1");
    const message = document.querySelector(".letter p");
    if (!letter || !title || !message) return;

    title.style.fontSize = "";
    message.style.fontSize = "";
    message.style.webkitLineClamp = "";

    const isMobile = window.innerWidth <= 768;
    const minTitle = isMobile ? 14 : 17;
    const minMessage = isMobile ? 10 : 12;
    let titleSize = parseFloat(getComputedStyle(title).fontSize);
    let messageSize = parseFloat(getComputedStyle(message).fontSize);

    for (let step = 0; step < 14 && letter.scrollHeight > letter.clientHeight + 1; step++) {
        titleSize = Math.max(minTitle, titleSize - 1);
        messageSize = Math.max(minMessage, messageSize - 0.45);
        title.style.fontSize = `${titleSize}px`;
        message.style.fontSize = `${messageSize}px`;
    }

    if (letter.scrollHeight > letter.clientHeight + 1) {
        message.style.webkitLineClamp = "3";
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

function randomFromSeed(seed) {
    let value = seed % 2147483647;
    if (value <= 0) value += 2147483646;
    return () => {
        value = value * 16807 % 2147483647;
        return (value - 1) / 2147483646;
    };
}

function stringSeed(value) {
    return String(value).split("").reduce((total, char) => {
        return (total * 31 + char.charCodeAt(0)) >>> 0;
    }, 2166136261);
}

function shuffleGalleryPhotos(photos, lineIndex) {
    const shuffled = [...photos];
    const random = randomFromSeed(stringSeed(`${galleryRenderSeed}-${galleryShuffleRound}-${lineIndex}-${photos.length}`));

    for (let index = shuffled.length - 1; index > 0; index--) {
        const target = Math.floor(random() * (index + 1));
        [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
    }

    return shuffled;
}

function gcd(a, b) {
    let left = Math.abs(a);
    let right = Math.abs(b);
    while (right) {
        [left, right] = [right, left % right];
    }
    return left || 1;
}

function getCoprimeStep(length, seedOffset) {
    if (length <= 1) return 1;
    let step = Math.max(1, Math.floor(length * 0.37) + seedOffset * 2 + 1);
    step %= length;
    if (step === 0) step = 1;

    while (gcd(step, length) !== 1) {
        step = (step + 1) % length || 1;
    }

    return step;
}

function buildGalleryLinePhotos(photos, lineIndex, totalLines, shuffledPool, assignedIds, usedVisibleIds) {
    const width = window.innerWidth || document.documentElement.clientWidth || 360;
    const isMobile = width < 768;
    const cardWidth = isMobile ? 146 : 204;
    const visibleCount = Math.max(3, Math.ceil(width / cardWidth) + 1);
    const canUseDisjointLinePools = photos.length >= totalLines;
    const base = [];
    const step = getCoprimeStep(shuffledPool.length, lineIndex + 1);
    let cursor = (lineIndex * visibleCount + lineIndex * lineIndex * 5) % shuffledPool.length;

    function photoId(photo) {
        return photo.src || photo.title || JSON.stringify(photo);
    }

    function pickCandidate(index) {
        const isVisibleSlot = index < visibleCount;

        for (let attempt = 0; attempt < shuffledPool.length; attempt++) {
            const candidateIndex = (cursor + attempt * step) % shuffledPool.length;
            const candidate = shuffledPool[candidateIndex];
            const id = photoId(candidate);
            const belongsToLine = candidateIndex % totalLines === lineIndex;
            const alreadyAssigned = assignedIds.has(id);
            const visibleDuplicate = usedVisibleIds.has(id);

            if (canUseDisjointLinePools && (!belongsToLine || alreadyAssigned)) continue;
            if (isVisibleSlot && visibleDuplicate && usedVisibleIds.size < photos.length) continue;

            cursor = (candidateIndex + step) % shuffledPool.length;
            assignedIds.add(id);
            if (isVisibleSlot) usedVisibleIds.add(id);
            return candidate;
        }

        for (let attempt = 0; attempt < shuffledPool.length; attempt++) {
            const candidateIndex = (cursor + attempt * step) % shuffledPool.length;
            const candidate = shuffledPool[candidateIndex];
            const id = photoId(candidate);
            const isVisibleSlot = index < visibleCount;

            if (isVisibleSlot && usedVisibleIds.has(id) && usedVisibleIds.size < photos.length) continue;

            cursor = (candidateIndex + step) % shuffledPool.length;
            if (isVisibleSlot) usedVisibleIds.add(id);
            return candidate;
        }

        const fallback = shuffledPool[cursor % shuffledPool.length];
        cursor = (cursor + step) % shuffledPool.length;
        return fallback;
    }

    if (canUseDisjointLinePools) {
        shuffledPool.forEach((photo, photoIndex) => {
            if (photoIndex % totalLines === lineIndex) {
                const id = photoId(photo);
                assignedIds.add(id);
                if (base.length < visibleCount && !usedVisibleIds.has(id)) {
                    usedVisibleIds.add(id);
                }
                base.push(photo);
            }
        });
    }

    const minNeeded = visibleCount + 4;
    for (let index = base.length; index < minNeeded; index++) {
        base.push(pickCandidate(index));
    }

    return [...base, ...base];
}

function updateGalleryLayoutVars() {
    const gallery = document.getElementById("movingGallery");
    if (!gallery) return;

    const width = window.innerWidth || document.documentElement.clientWidth || 360;
    const cardWidth = Math.round(Math.min(
        width < 480 ? 136 : width < 900 ? 164 : 190,
        Math.max(width < 480 ? 112 : 130, width * (width < 480 ? 0.34 : width < 900 ? 0.24 : 0.12))
    ));
    const gap = width < 480 ? 10 : width < 900 ? 12 : 14;

    gallery.style.setProperty("--gallery-card-width", `${cardWidth}px`);
    gallery.style.setProperty("--gallery-gap", `${gap}px`);
    gallery.style.setProperty("--gallery-card-radius", `${width < 480 ? 14 : 18}px`);
}

// TAGLINE: Galeri bergerak memakai pembagian foto yang merata agar ratusan foto kebagian tampil.
function renderMovingGallery(options = {}) {
    const gallery = document.getElementById("movingGallery");
    if (!gallery) return;

    updateGalleryLayoutVars();
    if (!options.keepRound) {
        galleryRenderSeed = Date.now();
        galleryShuffleRound = 0;
    }
    galleryMotionVersion++;
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
    const shuffledPool = shuffleGalleryPhotos(photos, 101);
    const assignedIds = new Set();
    const usedVisibleIds = new Set();
    tracks.forEach((track, trackIndex) => {
        const rowPhotos = buildGalleryLinePhotos(photos, trackIndex, tracks.length, shuffledPool, assignedIds, usedVisibleIds);

        rowPhotos.forEach((photo, photoIndex) => {
            const button = document.createElement("button");
            button.className = "gallery-marquee-card";
            button.type = "button";
            button.onclick = () => openLightbox(photo.src, photo.title, photo.caption || photo.title);

            const image = document.createElement("img");
            image.src = photo.src;
            image.alt = photo.title;
            image.loading = photoIndex < 6 ? "eager" : "lazy";
            image.decoding = "async";
            image.draggable = false;
            if (photoIndex < 4) image.fetchPriority = "high";
            image.onerror = () => button.classList.add("missing-gallery-photo");

            const aura = document.createElement("span");
            aura.className = "gallery-heart-aura";
            const frame = document.createElement("span");
            frame.className = "gallery-photo-frame";
            const pin = document.createElement("span");
            pin.className = "gallery-heart-pin";
            pin.textContent = "\u2661";

            frame.appendChild(image);
            button.append(aura, frame, pin);
            track.appendChild(button);
        });
    });
    enableGalleryDrag(gallery);
    queueJavaScriptAnimationRefresh();
}

function enableGalleryDrag(gallery) {
    gallery.querySelectorAll(".gallery-line").forEach((line) => {
        if (line.dataset.dragReady === "true") return;
        line.dataset.dragReady = "true";
        line.dataset.motionPaused = "false";

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
            line.dataset.motionPaused = "true";
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
            line.dataset.motionPaused = "false";
            setTimeout(() => {
                moved = false;
            }, 0);
        };

        line.addEventListener("mouseenter", () => {
            line.dataset.motionPaused = "true";
        });
        line.addEventListener("mouseleave", () => {
            if (!isDragging) line.dataset.motionPaused = "false";
        });
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

    const defaultCurhatTitle = "Kalau hati kamu mau cerita \uD83D\uDC8C";
    const defaultCurhatPrompt = "Tulis perasaan kamu di sini. Nanti pesannya tersimpan rapi dan cuma bisa aku baca dari dashboard.";
    const oldCurhatTitle = /^pesan untukmu/i.test(String(settings.curhatTitle || "").trim());
    const oldCurhatPrompt = /kalo ada yang mau diungkapin|whatsapp|bot/i.test(String(settings.curhatPrompt || "").trim());
    setText(".curhat-section h2", oldCurhatTitle ? defaultCurhatTitle : (settings.curhatTitle || defaultCurhatTitle));
    setText(".curhat-intro", oldCurhatPrompt ? defaultCurhatPrompt : (settings.curhatPrompt || defaultCurhatPrompt));
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

// TAGLINE: Video penutup mendukung upload KV, link MP4, dan embed YouTube.
function renderVideoSection() {
    const frame = document.getElementById("videoFrame");
    if (!frame) return;

    setText("#videoTitle", settings.videoTitle || "Video Untukmu");
    setText("#videoText", settings.videoText || "Tambahkan link video dari dashboard.");
    frame.innerHTML = "";

    const src = getEmbeddableVideoUrl(settings.videoSrc);
    if (!src) {
        frame.innerHTML = `<div class="video-placeholder">Video akan muncul di sini</div>`;
        setupVideoMusicGuard(false);
        return;
    }

    if (src.startsWith("data:video/") || src.startsWith("/api/media") || /\.(mp4|webm|ogg)(\?.*)?$/i.test(src)) {
        const video = document.createElement("video");
        video.src = src;
        video.controls = true;
        video.playsInline = true;
        video.preload = "metadata";
        video.addEventListener("play", () => pauseMusicForVideo(true));
        frame.appendChild(video);
        setupVideoMusicGuard(true);
        return;
    }

    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.title = settings.videoTitle || "Video";
    iframe.loading = "lazy";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    frame.appendChild(iframe);
    setupVideoMusicGuard(true);
}

// TAGLINE: Satu pintu untuk menerapkan data dashboard ke semua elemen halaman.
function applySettings() {
    setText(".gate-countdown .section-kicker", settings.countdownKicker);
    setText(".gate-countdown h2", settings.countdownTitle);
    setText(".letter h1", settings.heroTitle);
    setText(".letter p", settings.heroMessage);
    requestAnimationFrame(fitEnvelopeLetter);
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
    resetQuizSession();
    carouselPhotos = settings.carousel;
    queueJavaScriptAnimationRefresh();
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
    playRendererAnimation(heart, {
        loop: false,
        duration,
        easing: "easeOutCubic",
        webEasing: "cubic-bezier(.2,.85,.25,1)",
        animeKeyframes: [
            { opacity: 1, translateX: 0, translateY: 0, scale: 1, rotate: 0 },
            { opacity: 0.88, translateX: driftX * 0.7, translateY: -105, scale: 1.38, rotate: 8 },
            { opacity: 0, translateX: driftX, translateY: -230, scale: 1.9, rotate: 18 }
        ],
        webKeyframes: [
            { opacity: 1, transform: "translate3d(0, 0, 0) scale(1) rotate(0deg)" },
            { opacity: 0.88, transform: `translate3d(${driftX * 0.7}px, -105px, 0) scale(1.38) rotate(8deg)` },
            { opacity: 0, transform: `translate3d(${driftX}px, -230px, 0) scale(1.9) rotate(18deg)` }
        ]
    });
    setTimeout(() => heart.remove(), duration + 80);
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

    const duration = 2200 + Math.random() * 1400;
    playRendererAnimation(confetti, {
        loop: false,
        duration,
        easing: "linear",
        webEasing: "linear",
        animeKeyframes: [
            { opacity: 1, translateX: 0, translateY: 0, rotate: 0 },
            { opacity: 0.9, translateX: driftX * 0.4, translateY: "48vh", rotate: rotation * 0.55 },
            { opacity: 0, translateX: driftX, translateY: "105vh", rotate: rotation }
        ],
        webKeyframes: [
            { opacity: 1, transform: "translate3d(0, 0, 0) rotate(0deg)" },
            { opacity: 0.9, transform: `translate3d(${driftX * 0.4}px, 48vh, 0) rotate(${rotation * 0.55}deg)` },
            { opacity: 0, transform: `translate3d(${driftX}px, 105vh, 0) rotate(${rotation}deg)` }
        ]
    });
    setTimeout(() => confetti.remove(), duration + 80);
}

async function startMusic() {
    if (!music) return;
    if (isNearVideoMusicZone()) {
        pauseMusicForVideo();
        return;
    }
    if (videoMusicZoneActive) return;
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
        music.volume = musicDefaultVolume;
        await ensurePlayable();
        await music.play();
    } catch (error) {
        // Browser bisa menolak pemutaran bila interaksi dianggap belum valid.
        // Musik akan dicoba lagi pada interaksi berikutnya (klik amplop/kejutan).
    }
}

function stopMusicFade() {
    if (musicFadeFrame) {
        cancelAnimationFrame(musicFadeFrame);
        musicFadeFrame = null;
    }
}

function fadeMusicVolume(targetVolume, duration = 420, onDone) {
    if (!music) return;

    stopMusicFade();
    const startVolume = Number.isFinite(music.volume) ? music.volume : musicDefaultVolume;
    const startedAt = performance.now();

    function tick(time) {
        const progress = Math.min(1, (time - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        music.volume = startVolume + (targetVolume - startVolume) * eased;

        if (progress < 1) {
            musicFadeFrame = requestAnimationFrame(tick);
            return;
        }

        music.volume = targetVolume;
        musicFadeFrame = null;
        if (onDone) onDone();
    }

    musicFadeFrame = requestAnimationFrame(tick);
}

function pauseMusicForVideo(keepResumeFlag = false) {
    if (!music) return;
    videoMusicZoneActive = true;

    if (!music.paused && !music.ended) {
        musicShouldResumeAfterVideo = true;
    } else if (!keepResumeFlag) {
        musicShouldResumeAfterVideo = false;
    }

    if (music.paused) return;
    fadeMusicVolume(0, 360, () => {
        music.pause();
        music.volume = musicDefaultVolume;
    });
}

function isNearVideoMusicZone() {
    if (!videoMusicGuardEnabled) return false;

    const section = document.querySelector(".video-section");
    if (!section || document.body.classList.contains("content-locked")) return false;

    const rect = section.getBoundingClientRect();
    const height = window.innerHeight || document.documentElement.clientHeight || 720;
    const enterDistance = height * 1.35;
    const leaveDistance = height * 0.55;

    if (videoMusicZoneActive) {
        return rect.top < height + leaveDistance && rect.bottom > -leaveDistance;
    }

    return rect.top < height + enterDistance && rect.bottom > -enterDistance * 0.35;
}

async function resumeMusicAfterVideo() {
    if (!music) return;
    videoMusicZoneActive = false;

    if (!musicShouldResumeAfterVideo) return;
    musicShouldResumeAfterVideo = false;
    if (!isBirthdayUnlocked() || !document.body.classList.contains("envelope-open")) return;

    stopMusicFade();
    music.volume = 0;
    try {
        const selectedSrc = music.currentSrc || music.getAttribute("src") || musicSource?.getAttribute("src") || "";
        if (!selectedSrc) return;
        music.loop = true;
        music.muted = false;
        await music.play();
        fadeMusicVolume(musicDefaultVolume, 520);
    } catch (error) {
        music.volume = musicDefaultVolume;
    }
}

// TAGLINE: Penjaga audio agar musik background tidak tabrakan dengan suara video.
function setupVideoMusicGuard(hasVideo) {
    const section = document.querySelector(".video-section");
    videoMusicGuardEnabled = Boolean(hasVideo && section);
    if (videoMusicObserver) {
        videoMusicObserver.disconnect();
        videoMusicObserver = null;
    }
    if (videoMusicFallbackHandler) {
        window.removeEventListener("scroll", videoMusicFallbackHandler);
        window.removeEventListener("resize", videoMusicFallbackHandler);
        window.removeEventListener("touchmove", videoMusicFallbackHandler);
        window.removeEventListener("wheel", videoMusicFallbackHandler);
        videoMusicFallbackHandler = null;
    }
    if (videoMusicCheckFrame) {
        cancelAnimationFrame(videoMusicCheckFrame);
        videoMusicCheckFrame = null;
    }

    if (!videoMusicGuardEnabled) {
        if (videoMusicZoneActive) resumeMusicAfterVideo();
        return;
    }

    function setVideoZone(active) {
        if (active) {
            pauseMusicForVideo();
        } else if (videoMusicZoneActive) {
            resumeMusicAfterVideo();
        }
    }

    function checkVideoZone() {
        videoMusicCheckFrame = null;
        setVideoZone(isNearVideoMusicZone());
    }

    function scheduleVideoZoneCheck() {
        if (videoMusicCheckFrame) return;
        videoMusicCheckFrame = requestAnimationFrame(checkVideoZone);
    }

    if ("IntersectionObserver" in window) {
        videoMusicObserver = new IntersectionObserver((entries) => {
            const entry = entries[0];
            if (entry?.isIntersecting || isNearVideoMusicZone()) {
                pauseMusicForVideo();
            } else {
                scheduleVideoZoneCheck();
            }
        }, {
            root: null,
            rootMargin: "90% 0px 90% 0px",
            threshold: 0.01
        });
        videoMusicObserver.observe(section);
    }

    videoMusicFallbackHandler = scheduleVideoZoneCheck;
    window.addEventListener("scroll", videoMusicFallbackHandler, { passive: true });
    window.addEventListener("resize", videoMusicFallbackHandler);
    window.addEventListener("touchmove", videoMusicFallbackHandler, { passive: true });
    window.addEventListener("wheel", videoMusicFallbackHandler, { passive: true });
    scheduleVideoZoneCheck();
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

// TAGLINE: Gerbang utama, amplop baru bisa membuka konten setelah tanggal unlock.
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

function createQuizSessionId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `quiz-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function resetQuizSession() {
    currentQuizIndex = 0;
    quizScore = 0;
    quizPendingAnswer = null;
    quizStartedAt = null;
    quizAnswers = [];
    quizSubmitted = false;
    quizSessionId = createQuizSessionId();
}

async function submitQuizResult() {
    if (quizSubmitted || !quizQuestions.length || !quizAnswers.length) return;
    quizSubmitted = true;

    const finishedAt = Date.now();
    const payload = {
        sessionId: quizSessionId || createQuizSessionId(),
        startedAt: new Date(quizStartedAt || finishedAt).toISOString(),
        finishedAt: new Date(finishedAt).toISOString(),
        durationMs: Math.max(0, finishedAt - (quizStartedAt || finishedAt)),
        score: quizScore,
        total: quizQuestions.length,
        answers: quizAnswers
    };

    try {
        await fetch("/api/quiz-results", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        console.warn("Hasil quiz belum bisa dikirim ke monitoring.", error);
    }
}

function getQuizOptionLabels() {
    return ["A", "B", "C"];
}

function getNormalizedQuizOptions(question) {
    const labels = getQuizOptionLabels();
    const source = Array.isArray(question?.options) ? question.options : [];
    return labels.map((label, index) => ({
        label,
        text: String(source[index] || "").trim()
    })).filter((option) => option.text);
}

function getQuizAnswerInput() {
    return document.getElementById("quizReasonInput");
}

// TAGLINE: Mini quiz publik, tiap jawaban wajib punya alasan lalu hasilnya masuk monitoring D1.
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
        questionElement.textContent = "Yeay! Kuis selesai.";
        optionsElement.innerHTML = "";
        resultElement.textContent = "Apapun jawaban kamu, aku bakal tetap sayang kamu selamanya. Happy birthday sekali lagi, sayang.";
        return;
    }

    const currentQuestion = quizQuestions[currentQuizIndex];
    const options = getNormalizedQuizOptions(currentQuestion);
    questionElement.textContent = `Pertanyaan ke-${currentQuizIndex + 1}: ${currentQuestion.question || "Pertanyaan kosong"}`;
    resultElement.textContent = "";
    optionsElement.innerHTML = "";
    quizPendingAnswer = null;

    if (!options.length) {
        resultElement.textContent = "Pilihan quiz belum lengkap. Cek dashboard dulu ya.";
        return;
    }

    const helper = document.createElement("p");
    helper.className = "quiz-helper";
    helper.textContent = "Pilih jawabanmu (A/B/C), terus kasih tau alasannya ya.";
    optionsElement.appendChild(helper);

    options.forEach((option, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "quiz-option-button";
        button.dataset.optionIndex = String(index);
        button.innerHTML = `<strong>${option.label}</strong><span>${option.text}</span>`;
        button.onclick = () => answerQuiz(index);
        optionsElement.appendChild(button);
    });

    renderQuizReasonBox();
}

function answerQuiz(index) {
    if (!isBirthdayUnlocked()) return;

    const currentQuestion = quizQuestions[currentQuizIndex];
    const resultElement = document.getElementById("quizResult");
    const options = getNormalizedQuizOptions(currentQuestion);
    const selected = options[index];
    if (!currentQuestion || !selected) return;

    if (!quizStartedAt) quizStartedAt = Date.now();
    quizPendingAnswer = {
        question: currentQuestion.question || `Pertanyaan ${currentQuizIndex + 1}`,
        selectedIndex: index,
        selectedLetter: selected.label,
        selectedOption: selected.text,
        answeredAt: new Date().toISOString()
    };

    document.querySelectorAll(".quiz-option-button").forEach((button) => {
        button.classList.toggle("is-selected", Number(button.dataset.optionIndex) === index);
    });
    renderQuizReasonBox();
    getQuizAnswerInput()?.focus();
    resultElement.textContent = "Kenapa kamu pilih itu? Kasih tau alasannya dong...";
}

function renderQuizReasonBox() {
    const optionsElement = document.getElementById("quizOptions");
    if (!optionsElement) return;

    const oldBox = document.getElementById("quizReasonBox");
    if (oldBox) oldBox.remove();
    if (!quizPendingAnswer) return;

    const box = document.createElement("div");
    box.id = "quizReasonBox";
    box.className = "quiz-reason-box";

    const label = document.createElement("label");
    label.htmlFor = "quizReasonInput";
    label.textContent = `Alasan kamu pilih ${quizPendingAnswer.selectedLetter}`;

    const textarea = document.createElement("textarea");
    textarea.id = "quizReasonInput";
    textarea.rows = 4;
    textarea.maxLength = 700;
    textarea.placeholder = "Tulis alasannya di sini...";

    const footer = document.createElement("div");
    footer.className = "quiz-reason-actions";
    const counter = document.createElement("span");
    counter.id = "quizReasonCounter";
    counter.textContent = "0/700";

    textarea.addEventListener("input", () => {
        counter.textContent = `${textarea.value.length}/700`;
    });

    const submitButton = document.createElement("button");
    submitButton.type = "button";
    submitButton.textContent = "Simpan jawaban";
    submitButton.onclick = submitQuizReason;

    footer.append(counter, submitButton);
    box.append(label, textarea, footer);
    optionsElement.appendChild(box);
}

function submitQuizReason() {
    if (!quizPendingAnswer) return;

    const resultElement = document.getElementById("quizResult");
    const input = getQuizAnswerInput();
    const reason = String(input?.value || "").trim();

    if (!reason) {
        if (resultElement) resultElement.textContent = "Ayo isi alasannya dulu, biar jawabannya makin manis.";
        input?.focus();
        return;
    }

    quizAnswers.push({
        ...quizPendingAnswer,
        reason,
        isCorrect: true
    });
    quizScore = quizAnswers.length;
    quizPendingAnswer = null;

    if (resultElement) {
        resultElement.textContent = "Makasih sayang! Jawaban kamu bikin aku makin sayang.";
    }

    currentQuizIndex++;
    if (currentQuizIndex >= quizQuestions.length) {
        submitQuizResult();
    }
    setTimeout(renderQuiz, 950);
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

// TAGLINE: Form perasaan, disimpan ke D1 dan dibaca lewat dashboard.
async function kirimPesan() {
    if (!isBirthdayUnlocked()) return;

    const textarea = document.getElementById("pesanCurhat");
    const button = document.getElementById("curhatSendButton");
    const lastMessage = document.getElementById("lastMessage");
    const pesan = textarea.value.trim();

    if (pesan === "") {
        alert("Jangan lupa isi pesannya ya sayang... \uD83E\uDD7A");
        return;
    }

    try {
        if (button) {
            button.disabled = true;
            button.textContent = "Mengirim...";
        }
        if (lastMessage) {
            lastMessage.textContent = "Sebentar ya, pesannya lagi dikirim pelan-pelan...";
            lastMessage.classList.remove("is-error");
        }

        const response = await fetch("/api/feelings", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({ message: pesan })
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok && response.status !== 202) {
            throw new Error(result.error || "Pesan belum bisa dikirim.");
        }

        const statusText = "Pesan kamu sudah tersimpan. Nanti aku baca dari dashboard.";

        localStorage.setItem("pesanUltahCayaStatus", statusText);
        localStorage.removeItem("pesanUltahCaya");
        textarea.value = "";
        updateCurhatCounter();
        renderLastMessage();
    } catch (error) {
        if (lastMessage) {
            lastMessage.textContent = `${error.message} Coba kirim sekali lagi ya.`;
            lastMessage.classList.add("is-error");
        }
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "Simpan Pesan";
        }
    }
}

function renderLastMessage() {
    const lastMessage = document.getElementById("lastMessage");
    if (!lastMessage) return;

    const savedStatus = localStorage.getItem("pesanUltahCayaStatus");
    if (savedStatus) {
        lastMessage.textContent = savedStatus;
        lastMessage.classList.remove("is-error");
    }
}

function updateCurhatCounter() {
    const textarea = document.getElementById("pesanCurhat");
    const counter = document.getElementById("curhatCounter");
    if (!textarea || !counter) return;

    counter.textContent = `${textarea.value.length}/1200`;
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeLightbox();
        closeLetter();
        closeSurprise();
    }
});

window.addEventListener("resize", fitEnvelopeLetter);
document.getElementById("pesanCurhat")?.addEventListener("input", updateCurhatCounter);

async function initPage() {
    initVisualProfile();
    initSkyCanvas();
    initRomanceRenderer();
    initJavaScriptAnimationRenderer();
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



