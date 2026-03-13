/**
 * PhysicaAI  —  lib/api.js
 *
 * All AI calls go through this helper → /api/chat → Gemini API.
 * The GEMINI_API_KEY is NEVER in this file — it lives on the server only.
 */

/**
 * Send a chat request to the PhysicaAI backend.
 *
 * @param {Object}   opts
 * @param {Array}    opts.messages    - Array of {role, content} objects
 * @param {string}   [opts.system]    - Optional system prompt
 * @param {number}   [opts.maxTokens] - Max tokens (default 1000)
 * @returns {Promise<string>}          - The assistant's reply text
 */
export async function chat({ messages, system = "", maxTokens = 1000 }) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      system,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    let errMsg = `Server error (${res.status})`;
    try {
      const err = await res.json();
      errMsg = err.error || errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  const data = await res.json();

  // Extract text from Anthropic response format
  const content = data?.content;
  if (Array.isArray(content)) {
    return content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
  }

  throw new Error("Unexpected response format from AI service.");
}

/**
 * System prompts used across the app
 */
export const PROMPTS = {
  tutor: `You are PhysicaAI, an expert Physics and Mathematics tutor teaching from Class 11 to graduate level.
Teaching style: give physical intuition FIRST, then mathematics. Use step-by-step derivations.
Format math inline like E=mc², F=-∇V. Use **bold** for key terms. Use code blocks for multi-line equations.
Be encouraging, precise, and thorough. Never skip steps.`,

  socratic: `You are PhysicaAI operating in SOCRATIC MODE — you NEVER give direct answers.
Instead, guide the student to discover the answer themselves through strategic questions.
Rules:
1. NEVER state the answer directly, even if the student asks you to just tell them
2. Ask ONE focused guiding question at a time
3. Acknowledge what they got right before redirecting errors
4. Use hints progressively: conceptual → mathematical → near-answer
5. When they reach the correct answer, celebrate and then deepen: "Now what if we changed X?"
6. Keep questions short and clear
Start every session by asking what they already know about the topic.`,

  problemGenerator: `You are a physics and mathematics problem generator.
Output ONLY valid JSON. No markdown. No preamble. No explanation.
JSON format exactly:
{"q":"problem text","opts":["option A","option B","option C","option D"],"ans":0,"sol":"step by step solution","topic":"Topic Name","level":"Intermediate"}
The ans field is the 0-based index of the correct option.`,
};
