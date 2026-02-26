# AutoPenguin

AI-powered business automation platform. Manage clients, projects, finances, and workflows through a conversational AI assistant — or the traditional dashboard. Self-host it or use the cloud version.

## Features

- **AI Assistant** — Chat-first interface that manages your business through natural language. Learns your preferences over time. Configurable name, personality, and LLM provider.
- **CRM** — Contacts, clients, companies, and deal tracking with pipeline management.
- **Project Management** — Projects, tasks, assignments, and status tracking.
- **Talent & Bookings** — Manage talent rosters, availability, rates, and bookings.
- **Finance** — Invoices with auto-numbering, expense tracking, revenue analytics.
- **Workflow Automation** — Connect your n8n instance to automate repetitive work. Sync workflows, track executions, trigger actions from chat.
- **Multi-Industry** — Adapts UI, terminology, and KPIs based on your industry (real estate, talent agency, general business, and more).
- **BYOLLM** — Bring your own LLM. Supports OpenRouter, OpenAI, Anthropic, Google, and Ollama for fully offline operation.
- **Internationalization** — Multi-language support via i18next.

## Quick Start (Cloud)

Sign up at [autopenguin.app](https://autopenguin.app) and you're ready to go. No setup required.

## Self-Hosting

Self-hosting runs the full stack locally: PostgreSQL, authentication, REST API, realtime subscriptions, file storage, edge functions, and a bundled Ollama instance for offline AI.

### Requirements

- Docker and Docker Compose V2
- 4 GB RAM minimum (8 GB recommended)
- 10 GB disk space (includes Ollama model download)

### Setup

```bash
git clone https://github.com/autopenguin-ai/autopenguin.git
cd autopenguin
./docker/setup.sh
```

The setup script will:

1. Check prerequisites (Docker, memory)
2. Generate JWT secrets and Supabase keys
3. Optionally configure a cloud LLM API key (or use bundled Ollama)
4. Optionally configure email via Resend (or auto-confirm accounts)
5. Write a `.env` file and start all services

Once running:

| Service | URL |
|---------|-----|
| App | [http://localhost:3000](http://localhost:3000) |
| API (Kong) | [http://localhost:8000](http://localhost:8000) |
| Studio | [http://localhost:8443](http://localhost:8443) |
| Ollama | [http://localhost:11434](http://localhost:11434) |

### Common Commands

```bash
docker compose -f docker/docker-compose.yml logs -f       # View logs
docker compose -f docker/docker-compose.yml down           # Stop
docker compose -f docker/docker-compose.yml up -d          # Start
docker compose -f docker/docker-compose.yml up -d --build  # Rebuild after updates
```

### GPU Support (Ollama)

To enable GPU acceleration for the bundled Ollama instance, uncomment the `deploy` section in `docker/docker-compose.yml` under the `ollama` service.

## Development

### Prerequisites

- Node.js 18+
- npm

### Running Locally

```bash
npm install
npm run dev
```

This starts the Vite dev server. You'll need a running Supabase instance (cloud or self-hosted) and the appropriate environment variables.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| State | TanStack Query (React Query) |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| Edge Functions | Deno (TypeScript) |
| API Gateway | Kong |
| Self-Hosting | Docker Compose |
| Local AI | Ollama |
| Charts | Recharts |
| Forms | React Hook Form + Zod |

## Project Structure

```
autopenguin/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── contexts/           # React contexts (auth, industry, theme)
│   ├── hooks/              # Custom hooks (data fetching, AI chat)
│   ├── pages/              # Route pages
│   └── lib/                # Utilities
├── supabase/
│   ├── functions/          # Deno edge functions
│   └── migrations/         # PostgreSQL migrations
├── docker/
│   ├── docker-compose.yml  # Full self-hosted stack
│   ├── setup.sh            # One-command setup script
│   ├── Dockerfile.frontend # Frontend build
│   ├── kong.yml            # API gateway config
│   └── nginx.conf          # Frontend server config
└── public/                 # Static assets
```

## Environment Variables

### Frontend (.env)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase API URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |

### Edge Functions / Docker

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Internal Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (full access) |
| `APP_URL` | Public app URL |
| `JWT_SECRET` | JWT signing secret |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `OLLAMA_HOST` | Ollama API endpoint |
| `RESEND_API_KEY` | Resend API key (optional, for email) |
| `OPENROUTER_API_KEY` | OpenRouter API key (optional) |
| `OPENAI_API_KEY` | OpenAI API key (optional) |
| `N8N_WEBHOOK_SECRET` | Shared secret for n8n webhooks |

LLM API keys are optional. Users configure their own provider and key in the app settings (stored securely in Supabase Vault).

## n8n Integration

1. Go to **Settings > Integrations** in the app.
2. Add your n8n instance URL and API key.
3. Workflows sync automatically. Executions are tracked in the Automations dashboard.
4. The AI assistant can query workflow data and trigger actions.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

[MIT](LICENSE)
