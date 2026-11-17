import { config } from './config.js';
import { query } from './db.js';

// Connects the website's chat assistant to an external AI model.
// The API key stays on this server; the browser never sees it.
export const aiEnabled = () => !!config.ai.key;

const LANG_NAMES = { en: 'English', am: 'Amharic (አማርኛ)', ti: 'Tigrinya (ትግርኛ)' };

async function systemPrompt(lang) {
  const settings = (await query('SELECT gym_name AS "gymName", email, phone, address, hours FROM settings WHERE id = 1')).rows[0];
  const plans = (await query('SELECT name, price, duration_months AS "durationMonths" FROM plans ORDER BY seq')).rows;
  const planLines = plans.map((p) => `- ${p.name}: $${p.price} per ${p.durationMonths === 1 ? 'month' : `${p.durationMonths} months`}`).join('\n');
  return [
    `You are the friendly chat assistant of "${settings.gymName}", a gym in Mekelle, Ethiopia. You answer visitors on the gym's website.`,
    '',
    'LANGUAGE: Reply in the same language the visitor writes in. The visitor may write English, Amharic (አማርኛ) or Tigrinya (ትግርኛ); these two use the same Ge\'ez script, so decide from the words and grammar.' +
      (lang && LANG_NAMES[lang] ? ` If unsure, use ${LANG_NAMES[lang]}.` : ''),
    '',
    'GYM FACTS (the only source for facts about this gym; never invent prices, hours, phone numbers or services):',
    `- Phone: ${settings.phone}`,
    `- Email: ${settings.email}`,
    `- Address: ${settings.address}`,
    `- Opening hours: ${settings.hours}`,
    'Membership plans:',
    planLines,
    '',
    'WHAT YOU MAY DISCUSS: the gym, its website (registering, logging in), and general fitness, exercise technique, workout ideas, healthy eating, sport and recovery.',
    'SAFETY: give general information only, not medical advice. For injuries, pain, medical conditions, pregnancy, eating disorders or medication, tell the person to see a doctor or qualified professional. Never suggest extreme diets or dangerous training.',
    'If asked something unrelated to the gym, fitness, health or sport, politely say you can only help with those topics.',
    'If you do not know a gym-specific fact, say so and give the gym phone number.',
    'STYLE: warm, short (under 120 words), plain text with no markdown.',
  ].join('\n');
}

async function post(url, headers, body) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), signal: ctrl.signal });
    const text = await r.text();
    let json = {};
    try { json = JSON.parse(text); } catch { /* keep empty */ }
    if (!r.ok) {
      console.error(`[ai] ${config.ai.provider} answered ${r.status}: ${text.slice(0, 300)}`);
      const err = new Error('The AI service could not answer right now');
      err.upstream = r.status;
      throw err;
    }
    return json;
  } finally {
    clearTimeout(t);
  }
}

// history: [{ role: 'user' | 'assistant', content }] (already cleaned), ending with the user's new message.
export async function askAI(history, lang) {
  const { provider, key, model, baseUrl } = config.ai;
  const system = await systemPrompt(lang);

  if (provider === 'anthropic') {
    const j = await post('https://api.anthropic.com/v1/messages', { 'x-api-key': key, 'anthropic-version': '2023-06-01' }, {
      model, max_tokens: 400, system, messages: history,
    });
    return j.content?.map((c) => c.text || '').join('').trim();
  }

  if (provider === 'gemini') {
    const j = await post(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { 'x-goog-api-key': key }, {
      systemInstruction: { parts: [{ text: system }] },
      contents: history.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      generationConfig: { maxOutputTokens: 400, temperature: 0.5 },
    });
    return j.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
  }

  // openai and openai-compatible (Groq, OpenRouter, Ollama, ...)
  const base = provider === 'openai' ? 'https://api.openai.com/v1' : baseUrl.replace(/\/$/, '');
  if (!base) throw new Error('AI_BASE_URL is required for openai-compatible');
  const j = await post(`${base}/chat/completions`, { Authorization: `Bearer ${key}` }, {
    model, max_tokens: 400, temperature: 0.5,
    messages: [{ role: 'system', content: system }, ...history],
  });
  return j.choices?.[0]?.message?.content?.trim();
}
