const SETTINGS_KEY = "birthday-settings";

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

export async function onRequestGet({ env }) {
    try {
        if (!env.SETTINGS_DB) {
            return json({ version: "no-db" });
        }

        const chunkRow = await env.SETTINGS_DB
            .prepare("SELECT updated_at FROM site_settings_chunks WHERE id = ?1 ORDER BY chunk_index DESC LIMIT 1")
            .bind(SETTINGS_KEY)
            .first();

        if (chunkRow?.updated_at) {
            return json({ version: String(chunkRow.updated_at) });
        }

        const legacyRow = await env.SETTINGS_DB
            .prepare("SELECT updated_at FROM site_settings WHERE id = ?1 LIMIT 1")
            .bind(SETTINGS_KEY)
            .first();

        return json({ version: String(legacyRow?.updated_at || "empty") });
    } catch (error) {
        return json(
            {
                error: "Gagal membaca versi settings.",
                detail: String(error && error.message ? error.message : error)
            },
            { status: 500 }
        );
    }
}

