import { config } from './config.js';
import { query } from './db.js';

// Connects the website's chat assistant to an external AI model.
// The API key stays on this server; the browser never sees it.
export const aiEnabled = () => !!config.ai.key;

const LANG_NAMES = { en: 'English', am: 'Amharic (አማርኛ)', ti: 'Tigrinya (ትግርኛ)' };

function gymPrompt(settings, planLines, lang) {
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

function generalPrompt(settings, planLines, lang) {
  return [
    `You are a knowledgeable, helpful and friendly AI assistant on the "${settings.gymName}" website in Mekelle, Ethiopia.`,
    '',
    'TOPICS & CAPABILITIES: You are a full, unrestricted assistant. Answer any question on ANY topic the visitor asks: general knowledge, current events and news, sports, school and study help, science, math, technology, coding, history, health, fitness, recipes, advice, and daily life.',
    'KNOWLEDGE & WEB SEARCH: Use your own knowledge AND live web search for anything recent, changing, or specific. When you searched the web, briefly name the source website in your answer.',
    '',
    'GYM FACTS (use ONLY when the visitor asks about the gym itself, membership, or this website; never invent gym facts, prices, hours, phone numbers or services):',
    `- Phone: ${settings.phone}`,
    `- Email: ${settings.email}`,
    `- Address: ${settings.address}`,
    `- Opening hours: ${settings.hours}`,
    'Membership plans:',
    planLines,
    `If you do not know a gym-specific fact, say so honestly and provide the gym phone number: ${settings.phone}.`,
    '',
    'SAFETY & ETHICS: Be honest when unsure. Refuse harmful, dangerous, or illegal requests. Give only general information for medical, legal and financial/money topics, advising the visitor to consult a qualified professional.',
    '',
    'LANGUAGE: Reply in the same language the visitor writes in. The visitor may write English, Amharic (አማርኛ) or Tigrinya (ትግርኛ); these two use the same Ge\'ez script, so decide from the words and grammar.' +
      (lang && LANG_NAMES[lang] ? ` If unsure, use ${LANG_NAMES[lang]}.` : ''),
    '',
    'STYLE: Keep replies concise, helpful, under 180 words, and in plain text (no markdown formatting).',
  ].join('\n');
}

async function systemPrompt(lang) {
  const settings = (await query('SELECT gym_name AS "gymName", email, phone, address, hours FROM settings WHERE id = 1')).rows[0];
  const plans = (await query('SELECT name, price, duration_months AS "durationMonths" FROM plans ORDER BY seq')).rows;
  const planLines = plans.map((p) => `- ${p.name}: $${p.price} per ${p.durationMonths === 1 ? 'month' : `${p.durationMonths} months`}`).join('\n');

  if (config.ai.scope === 'gym') {
    return gymPrompt(settings, planLines, lang);
  }
  return generalPrompt(settings, planLines, lang);
}

async function post(url, headers, body) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 40000);
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
  const { provider, key, model, baseUrl, webSearch } = config.ai;
  const system = await systemPrompt(lang);

  if (provider === 'anthropic') {
    const body = {
      model,
      max_tokens: 800,
      system,
      messages: history,
    };
    if (webSearch) {
      body.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }];
    }
    const j = await post('https://api.anthropic.com/v1/messages', { 'x-api-key': key, 'anthropic-version': '2023-06-01' }, body);
    return j.content?.map((c) => c.text || '').join('').trim();
  }

  if (provider === 'gemini') {
    const body = {
      systemInstruction: { parts: [{ text: system }] },
      contents: history.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      generationConfig: { maxOutputTokens: 800, temperature: 0.5 },
    };
    if (webSearch) {
      body.tools = [{ google_search: {} }];
    }
    const j = await post(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { 'x-goog-api-key': key }, body);
    return j.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
  }

  // openai and openai-compatible (Groq, OpenRouter, Ollama, ...)
  const base = provider === 'openai' ? 'https://api.openai.com/v1' : baseUrl.replace(/\/$/, '');
  if (!base) throw new Error('AI_BASE_URL is required for openai-compatible');
  const j = await post(`${base}/chat/completions`, { Authorization: `Bearer ${key}` }, {
    model, max_tokens: 800, temperature: 0.5,
    messages: [{ role: 'system', content: system }, ...history],
  });
  return j.choices?.[0]?.message?.content?.trim();
}
