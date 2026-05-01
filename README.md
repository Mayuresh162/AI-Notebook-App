# 🧠 AI Notebook (Chat with Your Sources)

An AI-powered research assistant that lets you chat with your own data - including PDFs, web articles, YouTube videos, GitHub repos, Notion, and Google Drive - using a powerful Retrieval-Augmented Generation (RAG) pipeline.

---

## 🚀 Features

### 📚 Multi-Source Ingestion

* 📄 Upload PDFs and multiple file types (txt, md, code, etc.)
* 🌐 Add web URLs and parse articles
* 🎥 Add YouTube videos and process transcripts
* 💻 Ingest GitHub repositories
* 📝 Sync Notion pages
* 📁 Sync Google Drive files
* ✍️ Paste raw text

---

### 🤖 AI Chat (RAG)

* 💬 Chat with all your sources
* 🔎 Semantic search using embeddings (pgvector)
* 📚 Source-grounded answers with structured context
* ⚡ Real-time streaming responses
* 🧠 Improved retrieval:

  * smarter chunking (with overlap)
  * similarity ranking
  * deduplication
  * top-k selection

---

### 🔄 Sync System

* 🔄 Manual sync for all integrations
* ⏱️ Background sync via cron (Supabase)
* 📊 Tracks last synced state per integration

---

### 🔐 Authentication

* Google OAuth (Supabase Auth)
* Secure session handling
* User-isolated data (multi-tenant)

---

### 🌍 Environment Isolation

* Separate **dev vs prod data** using `env` column
* Prevents local testing from polluting production
* Ensures clean embeddings + retrieval

---

### 🎨 UI / UX

* 📱 Mobile responsive layout
* 🧭 Redesigned sidebar (clean + organized)
* 🔄 Unified “Sync Connected Apps” action
* 🔔 Toast notifications (Sonner)
* 💾 Chat history persistence (localStorage)

---

## 🏗️ Tech Stack

### Frontend

* Next.js (App Router)
* React
* Tailwind CSS
* shadcn/ui
* Sonner

### Backend

* Next.js API Routes
* Supabase (Postgres + pgvector + Auth)

### AI / ML

* OpenAI (embeddings)
* Groq / OpenAI / Ollama (LLMs)
* RAG (Retrieval-Augmented Generation)

---

## 🧠 Architecture Overview

1. Upload / connect a source (PDF, URL, GitHub, Notion, Drive, etc.)
2. Extract text
3. Chunk text with overlap
4. Generate embeddings
5. Store in Supabase (with user + env isolation)
6. User asks a question
7. Perform vector similarity search
8. Deduplicate + rank results
9. Build structured context
10. Send context + query to LLM
11. Stream response to UI

---

## ⚙️ Setup Instructions

### 1. Clone repo

```bash
git clone https://github.com/Mayuresh162/ai-notebook.git
cd ai-notebook
```

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Setup Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# LLM Providers (optional)
OPENAI_API_KEY=your_key
GROQ_API_KEY=your_key
```

---

### 4. Setup Supabase

Create tables:

### `documents`

| column    | type   |
| --------- | ------ |
| id        | uuid   |
| content   | text   |
| embedding | vector |
| metadata  | jsonb  |
| user_id   | uuid   |
| env       | text   |

---

### `integrations`

| column         | type      |
| -------------- | --------- |
| id             | uuid      |
| user_id        | uuid      |
| provider       | text      |
| access_token   | text      |
| refresh_token  | text      |
| last_synced_at | timestamp |
| env            | text      |

---

👉 Ensure embedding dimensions match your model (e.g. 1536)

---

### 5. Run locally

```bash
npm run dev
```

---

## 🧪 Usage

* Upload or connect sources
* Sync integrations (Notion / Drive)
* Sources appear in sidebar
* Ask questions in chat
* Get grounded answers with citations

---

## 🌐 Deployment

Recommended: Vercel

Steps:

* Push to GitHub
* Import into Vercel
* Add environment variables
* Deploy

---

## ⚠️ Notes

* Ollama won’t work on Vercel (local only)
* Use OpenAI / Groq in production
* Ensure embedding model consistency
* Supabase cron required for background sync

---

## 🔮 Roadmap

* 💬 Conversation threads / persistent chat
* 🔑 BYOK (Bring Your Own API Key)
* 🔍 Hybrid search (keyword + vector)
* 📌 Better citation UI (highlight snippets)
* 🧠 Memory + personalization
* 💰 Monetization

---

## ⭐ If you like this project

Give it a star on GitHub!
