// TAGLINE: API media upload/download. File besar disimpan di KV, bukan di D1.
const MAX_MEDIA_BYTES = 8 * 1024 * 1024;

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

function parseDataUrl(dataUrl) {
    const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(String(dataUrl || ""));
    if (!match || !match[2]) {
        throw new Error("Media harus berupa data URL base64.");
    }

    const contentType = match[1] || "application/octet-stream";
    const binary = atob(match[3]);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) {
        bytes[index] = binary.charCodeAt(index);
    }

    return { bytes, contentType };
}

function makeKey(kind, filename) {
    const safeName = String(filename || "media")
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || "media";
    const randomPart = crypto.randomUUID();
    return `${kind || "media"}/${Date.now()}-${randomPart}-${safeName}`;
}

export async function onRequestGet({ request, env }) {
    if (!env.SETTINGS_KV) {
        return json({ error: "Binding KV SETTINGS_KV belum diset di Cloudflare Pages." }, { status: 500 });
    }

    const url = new URL(request.url);
    const key = url.searchParams.get("key");
    if (!key) {
        return json({ error: "Parameter key wajib diisi." }, { status: 400 });
    }

    const value = await env.SETTINGS_KV.getWithMetadata(key, { type: "arrayBuffer" });
    if (!value.value) {
        return json({ error: "Media tidak ditemukan." }, { status: 404 });
    }

    return new Response(value.value, {
        headers: {
            "content-type": value.metadata?.contentType || "application/octet-stream",
            "cache-control": "public, max-age=31536000, immutable"
        }
    });
}

export async function onRequestPost({ request, env }) {
    if (!isAuthorized(request, env)) {
        return json({ error: "Password dashboard salah atau ADMIN_PASSWORD belum diset." }, { status: 401 });
    }

    if (!env.SETTINGS_KV) {
        return json({ error: "Binding KV SETTINGS_KV belum diset di Cloudflare Pages." }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { bytes, contentType } = parseDataUrl(body.dataUrl);

        if (bytes.byteLength > MAX_MEDIA_BYTES) {
            return json(
                {
                    error: "Media terlalu besar.",
                    detail: `Ukuran ${bytes.byteLength} bytes melewati batas ${MAX_MEDIA_BYTES} bytes. Kompres file lebih kecil dulu.`
                },
                { status: 413 }
            );
        }

        const kind = String(body.kind || "media").replace(/[^a-z0-9_-]/gi, "").toLowerCase() || "media";
        const key = makeKey(kind, body.filename);
        await env.SETTINGS_KV.put(key, bytes.buffer, {
            metadata: {
                contentType,
                filename: String(body.filename || ""),
                uploadedAt: new Date().toISOString()
            }
        });

        return json({
            ok: true,
            key,
            src: `/api/media?key=${encodeURIComponent(key)}`,
            contentType,
            bytes: bytes.byteLength
        });
    } catch (error) {
        return json(
            {
                error: "Gagal upload media ke KV.",
                detail: String(error && error.message ? error.message : error)
            },
            { status: 500 }
        );
    }
}
