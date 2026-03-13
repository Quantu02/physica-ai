/**
 * PhysicaAI  —  /api/chat  (Gemini Edition)
 *
 * Secure backend proxy. Your Gemini API key lives ONLY here.
 * It is NEVER sent to the phone / browser.
 *
 * Flow:
 *   Phone app  →  POST /api/chat  →  Google Gemini API
 *              ←  JSON response   ←
 *
 * Set GEMINI_API_KEY in Vercel Dashboard → Settings → Environment Variables
 * Get your key at: https://aistudio.google.com/app/apikey
 */

export const config = {
  runtime: "edge",
};

// Gemini model — gemini-2.0-flash is fast and has a generous free tier
const GEMINI_MODEL = "gemini-2.0-flash";

export default async function handler(req) {
  // ── 1. Only allow POST ───────────────────────────────────
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── 2. Read API key from server environment ───────────────
  //    Vercel Dashboard → Project → Settings → Environment Variables
  //    Name: GEMINI_API_KEY   Value: your key from aistudio.google.com
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "Server configuration error. Please set GEMINI_API_KEY in Vercel environment variables.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── 3. Parse request body ────────────────────────────────
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages = [], system = "", max_tokens = 1000 } = body;

  if (!Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: "messages must be an array" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── 4. Convert messages to Gemini format ─────────────────
  //    Anthropic: { role: "assistant", content: "..." }
  //    Gemini:    { role: "model",     parts: [{ text: "..." }] }
  const geminiContents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content || "" }],
  }));

  // ── 5. Build Gemini request ──────────────────────────────
  const geminiPayload = {
    contents: geminiContents,
    generationConfig: {
      maxOutputTokens: max_tokens,
      temperature: 0.7,
      topP: 0.9,
    },
    ...(system
      ? { systemInstruction: { parts: [{ text: system }] } }
      : {}),
  };

  // ── 6. Call Gemini API ───────────────────────────────────
  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("[PhysicaAI] Gemini API error:", errText);
      return new Response(
        JSON.stringify({ error: `Gemini API error (${geminiRes.status})` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiRes.json();

    // ── 7. Extract text from Gemini response ─────────────────
    const text =
      geminiData?.candidates?.[0]?.content?.parts
        ?.filter((p) => p.text)
        ?.map((p) => p.text)
        ?.join("") || "";

    // Return in Anthropic-compatible shape — frontend needs zero changes
    return new Response(
      JSON.stringify({
        content: [{ type: "text", text }],
        model: GEMINI_MODEL,
        role: "assistant",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("[PhysicaAI] Gemini request failed:", error);
    return new Response(
      JSON.stringify({ error: "Failed to reach Gemini. Please try again." }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
