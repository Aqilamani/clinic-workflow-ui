# ClinicFlow AI

An AI-powered clinical workflow management tool for small Malaysian clinics. Staff paste unstructured input — a doctor's note, a WhatsApp message, a brief description of a walk-in patient — and an LLM generates a structured workflow with steps, assignments, and priority. Workflows track in real time across devices.

**Live demo:** https://clinic-workflow-ui.vercel.app

## What it does

- **AI workflow generation** — paste free-text clinical input (English, Bahasa Malaysia, or mixed), get a structured workflow with 3-6 actionable steps, appropriate staff assignments, and priority detection.
- **Real-time task board** — kanban-style board syncing across all connected devices. Drag cards or click to advance.
- **Human review queue** — workflows flagged by AI for missing data are routed to a manager review screen with three quick-resolve actions.
- **Multi-page dashboard** — live counts, workflow queue with search/filter, profile management.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Zustand |
| Drag and drop | @dnd-kit |
| Backend | Supabase (Postgres + Auth + Realtime + Edge Functions) |
| LLM | Google Gemini 2.5 Flash Lite (via Edge Function) |
| Hosting | Vercel (frontend) + Supabase (database + functions) |

## Architecture

```
┌───────────────────┐
│   Vercel (Vite)   │  React app — UI, routing, optimistic updates
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│     Supabase      │
│  ┌─────────────┐  │
│  │  Postgres   │  │  5 tables, RLS, atomic create_workflow_from_glm()
│  │  + Realtime │  │  WebSocket subscriptions for live updates
│  │  + Auth     │  │  Email/password, session persistence
│  └─────────────┘  │
│  ┌─────────────┐  │
│  │ Edge Funcs  │  │  generate-workflow → Gemini API
│  └──────┬──────┘  │
└─────────┼─────────┘
          │
          ▼
   ┌──────────────┐
   │ Gemini API   │
   └──────────────┘
```

## Database schema

Five tables, single-clinic deployment, all-staff-can-approve permissions.

- `patients` — clinic patient records (supports `is_unknown=true` for walk-ins)
- `profiles` — extends `auth.users` with role + notification preferences
- `workflows` — top-level patient workflows
- `tasks` — steps within a workflow (drives both the workflow detail view and the kanban board)
- `review_flags` — workflows flagged for human review due to missing data

## Local setup

### Prerequisites

- Node.js 18+
- Supabase project (free tier works)
- Gemini API key (free tier works — get one at https://aistudio.google.com/apikey)

### Steps

```bash
# 1. Clone and install
git clone https://github.com/YOUR_USERNAME/clinic-workflow-ui.git
cd clinic-workflow-ui
npm install

# 2. Set up Supabase
# Run schema.sql in your Supabase SQL Editor
# Run create_workflow_function.sql in your Supabase SQL Editor

# 3. Set environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase URL + anon key

# 4. Set up Edge Function secret
npm install supabase --save-dev
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase secrets set GEMINI_API_KEY=your-gemini-key
npx supabase functions deploy generate-workflow

# 5. Run dev server
npm run dev
```

Visit `http://localhost:5173` and sign up to create your first account.

## File structure

```
src/
├── api/              Thin wrappers around Supabase queries
│   ├── glm.js        Calls the generate-workflow Edge Function
│   ├── profiles.js   User profile read/write
│   ├── reviewFlags.js Flag management + realtime subscription
│   ├── stats.js      Dashboard count aggregations
│   ├── tasks.js      Task CRUD + realtime subscription
│   └── workflows.js  Workflow CRUD + atomic create via RPC
├── components/       Shared UI pieces
├── lib/
│   ├── labels.js     Enum → display label mappings
│   └── supabase.js   Supabase client singleton
├── pages/            Route components
├── store/            Zustand global state
│   ├── useAuthStore.js
│   ├── useStatsStore.js
│   └── useToastStore.js
└── App.jsx           Router + auth gate
```

## Notable design decisions

**Atomic workflow creation via Postgres function.** When a user approves a workflow, we insert into 4 tables (patients, workflows, tasks, review_flags). Doing this as separate INSERTs would risk orphan data on partial failure. Instead, we use a single `create_workflow_from_glm` RPC that runs all inserts in a transaction — if any step fails, the entire creation rolls back.

**Edge Function for AI calls.** The Gemini API key is stored as a Supabase secret and only accessed server-side by the `generate-workflow` Edge Function. The frontend never sees it. CORS is restricted to the Vercel domain + localhost.

**Optimistic UI with rollback.** Task moves and workflow approvals update local state immediately, then write to the database. If the write fails, we roll back. Combined with realtime subscriptions, this gives instant feedback without sacrificing data correctness.

**Single source of truth for enums.** Database stores snake_case (`pending_review`), UI displays human-readable labels (`Pending Review`). All conversions live in `src/lib/labels.js`.

## License

MIT
