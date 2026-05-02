// TAGLINE: API pesan perasaan. Publik POST pesan, dashboard GET dengan password.
// Catatan: nama kolom wa_status/wa_detail dipertahankan agar D1 lama tetap kompatibel.
const CREATE_FEELINGS_TABLE_SQL =
    "CREATE TABLE IF NOT EXISTS feeling_messages (id TEXT PRIMARY KEY, message TEXT NOT NULL, wa_status TEXT NOT NULL, wa_detail TEXT, user_agent TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)";
const MAX_MESSAGE_LENGTH = 1200;

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

function limitText(value, maxLength) {
    return String(value || "").slice(0, maxLength);
}

function isAuthorized(request, env) {
    const password = request.headers.get("x-admin-password") || "";
    return Boolean(env.ADMIN_PASSWORD) && password === env.ADMIN_PASSWORD;
}

function toSafeInteger(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

async function ensureFeelingsTable(env) {
    if (!env.SETTINGS_DB) {
        throw new Error("Binding D1 SETTINGS_DB belum diset di Cloudflare Pages.");
    }

    await env.SETTINGS_DB.prepare(CREATE_FEELINGS_TABLE_SQL).run();
}

export async function onRequestPost({ request, env }) {
    try {
        await ensureFeelingsTable(env);

        let body;
        try {
            body = await request.json();
        } catch (error) {
            return json({ error: "Body harus JSON valid." }, { status: 400 });
        }

        const rawMessage = limitText(body?.message, MAX_MESSAGE_LENGTH).trim();
        if (!rawMessage) {
            return json({ error: "Pesan masih kosong." }, { status: 400 });
        }

        const id = crypto.randomUUID();
        const userAgent = limitText(request.headers.get("user-agent"), 300);

        await env.SETTINGS_DB
            .prepare(
                "INSERT INTO feeling_messages (id, message, wa_status, wa_detail, user_agent, created_at) VALUES (?1, ?2, ?3, ?4, ?5, CURRENT_TIMESTAMP)"
            )
            .bind(id, rawMessage, "database_saved", "Tersimpan di Cloudflare D1.", userAgent)
            .run();

        return json({
            ok: true,
            id,
            saved: true
        });
    } catch (error) {
        return json(
            {
                error: "Gagal menyimpan pesan perasaan.",
                detail: String(error && error.message ? error.message : error)
            },
            { status: 500 }
        );
    }
}

export async function onRequestGet({ request, env }) {
    if (!isAuthorized(request, env)) {
        return json({ error: "Password dashboard salah atau ADMIN_PASSWORD belum diset." }, { status: 401 });
    }

    try {
        await ensureFeelingsTable(env);

        const url = new URL(request.url);
        const limit = Math.max(1, Math.min(100, toSafeInteger(url.searchParams.get("limit"), 50)));
        const rows = await env.SETTINGS_DB
            .prepare(
                "SELECT id, message, wa_status, wa_detail, user_agent, created_at FROM feeling_messages ORDER BY created_at DESC LIMIT ?1"
            )
            .bind(limit)
            .all();

        return json({
            messages: (rows?.results || []).map((row) => ({
                id: row.id,
                message: row.message || "",
                status: row.wa_status || "database_saved",
                detail: row.wa_detail || "",
                userAgent: row.user_agent || "",
                createdAt: row.created_at
            }))
        });
    } catch (error) {
        return json(
            {
                error: "Gagal membaca pesan perasaan.",
                detail: String(error && error.message ? error.message : error)
            },
            { status: 500 }
        );
    }
}
