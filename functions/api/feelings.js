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

async function ensureFeelingsTable(env) {
    if (!env.SETTINGS_DB) {
        throw new Error("Binding D1 SETTINGS_DB belum diset di Cloudflare Pages.");
    }

    await env.SETTINGS_DB.prepare(CREATE_FEELINGS_TABLE_SQL).run();
}

function getWhatsAppConfig(env) {
    return {
        token: env.WHATSAPP_TOKEN || "",
        phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID || "",
        to: env.WHATSAPP_TO || "",
        version: env.WHATSAPP_API_VERSION || "v24.0"
    };
}

async function sendWhatsAppMessage(env, message) {
    const config = getWhatsAppConfig(env);
    if (!config.token || !config.phoneNumberId || !config.to) {
        return {
            sent: false,
            status: "not_configured",
            detail: "WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, atau WHATSAPP_TO belum diset."
        };
    }

    const response = await fetch(`https://graph.facebook.com/${config.version}/${config.phoneNumberId}/messages`, {
        method: "POST",
        headers: {
            authorization: `Bearer ${config.token}`,
            "content-type": "application/json"
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to: config.to,
            type: "text",
            text: {
                preview_url: false,
                body: message
            }
        })
    });

    const text = await response.text();
    if (!response.ok) {
        return {
            sent: false,
            status: "failed",
            detail: limitText(text || `HTTP ${response.status}`, 900)
        };
    }

    return {
        sent: true,
        status: "sent",
        detail: limitText(text, 900)
    };
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
        const createdAt = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
        const whatsappBody = [
            "Pesan perasaan baru dari web ulang tahun:",
            "",
            rawMessage,
            "",
            `Waktu: ${createdAt}`
        ].join("\n");
        const waResult = await sendWhatsAppMessage(env, whatsappBody);
        const userAgent = limitText(request.headers.get("user-agent"), 300);

        await env.SETTINGS_DB
            .prepare(
                "INSERT INTO feeling_messages (id, message, wa_status, wa_detail, user_agent, created_at) VALUES (?1, ?2, ?3, ?4, ?5, CURRENT_TIMESTAMP)"
            )
            .bind(id, rawMessage, waResult.status, waResult.detail, userAgent)
            .run();

        return json({
            ok: true,
            id,
            whatsappSent: waResult.sent,
            whatsappStatus: waResult.status
        }, { status: waResult.sent ? 200 : 202 });
    } catch (error) {
        return json(
            {
                error: "Gagal mengirim pesan perasaan.",
                detail: String(error && error.message ? error.message : error)
            },
            { status: 500 }
        );
    }
}
