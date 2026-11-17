# Habesha Fitness — Gym Management System (frontend demo)

React 19 + Vite. No backend: all data lives in your browser's localStorage.

## Run
    npm install
    npm run dev        # http://localhost:5173
    npm run build      # production build in dist/

## Demo login
Admin: admin@habesha.demo / Admin1234 (the "Fill in" button on the login page fills it).
Registering creates another local demo account.

## Languages and chat assistant
- Language dropdown (English / አማርኛ / ትግርኛ) at the top of the public pages, login and registration. The choice is remembered.
- The admin dashboard itself is still English (staff area).
- Chat assistant (bottom-right on public pages) answers in the language the visitor writes in. It is a built-in FAQ assistant,
  not a generative AI: topics and answers live in `src/chat/knowledge.js`; interface text in `src/i18n/translations.js`.
- Amharic and Tigrinya text should be proof-read by a native speaker before launch.
- **Optional AI:** with the separate `habesha-fitness-backend` running and `VITE_API_URL` set in `.env` (see `.env.example`), questions about
  fitness, nutrition, health and sport are answered by an external AI (ChatGPT, Claude, Gemini...) through the backend. Without it the chat works as before.
- Gym phone, address and hours: change them in the app under Settings (or in `src/store/seed.js`).

## Important
- Authentication is a DEMO flow that runs in the browser. It is NOT secure.
- Payments are simulated. No payment gateway is connected.
- Settings → Reset restores the original sample data.
