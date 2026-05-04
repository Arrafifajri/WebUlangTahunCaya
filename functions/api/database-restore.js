// TAGLINE: API restore D1. Mengembalikan settings, hasil quiz, dan pesan perasaan dari file backup dashboard.
const SETTINGS_KEY = "birthday-settings";
const CHUNK_SIZE = 200_000;
const CREATE_SETTINGS_CHUNK_TABLE_SQL =
    "CREATE TABLE IF NOT EXISTS site_settings_chunks (id TEXT NOT NULL, chunk_index INTEGER NOT NULL, chunk_text TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id, chunk_index))";
const CREATE_SETTINGS_LEGACY_TABLE_SQL =
    "CREATE TABLE IF NOT EXISTS site_settings (id TEXT PRIMARY KEY, settings_json TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)";
const CREATE_QUIZ_TABLE_SQL =
    "CREATE TABLE IF NOT EXISTS quiz_results (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, score INTEGER NOT NULL, total INTEGER NOT NULL, duration_ms INTEGER NOT NULL, answers_json TEXT NOT NULL, user_agent TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)";
const CREATE_FEELINGS_TABLE_SQL =
    "CREATE TABLE IF NOT EXISTS feeling_messages (id TEXT PRIMARY KEY, message TEXT NOT NULL, wa_status TEXT NOT NULL, wa_detail TEXT, user_agent TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)";
const MAX_SETTINGS_JSON_BYTES = 60_000_000;
const MAX_ROWS = 1000;

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

function limitText(value, maxLength) {
    return String(value || "").slice(0, maxLength);
}

function toSafeInteger(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function createId(prefix) {
    return `${prefix}-${crypto.randomUUID()}`;
}

async function ensureTables(env) {
    await env.SETTINGS_DB.prepare(CREATE_SETTINGS_CHUNK_TABLE_SQL).run();
    await env.SETTINGS_DB.prepare(CREATE_SETTINGS_LEGACY_TABLE_SQL).run();
    await env.SETTINGS_DB.prepare(CREATE_QUIZ_TABLE_SQL).run();
    await env.SETTINGS_DB.prepare(CREATE_FEELINGS_TABLE_SQL).run();
}

function getBackupDatabase(body) {
    if (body?.database) return body.database;
    if (body?.backup?.database) return body.backup.database;
    return body || {};
}

function getSettingsPayload(body, database) {
    if (!body?.database && !body?.backup && (body?.unlockDate !== undefined || body?.countdownTitle !== undefined)) {
        return body;
    }

    return database.settings || body?.settings || body?.dashboardDraft || body?.backup?.dashboardDraft || null;
}

async function restoreSettings(env, settings) {
    if (!settings || typeof settings !== "object") return false;

    const settingsJson = JSON.stringify(settings);
    const settingsBytes = new TextEncoder().encode(settingsJson).length;

    if (settingsBytes > MAX_SETTINGS_JSON_BYTES) {
        throw new Error(`Ukuran settings backup terlalu besar: ${settingsBytes} bytes.`);
    }

    await env.SETTINGS_DB
        .prepare("DELETE FROM site_settings_chunks WHERE id = ?1")
        .bind(SETTINGS_KEY)
        .run();

    const chunks = [];
    for (let index = 0; index < settingsJson.length; index += CHUNK_SIZE) {
        chunks.push(settingsJson.slice(index, index + CHUNK_SIZE));
    }

    for (let index = 0; index < chunks.length; index++) {
        await env.SETTINGS_DB
            .prepare(
                "INSERT INTO site_settings_chunks (id, chunk_index, chunk_text, updated_at) VALUES (?1, ?2, ?3, CURRENT_TIMESTAMP)"
            )
            .bind(SETTINGS_KEY, index, chunks[index])
            .run();
    }

    await env.SETTINGS_DB
        .prepare(`
            INSERT INTO site_settings (id, settings_json, updated_at)
            VALUES (?1, ?2, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
                settings_json = excluded.settings_json,
                updated_at = CURRENT_TIMESTAMP
        `)
        .bind(SETTINGS_KEY, settingsJson.length <= CHUNK_SIZE ? settingsJson : "{}")
        .run();

    return true;
}

async function restoreQuizResults(env, rows) {
    if (!Array.isArray(rows)) return 0;

    await env.SETTINGS_DB.prepare("DELETE FROM quiz_results").run();
    let restored = 0;

    for (const row of rows.slice(0, MAX_ROWS)) {
        const answers = Array.isArray(row.answers) ? row.answers : [];
        await env.SETTINGS_DB
            .prepare(
                "INSERT INTO quiz_results (id, session_id, score, total, duration_ms, answers_json, user_agent, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
            )
            .bind(
                limitText(row.id || createId("quiz"), 80),
                limitText(row.sessionId || row.session_id || createId("session"), 80),
                Math.max(0, toSafeInteger(row.score, answers.length)),
                Math.max(0, toSafeInteger(row.total, answers.length)),
                Math.max(0, toSafeInteger(row.durationMs || row.duration_ms, 0)),
                JSON.stringify(answers),
                limitText(row.userAgent || row.user_agent, 300),
                limitText(row.createdAt || row.created_at || new Date().toISOString(), 40)
            )
            .run();
        restored++;
    }

    return restored;
}

async function restoreFeelingMessages(env, rows) {
    if (!Array.isArray(rows)) return 0;

    await env.SETTINGS_DB.prepare("DELETE FROM feeling_messages").run();
    let restored = 0;

    for (const row of rows.slice(0, MAX_ROWS)) {
        await env.SETTINGS_DB
            .prepare(
                "INSERT INTO feeling_messages (id, message, wa_status, wa_detail, user_agent, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
            )
            .bind(
                limitText(row.id || createId("feel"), 80),
                limitText(row.message, 1200),
                limitText(row.status || row.wa_status || "database_restored", 80),
                limitText(row.detail || row.wa_detail || "Dipulihkan dari file backup.", 300),
                limitText(row.userAgent || row.user_agent, 300),
                limitText(row.createdAt || row.created_at || new Date().toISOString(), 40)
            )
            .run();
        restored++;
    }

    return restored;
}

export async function onRequestPost({ request, env }) {
    if (!isAuthorized(request, env)) {
        return json({ error: "Password dashboard salah atau ADMIN_PASSWORD belum diset." }, { status: 401 });
    }

    if (!env.SETTINGS_DB) {
        return json({ error: "Binding D1 SETTINGS_DB belum diset di Cloudflare Pages." }, { status: 500 });
    }

    try {
        const body = await request.json();
        await ensureTables(env);

        const database = getBackupDatabase(body);
        const settings = getSettingsPayload(body, database);
        const settingsRestored = await restoreSettings(env, settings);
        const quizRestored = await restoreQuizResults(env, database.quizResults || database.quiz_results);
        const feelingsRestored = await restoreFeelingMessages(env, database.feelingMessages || database.feeling_messages);

        return json({
            ok: true,
            restored: {
                settings: settingsRestored,
                quizResults: quizRestored,
                feelingMessages: feelingsRestored
            }
        });
    } catch (error) {
        return json(
            {
                error: "Gagal restore D1.",
                detail: String(error && error.message ? error.message : error)
            },
            { status: 500 }
        );
    }
}
