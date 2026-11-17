# Habesha Fitness — Backend (API + PostgreSQL)

The server for the **Habesha Fitness** website. It keeps the gym's data in a **PostgreSQL** database, handles login, and can connect the website's chat assistant to an external AI (ChatGPT, Claude, Gemini or others).

- **PostgreSQL** database with real tables, constraints and foreign keys (created automatically).
- **Same data as the website.** Members, plans, trainers, payments, attendance, settings: the same shapes, rules and sample data as the React project.
- **One dependency:** `pg` (the official PostgreSQL driver for Node.js).
- **Tested.** `npm test` runs 18 automated checks against a real PostgreSQL server.

---

## 1. Run it

### Step A. Get PostgreSQL running

Pick **one** way.

**Option 1: Docker (easiest).** Install Docker Desktop, then in this folder:

```bash
docker compose up -d
```

**Option 2: Install PostgreSQL on your computer.** Download it from postgresql.org (Windows installer, 16 or newer works; 14+ is fine). During setup you choose a password for the user `postgres`, and keep the port `5432`. Put that password in `.env` (Step C).

**Option 3: A free hosted database** (Neon, Supabase, Railway or Render). Copy the connection string they give you into `DATABASE_URL` and set `DATABASE_SSL=true`.

### Step B. Install and start

1. Install **Node.js 20 or newer** from nodejs.org (check with `node -v`).
2. In this folder run:

```bash
npm install
npm start
```

You should see:

```
Habesha Fitness API running on http://localhost:4000
Database: PostgreSQL (localhost:5432/habesha_fitness)
AI chat: OFF (set AI_API_KEY in .env to enable)
Admin login: admin@habesha.demo
```

The first start **creates the database (if missing), creates all tables, and loads the sample data**. Later starts keep whatever is already stored.

Check it in your browser: <http://localhost:4000/api/health> (you should see `{"ok":true,...}`) and <http://localhost:4000/api/public> (gym details, plans, trainers).

### Step C. Settings (optional)

Copy `.env.example` to `.env` and edit it. Everything has a default that matches the Docker setup. The ones you will most likely change:

| Setting | Meaning |
| --- | --- |
| `DATABASE_URL` | `postgres://USER:PASSWORD@HOST:PORT/DATABASE`. If you installed PostgreSQL yourself, use the password you chose, for example `postgres://postgres:MyPassword@localhost:5432/habesha_fitness` |
| `DATABASE_SSL` | `true` for most hosted databases |
| `PORT` | Server port (default 4000) |
| `CORS_ORIGIN` | Website address allowed to use the API. Default is the Vite address `http://localhost:5173`. Add your real website address when you publish. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | The first administrator, created on first start. **Change the password before real use.** |
| `AI_*` | AI chat (see section 3) |

> The admin is created only when that email does not exist yet. To change the password later, log in and use "Change password" (`POST /api/auth/change-password`).

### Common problems

| Message | What it means |
| --- | --- |
| `Cannot reach PostgreSQL at localhost:5432` | PostgreSQL is not running. Start Docker (`docker compose up -d`) or the PostgreSQL service. |
| `PostgreSQL refused the password` | The password in `DATABASE_URL` is wrong. |
| `password authentication failed` on a hosted database | Copy the full connection string from the provider and set `DATABASE_SSL=true`. |

### Look inside the database

```bash
psql "postgres://postgres:postgres@localhost:5432/habesha_fitness"
```

then try `\dt` (list tables), `SELECT name, status FROM members LIMIT 5;`, `SELECT count(*) FROM attendance;`. Graphical tools such as pgAdmin or DBeaver work too.

### The tables

| Table | Holds | Notes |
| --- | --- | --- |
| `members` | Gym members | Unique email (case-insensitive). Deleting a plan or trainer sets the link to empty |
| `plans` | Membership plans | Price above 0, 1 to 36 months, benefits as text lists |
| `trainers` | Trainers | Deleting one un-assigns their members |
| `payments` | Payment records | Money is `numeric(10,2)` (exact decimals). Kept when a member is deleted |
| `attendance` | Check-ins and check-outs | Deleted with the member. The database itself refuses a second open check-in on the same day |
| `settings` | Gym name, contact, hours, notification switches | Exactly one row |
| `users` | Website accounts | Passwords stored as scrypt hashes |
| `sessions` | Logins | Only a hash of each login token is stored; they expire after 7 days |

The full definition (with comments) is the `SCHEMA` text near the top of `src/db.js`.

---

## 2. What the API can do

All requests and answers are JSON. Logged-in requests send the header `Authorization: Bearer <token>` (the token comes from login or register).

**Who may do what:** `public` = anyone, `user` = any logged-in account, `staff` = admin or staff, `admin` = administrator only. People who register on the website get the role `member` and **cannot** open the admin data.

### Account

| Method and path | Access | What it does |
| --- | --- | --- |
| `POST /api/auth/register` | public | `{name,email,phone,gender,password}` creates an account **and** a Pending member (like the website's Register page). Returns `{token,user}` |
| `POST /api/auth/login` | public | `{email,password}` returns `{token,user}` |
| `POST /api/auth/logout` | public | Ends this login |
| `GET /api/auth/me` | user | Current account |
| `PATCH /api/auth/profile` | user | Change name, phone, gender, title |
| `POST /api/auth/change-password` | user | `{current,next}`; other devices are logged out |

### Gym data

| Method and path | Access | What it does |
| --- | --- | --- |
| `GET /api/public` | public | Gym details, plans, trainers (no trainer phone/email). For the landing page |
| `GET /api/plans` | public | Membership plans |
| `GET /api/data` | staff | Everything in one go (what the React `DataContext` holds) |
| `GET/POST /api/members` | staff | List (filters `q`, `status`, `planId`) / add |
| `GET/PATCH/DELETE /api/members/:id` | staff | One member (with payments and attendance) / edit / delete (also deletes their attendance) |
| `POST /api/members/:id/assign-plan` | staff | `{planId, recordPayment=true, method}` sets plan, makes Active, extends expiry, records a payment |
| `POST /api/plans`, `PATCH/DELETE /api/plans/:id` | staff | Plans |
| `GET/POST /api/trainers`, `PATCH/DELETE /api/trainers/:id` | staff | Trainers (deleting un-assigns their members) |
| `GET/POST /api/payments`, `PATCH/DELETE /api/payments/:id` | staff | Payments (filters `status`, `method`, `memberId`, `from`, `to`). Records only: no money moves |
| `GET /api/attendance` | staff | Filters `date`, `memberId`, `open=true` |
| `POST /api/attendance/check-in` | staff | `{memberId}` (refuses a second open check-in today) |
| `POST /api/attendance/:id/check-out` | staff | Check out |
| `DELETE /api/attendance/:id` | staff | Delete a record |
| `GET /api/settings` | staff | Gym settings and notification preferences |
| `PATCH /api/settings` | **admin** | `gymName, email, phone, address, hours` |
| `PATCH /api/notifications` | staff | `newMember, payment, expiry, weekly` |
| `POST /api/reset` | **admin** | Restore the sample data (accounts are kept) |

Errors look like `{"error":"Please fix the highlighted fields","details":{"email":"Enter a valid email address"}}`. The `details` keys are the same field names the website forms use. Status codes: 400 bad input, 401 not logged in, 403 not allowed, 404 not found, 409 conflict (duplicate), 429 too many attempts.

**Rules enforced on the server** (same as the website's forms): name 3+ characters, valid email and phone, gender, Active members need a plan, expiry not before join date, no duplicate member emails, plan price above 0 and 1–36 months, payment amount above 0 and a valid date, password 8+ characters with letters and numbers.

---

## 3. Connect an external AI to the chat (optional)

The website's chat assistant already answers gym questions (prices, hours, registering, in English, Amharic and Tigrinya) without any AI. When you connect an AI:

- **Gym questions** still use the built-in answers (exact and free).
- **Fitness, nutrition, health and sport questions** go to the AI, which replies in the visitor's language.
- If the AI is off, unreachable, or out of credit, the chat quietly uses its built-in answer. Nothing breaks.

**Step 1.** Get an API key from a provider (you need an account with credit; check which payment methods they accept in Ethiopia):

| Provider | `AI_PROVIDER` | Example `AI_MODEL` | Notes |
| --- | --- | --- | --- |
| OpenAI (ChatGPT) | `openai` | `gpt-4o-mini` | |
| Anthropic (Claude) | `anthropic` | a current Claude model name | |
| Google (Gemini) | `gemini` | `gemini-1.5-flash` | |
| Groq, OpenRouter, a local Ollama | `openai-compatible` | their model name | also set `AI_BASE_URL`, for example `https://api.groq.com/openai/v1` |

Model names change over time; copy the current one from the provider's website.

**Step 2.** In `.env`:

```
AI_PROVIDER=openai
AI_API_KEY=paste-your-key-here
AI_MODEL=gpt-4o-mini
```

Restart the server. It should print `AI chat: ON (openai, gpt-4o-mini)`.

**Step 3.** In the **website** folder (`habesha-fitness`), copy `.env.example` to `.env`, remove the `#` before `VITE_API_URL=http://localhost:4000`, and restart `npm run dev`. Open the chat and ask: "How much protein should I eat to build muscle?"

**Protecting you and your money**
- The key lives only on the server (the `.env` file). The browser never sees it. Never put it in the website folder and never share the `.env` file.
- Each visitor (IP address) may ask 20 questions per hour (`AI_RATE_LIMIT_PER_HOUR`). Also set a monthly spending limit in the provider's dashboard.
- The AI is told: use only the real gym phone, address, hours and prices (taken live from your data); give general fitness information, not medical advice; send injuries and medical questions to a doctor; refuse unrelated topics.
- Errors from the provider are logged on the server and never shown to visitors.

---

## 4. Folder guide

```
server.js              Starts the server, checks login, sends errors
src/config.js          Settings from .env
src/db.js              PostgreSQL connection, table definitions (SCHEMA), sample data, transactions
src/seed.js            The sample data (copied from the website, so it matches)
src/dates.js           Date helpers (copied from the website)
src/auth.js            Passwords (scrypt), login tokens (kept in PostgreSQL), roles
src/validators.js      Validation rules (same as the website)
src/rateLimit.js       Limits for login and AI questions
src/ai.js              Talks to OpenAI / Anthropic / Gemini / compatible services
src/routes/auth.js     Register, login, profile, password
src/routes/data.js     Members, plans, trainers, payments, attendance, settings (SQL)
src/routes/chat.js     /api/chat/ask
test/api.test.js       18 automated checks:  npm test
docker-compose.yml     PostgreSQL in one command
```

### Running the tests

The tests create a temporary database, run everything against it, and delete it. They need a PostgreSQL server they may create databases on. With the Docker setup it just works:

```bash
npm test
```

For another server: `TEST_DATABASE_URL=postgres://user:password@host:5432/postgres npm test` (on Windows PowerShell: `$env:TEST_DATABASE_URL="..."; npm test`).

---

## 5. Honest notes (read before real use)

- **The website's admin pages still keep their data in the browser** (as in the original project). What is connected today: the chat (AI). The backend already provides every endpoint the pages need; the next step is to make the website's `DataContext.jsx` and `AuthContext.jsx` call these endpoints instead of localStorage. Ask for that step when you are ready; the pages themselves barely change.
- **First run on your computer.** The database code was tested against a real PostgreSQL 16 server, but the official `pg` package could not be downloaded in the environment where this was built, so the tests used a small stand-in that speaks the same PostgreSQL protocol. If `npm install && npm start` shows any error, send me the message and I will fix it.
- **All SQL uses parameters** (`$1, $2...`), never text glued into queries, so SQL injection is not possible through the API.
- **Time zone.** Check-in times and "today" use the server's clock. Set the computer or hosting service to `Africa/Addis_Ababa` (environment variable `TZ=Africa/Addis_Ababa`).
- **Passwords** use scrypt (a slow hash) and login is rate limited. There is no "forgot password" email yet (needs an email service). Login and AI rate limits are kept in memory, which is fine for one server process.
- **Run it behind HTTPS** when published (Render, Railway or a VPS with Caddy/Nginx do this). Set `CORS_ORIGIN` to your real website address and change `ADMIN_PASSWORD`.
- **Back up** the database regularly: `pg_dump "postgres://..." > backup.sql`. Never commit `.env` or share it.
- Payments are records only. Real payments need a payment provider.
