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

const SETTINGS_KEY = "birthday-settings";
const MAX_SETTINGS_JSON_BYTES = 1_500_000;
const CREATE_TABLE_SQL =
    "CREATE TABLE IF NOT EXISTS site_settings (id TEXT PRIMARY KEY, settings_json TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)";

function json(data, init = {}) {
    return new Response(JSON.stringify(data), {
        ...init,
        headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
            ...(init.headers || {})
        }
    });
}

function isAuthorized(request, env) {
    const password = request.headers.get("x-admin-password") || "";
    return Boolean(env.ADMIN_PASSWORD) && password === env.ADMIN_PASSWORD;
}

async function readSettings(env) {
    if (!env.SETTINGS_DB) {
        return defaultSettings;
    }

    await env.SETTINGS_DB.prepare(CREATE_TABLE_SQL).run();

    const row = await env.SETTINGS_DB
        .prepare("SELECT settings_json FROM site_settings WHERE id = ?1")
        .bind(SETTINGS_KEY)
        .first();

    if (!row || !row.settings_json) {
        return defaultSettings;
    }

    try {
        return { ...defaultSettings, ...JSON.parse(row.settings_json) };
    } catch (error) {
        return defaultSettings;
    }
}

export async function onRequestGet({ env }) {
    try {
        const settings = await readSettings(env);
        return json(settings);
    } catch (error) {
        return json(
            {
                error: "Gagal membaca settings dari D1.",
                detail: String(error && error.message ? error.message : error)
            },
            { status: 500 }
        );
    }
}

export async function onRequestPost({ request, env }) {
    if (!isAuthorized(request, env)) {
        return json({ error: "Password dashboard salah atau ADMIN_PASSWORD belum diset." }, { status: 401 });
    }

    if (!env.SETTINGS_DB) {
        return json({ error: "Binding D1 SETTINGS_DB belum diset di Cloudflare Pages." }, { status: 500 });
    }

    try {
        let body;
        try {
            body = await request.json();
        } catch (error) {
            return json({ error: "Body harus berupa JSON valid." }, { status: 400 });
        }

        const settings = { ...defaultSettings, ...body };
        const settingsJson = JSON.stringify(settings);
        const settingsBytes = new TextEncoder().encode(settingsJson).length;

        if (settingsBytes > MAX_SETTINGS_JSON_BYTES) {
            return json(
                {
                    error: "Ukuran settings terlalu besar untuk disimpan.",
                    detail: `Payload ${settingsBytes} bytes melewati batas ${MAX_SETTINGS_JSON_BYTES} bytes. Kurangi ukuran musik/gambar upload.`
                },
                { status: 413 }
            );
        }

        await env.SETTINGS_DB.prepare(CREATE_TABLE_SQL).run();

        await env.SETTINGS_DB
            .prepare(`
                INSERT INTO site_settings (id, settings_json, updated_at)
                VALUES (?1, ?2, CURRENT_TIMESTAMP)
                ON CONFLICT(id) DO UPDATE SET
                    settings_json = excluded.settings_json,
                    updated_at = CURRENT_TIMESTAMP
            `)
            .bind(SETTINGS_KEY, settingsJson)
            .run();

        return json({ ok: true, settings });
    } catch (error) {
        return json(
            {
                error: "Gagal menyimpan settings ke D1.",
                detail: String(error && error.message ? error.message : error)
            },
            { status: 500 }
        );
    }
}
