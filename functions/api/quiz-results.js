const CREATE_QUIZ_TABLE_SQL =
    "CREATE TABLE IF NOT EXISTS quiz_results (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, score INTEGER NOT NULL, total INTEGER NOT NULL, duration_ms INTEGER NOT NULL, answers_json TEXT NOT NULL, user_agent TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)";
const MAX_ANSWERS = 80;
const MAX_ANSWERS_JSON_BYTES = 120_000;
const MAX_DURATION_MS = 24 * 60 * 60 * 1000;

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

async function ensureQuizTable(env) {
    if (!env.SETTINGS_DB) {
        throw new Error("Binding D1 SETTINGS_DB belum diset di Cloudflare Pages.");
    }

    await env.SETTINGS_DB.prepare(CREATE_QUIZ_TABLE_SQL).run();
}

function limitText(value, maxLength) {
    return String(value || "").slice(0, maxLength);
}

function toSafeInteger(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function normalizeAnswer(answer, index) {
    const selectedIndex = toSafeInteger(answer?.selectedIndex, -1);
    const correctIndex = toSafeInteger(answer?.correctIndex, -1);

    return {
        index,
        question: limitText(answer?.question, 500),
        selectedIndex,
        selectedOption: limitText(answer?.selectedOption, 300),
        correctIndex,
        correctOption: limitText(answer?.correctOption, 300),
        isCorrect: Boolean(answer?.isCorrect),
        answeredAt: limitText(answer?.answeredAt, 40)
    };
}

function getDurationMs(body) {
    const explicitDuration = toSafeInteger(body?.durationMs, -1);
    if (explicitDuration >= 0) return Math.min(explicitDuration, MAX_DURATION_MS);

    const startedAt = Date.parse(body?.startedAt || "");
    const finishedAt = Date.parse(body?.finishedAt || "");
    if (Number.isFinite(startedAt) && Number.isFinite(finishedAt) && finishedAt >= startedAt) {
        return Math.min(finishedAt - startedAt, MAX_DURATION_MS);
    }

    return 0;
}

export async function onRequestPost({ request, env }) {
    try {
        await ensureQuizTable(env);

        let body;
        try {
            body = await request.json();
        } catch (error) {
            return json({ error: "Body quiz harus JSON valid." }, { status: 400 });
        }

        const answers = Array.isArray(body?.answers)
            ? body.answers.slice(0, MAX_ANSWERS).map(normalizeAnswer)
            : [];
        const total = Math.max(0, toSafeInteger(body?.total, answers.length));
        const score = Math.max(0, Math.min(total || answers.length, toSafeInteger(body?.score, 0)));
        const durationMs = getDurationMs(body);
        const answersJson = JSON.stringify(answers);
        const answersBytes = new TextEncoder().encode(answersJson).length;

        if (!total || !answers.length) {
            return json({ error: "Hasil quiz kosong, jadi tidak disimpan." }, { status: 400 });
        }

        if (answersBytes > MAX_ANSWERS_JSON_BYTES) {
            return json({ error: "Data jawaban quiz terlalu besar untuk disimpan." }, { status: 413 });
        }

        const id = crypto.randomUUID();
        const sessionId = limitText(body?.sessionId || id, 80);
        const userAgent = limitText(request.headers.get("user-agent"), 300);

        await env.SETTINGS_DB
            .prepare(
                "INSERT INTO quiz_results (id, session_id, score, total, duration_ms, answers_json, user_agent, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, CURRENT_TIMESTAMP)"
            )
            .bind(id, sessionId, score, total, durationMs, answersJson, userAgent)
            .run();

        return json({ ok: true, id });
    } catch (error) {
        return json(
            {
                error: "Gagal menyimpan hasil quiz.",
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
        await ensureQuizTable(env);

        const url = new URL(request.url);
        const limit = Math.max(1, Math.min(100, toSafeInteger(url.searchParams.get("limit"), 50)));
        const rows = await env.SETTINGS_DB
            .prepare(
                "SELECT id, session_id, score, total, duration_ms, answers_json, user_agent, created_at FROM quiz_results ORDER BY created_at DESC LIMIT ?1"
            )
            .bind(limit)
            .all();

        const results = (rows?.results || []).map((row) => {
            let answers = [];
            try {
                answers = JSON.parse(row.answers_json || "[]");
            } catch (error) {
                answers = [];
            }

            return {
                id: row.id,
                sessionId: row.session_id,
                score: Number(row.score) || 0,
                total: Number(row.total) || 0,
                durationMs: Number(row.duration_ms) || 0,
                answers,
                userAgent: row.user_agent || "",
                createdAt: row.created_at
            };
        });

        return json({ results });
    } catch (error) {
        return json(
            {
                error: "Gagal membaca monitoring quiz.",
                detail: String(error && error.message ? error.message : error)
            },
            { status: 500 }
        );
    }
}
