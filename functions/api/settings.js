const SETTINGS_KEY = "birthday-settings";
const MAX_SETTINGS_JSON_BYTES = 60_000_000;
const CHUNK_SIZE = 200_000;
const CREATE_CHUNK_TABLE_SQL =
    "CREATE TABLE IF NOT EXISTS site_settings_chunks (id TEXT NOT NULL, chunk_index INTEGER NOT NULL, chunk_text TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id, chunk_index))";
const CREATE_LEGACY_TABLE_SQL =
    "CREATE TABLE IF NOT EXISTS site_settings (id TEXT PRIMARY KEY, settings_json TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)";

async function ensureSettingsTables(env) {
    await env.SETTINGS_DB.prepare(CREATE_CHUNK_TABLE_SQL).run();
    await env.SETTINGS_DB.prepare(CREATE_LEGACY_TABLE_SQL).run();
}

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
        return null;
    }

    await ensureSettingsTables(env);

    let chunkRows;
    chunkRows = await env.SETTINGS_DB
        .prepare("SELECT chunk_index, chunk_text FROM site_settings_chunks WHERE id = ?1 ORDER BY chunk_index ASC")
        .bind(SETTINGS_KEY)
        .all();

    let payload = "";
    if (chunkRows?.results?.length) {
        const hasMissingChunk = chunkRows.results.some((row, index) => Number(row.chunk_index) !== index);
        if (hasMissingChunk) {
            throw new Error("Data settings chunk di D1 tidak lengkap. Simpan ulang dari dashboard.");
        }

        payload = chunkRows.results.map((row) => row.chunk_text || "").join("");
    } else {
        const row = await env.SETTINGS_DB
            .prepare("SELECT settings_json FROM site_settings WHERE id = ?1")
            .bind(SETTINGS_KEY)
            .first();
        payload = row?.settings_json || "";
    }

    try {
        return payload ? JSON.parse(payload) : null;
    } catch (error) {
        throw new Error("Data settings di D1 rusak atau bukan JSON valid.");
    }
}

export async function onRequestGet({ env }) {
    if (!env.SETTINGS_DB) {
        return json({ error: "Binding D1 SETTINGS_DB belum diset di Cloudflare Pages." }, { status: 500 });
    }

    try {
        const settings = await readSettings(env);
        if (!settings) {
            return json(
                {
                    error: "Settings belum ada di D1.",
                    detail: "Buka dashboard, isi pengaturan, lalu klik Simpan Pengaturan."
                },
                { status: 404 }
            );
        }
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

        const settings = body;
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

        await ensureSettingsTables(env);

        await env.SETTINGS_DB
            .prepare("DELETE FROM site_settings_chunks WHERE id = ?1")
            .bind(SETTINGS_KEY)
            .run();

        const chunks = [];
        for (let i = 0; i < settingsJson.length; i += CHUNK_SIZE) {
            chunks.push(settingsJson.slice(i, i + CHUNK_SIZE));
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

