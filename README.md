# Ilm AI Frontend

Next.js web app for **Ilm AI** — personal AI learning companion.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Backend must run at `NEXT_PUBLIC_API_URL` (default `http://127.0.0.1:8000`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

## Features

- Sign up / log in with JWT
- Upload PDF, DOCX, TXT or paste content
- RAG chat with citations (EN / UZ / RU)
- Quiz, flashcards, learning plan, gaps report
- Premium subscription (test mode)
- Telegram bot linking & daily reminders

## Docker

```bash
docker build -t ilm-ai-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://host.docker.internal:8000 ilm-ai-frontend
```

Or use `docker compose up` from the backend repo.
