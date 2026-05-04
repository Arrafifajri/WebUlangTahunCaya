// TAGLINE: API backup/restore KV. Dipakai dashboard untuk mencadangkan media besar dari SETTINGS_KV.
const MAX_RESTORE_ITEM_BYTES = 25 * 1024 * 1024;
const MAX_RESTORE_ITEMS = 1200;

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

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000;

    for (let index = 0; index < bytes.length; index += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }

    return btoa(binary);
}

function base64ToArrayBuffer(value) {
    const raw = String(value || "").replace(/^data:[^,]+,/, "");
    const binary = atob(raw);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index++) {
        bytes[index] = binary.charCodeAt(index);
    }

    return bytes.buffer;
}

async function listAllKeys(env) {
    let cursor;
    const keys = [];

    do {
        const result = await env.SETTINGS_KV.list({ cursor, limit: 1000 });
        keys.push(...(result.keys || []));
        cursor = result.list_complete ? undefined : result.cursor;
    } while (cursor);

    return keys;
}

function normalizeRestoreItems(body) {
    const items = body?.kv?.items || body?.items || body?.database?.kvItems || [];
    return Array.isArray(items) ? items.slice(0, MAX_RESTORE_ITEMS) : [];
}

async function deleteAllKeys(env) {
    const keys = await listAllKeys(env);
    for (const item of keys) {
        await env.SETTINGS_KV.delete(item.name);
    }
    return keys.length;
}

export async function onRequestGet({ request, env }) {
    if (!isAuthorized(request, env)) {
        return json({ error: "Password dashboard salah atau ADMIN_PASSWORD belum diset." }, { status: 401 });
    }

    if (!env.SETTINGS_KV) {
        return json({ error: "Binding KV SETTINGS_KV belum diset di Cloudflare Pages." }, { status: 500 });
    }

    try {
        const url = new URL(request.url);
        const cursor = url.searchParams.get("cursor") || undefined;
        const prefix = url.searchParams.get("prefix") || undefined;
        const includeValues = url.searchParams.get("includeValues") === "1";
        const limit = Math.max(1, Math.min(1000, toSafeInteger(url.searchParams.get("limit"), 100)));
        const listOptions = { cursor, limit };
        if (prefix) listOptions.prefix = prefix;

        const listResult = await env.SETTINGS_KV.list(listOptions);
        const keys = listResult.keys || [];

        if (!includeValues) {
            return json({
                meta: {
                    backupType: "caya-birthday-web-kv-manifest",
                    format: "txt-json",
                    version: 1,
                    generatedAt: new Date().toISOString(),
                    namespaceBinding: "SETTINGS_KV",
                    note: "Manifest hanya daftar key. Dashboard mengambil value media per key lewat /api/media agar Worker tidak kena limit."
                },
                kv: {
                    itemCount: keys.length,
                    listComplete: Boolean(listResult.list_complete),
                    cursor: listResult.cursor || "",
                    items: keys.map((keyInfo) => ({
                        key: keyInfo.name,
                        metadata: keyInfo.metadata || {},
                        expiration: keyInfo.expiration || null
                    }))
                }
            });
        }

        const items = [];
        let totalBytes = 0;

        for (const keyInfo of keys) {
            const value = await env.SETTINGS_KV.getWithMetadata(keyInfo.name, { type: "arrayBuffer" });
            if (!value.value) continue;

            const bytes = value.value.byteLength;
            totalBytes += bytes;
            items.push({
                key: keyInfo.name,
                metadata: value.metadata || keyInfo.metadata || {},
                contentType: value.metadata?.contentType || "application/octet-stream",
                bytes,
                valueBase64: arrayBufferToBase64(value.value)
            });
        }

        return json({
            meta: {
                backupType: "caya-birthday-web-kv",
                format: "txt-json",
                version: 1,
                generatedAt: new Date().toISOString(),
                namespaceBinding: "SETTINGS_KV",
                note: "valueBase64 berisi isi file media dari Workers KV."
            },
            kv: {
                itemCount: items.length,
                totalBytes,
                listComplete: Boolean(listResult.list_complete),
                cursor: listResult.cursor || "",
                items
            }
        });
    } catch (error) {
        return json(
            {
                error: "Gagal membuat backup KV.",
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

    if (!env.SETTINGS_KV) {
        return json({ error: "Binding KV SETTINGS_KV belum diset di Cloudflare Pages." }, { status: 500 });
    }

    try {
        const body = await request.json();
        const items = normalizeRestoreItems(body);

        if (!items.length) {
            return json({ error: "File restore KV tidak punya item media." }, { status: 400 });
        }

        const replaceExisting = Boolean(body?.replaceExisting);
        const deletedCount = replaceExisting ? await deleteAllKeys(env) : 0;
        let restoredCount = 0;
        let totalBytes = 0;

        for (const item of items) {
            const key = limitText(item?.key, 512).trim();
            if (!key) continue;

            const buffer = base64ToArrayBuffer(item.valueBase64 || item.dataUrl || "");
            if (buffer.byteLength > MAX_RESTORE_ITEM_BYTES) {
                return json(
                    {
                        error: "Ada item KV terlalu besar.",
                        detail: `${key} berukuran ${buffer.byteLength} bytes, melewati batas ${MAX_RESTORE_ITEM_BYTES} bytes.`
                    },
                    { status: 413 }
                );
            }

            const metadata = {
                ...(item.metadata || {}),
                contentType: item.contentType || item.metadata?.contentType || "application/octet-stream",
                restoredAt: new Date().toISOString()
            };

            await env.SETTINGS_KV.put(key, buffer, { metadata });
            restoredCount++;
            totalBytes += buffer.byteLength;
        }

        return json({
            ok: true,
            restoredCount,
            deletedCount,
            totalBytes
        });
    } catch (error) {
        return json(
            {
                error: "Gagal restore KV.",
                detail: String(error && error.message ? error.message : error)
            },
            { status: 500 }
        );
    }
}
