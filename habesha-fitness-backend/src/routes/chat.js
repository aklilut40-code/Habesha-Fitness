import { route, bad, HttpError, clientIp } from '../http.js';
import { aiEnabled, askAI } from '../ai.js';
import { hit } from '../rateLimit.js';
import { config } from '../config.js';

// GET /api/chat/status — lets the website know whether to use the AI fallback.
route('GET', '/api/chat/status', 'public', () => ({ aiEnabled: aiEnabled(), provider: aiEnabled() ? config.ai.provider : null }));

// POST /api/chat/ask { message, lang?: 'en'|'am'|'ti', history?: [{ from: 'user'|'bot', text }] }
// Public (visitors are not logged in), so it is rate limited per IP to protect your AI bill.
route('POST', '/api/chat/ask', 'public', async ({ req, body }) => {
  if (!aiEnabled()) throw new HttpError(503, 'AI answers are not enabled on this server', { aiEnabled: false });

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) throw bad('Write a question first', { message: 'Required' });
  if (message.length > 500) throw bad('Question is too long (500 characters max)', { message: 'Too long' });

  const lim = hit(`ai:${clientIp(req)}`, config.ai.perHour, 60 * 60 * 1000);
  if (!lim.ok) throw new HttpError(429, 'You have asked many questions. Please try again later or call the gym.', { retryAfter: lim.retryAfter });

  const past = (Array.isArray(body.history) ? body.history : [])
    .filter((m) => m && typeof m.text === 'string' && (m.from === 'user' || m.from === 'bot'))
    .slice(-6)
    .map((m) => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text.slice(0, 600) }));
  // Providers want the conversation to start with a user turn and alternate.
  while (past.length && past[0].role !== 'user') past.shift();
  const history = [];
  for (const m of past) {
    if (history.length && history[history.length - 1].role === m.role) history[history.length - 1] = m;
    else history.push(m);
  }
  if (history.length && history[history.length - 1].role === 'user') history.pop();
  history.push({ role: 'user', content: message });

  try {
    const answer = await askAI(history, ['en', 'am', 'ti'].includes(body.lang) ? body.lang : undefined);
    if (!answer) throw new Error('empty answer');
    return { answer };
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(502, 'The AI assistant is unavailable right now. Please try again, or call the gym.');
  }
});
