import { Groq } from "groq-sdk";

/**
 * Instantiates the Groq client securely using server-side environment variables.
 */
export const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("GROQ_API_KEY is not defined in the environment. Client calls will fail without key.");
  }
  return new Groq({
    apiKey: apiKey || "dummy-key",
  });
};

// ── OpenAI fallback via native fetch ─────────────────────────────────────────
const callOpenAI = async (prompt, systemPrompt, options = {}) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model || "gpt-4o-mini",
      temperature: options.temperature ?? 0,
      max_tokens: options.max_tokens || 4000,
      ...(options.json !== false ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`OpenAI API error ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
};

/**
 * Expert analysis utility — tries Groq first, falls back to OpenAI.
 * Consistently returns structured JSON records.
 * 
 * @param {string} prompt - User request containing target document text or parameters.
 * @param {string} systemPrompt - Guidelines enforcing systemic constraints and structure.
 * @returns {Promise<object>} - Parsed JSON object.
 */
export async function analyzeWithGroq(prompt, systemPrompt) {
  // ── Try Groq first ──
  const groq = getGroqClient();
  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });

    const outputText = response.choices[0]?.message?.content || "{}";
    return JSON.parse(outputText);
  } catch (groqError) {
    console.warn("Groq failed, trying OpenAI fallback:", groqError.message?.slice(0, 100));
  }

  // ── OpenAI fallback ──
  try {
    const outputText = await callOpenAI(prompt, systemPrompt, { json: true });
    if (outputText) {
      try { return JSON.parse(outputText); } catch {
        const match = outputText.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
      }
    }
  } catch (openaiError) {
    console.error("OpenAI fallback also failed:", openaiError.message?.slice(0, 100));
  }

  // Return standard error container ensuring valid JSON is ALWAYS returned
  return {
    error: true,
    message: "Both Groq and OpenAI failed",
    fallback: true
  };
}

/**
 * Utility to run standard chat completions — tries Groq first, falls back to OpenAI.
 */
export const runBidCompletion = async (systemPrompt, userPrompt, temperature = 0.2) => {
  // ── Try Groq first ──
  const groq = getGroqClient();
  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "llama-3.1-8b-instant",
      temperature,
    });
    return response.choices[0]?.message?.content || "";
  } catch (groqError) {
    console.warn("Groq completion failed, trying OpenAI:", groqError.message?.slice(0, 100));
  }

  // ── OpenAI fallback ──
  try {
    const result = await callOpenAI(userPrompt, systemPrompt, { temperature, json: false });
    if (result) return result;
  } catch (openaiError) {
    console.error("OpenAI completion fallback also failed:", openaiError.message?.slice(0, 100));
  }

  throw new Error("Failed to generate completion: both Groq and OpenAI are unavailable.");
};
