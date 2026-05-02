// TAGLINE: API login dashboard, hanya mengecek ADMIN_PASSWORD dari Cloudflare Secret.
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

export async function onRequestPost({ request, env }) {
    const password = request.headers.get("x-admin-password") || "";

    if (!env.ADMIN_PASSWORD) {
        return json({ error: "ADMIN_PASSWORD belum diset di Cloudflare." }, { status: 500 });
    }

    if (password !== env.ADMIN_PASSWORD) {
        return json({ error: "Password salah." }, { status: 401 });
    }

    return json({ ok: true });
}
