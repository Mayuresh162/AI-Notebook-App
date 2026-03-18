# 🧠 AI Notebook (Chat with Your Sources)

An AI-powered research assistant that lets you chat with your own data — including PDFs, web articles, YouTube videos, and raw text — using a Retrieval-Augmented Generation (RAG) pipeline.

## 🚀 Features

- 📄 Upload PDFs and extract content
- 🌐 Add web URLs and parse articles
- 🎥 Add YouTube videos and process transcripts
- ✍️ Paste raw text for quick analysis
- 💬 Chat with all your sources using AI
- ⚡ Real-time streaming responses
- 🔎 Semantic search using embeddings
- 📚 Source-grounded answers with citations
- 🔄 Auto-refresh sources after ingestion
- 🔔 Toast notifications for success/error states (Sonner)
- 💾 Chat history persistence (localStorage)
- 🎨 Clean, modern UI

## 🏗️ Tech Stack

### Frontend

- Next.js (App Router)
- React
- Tailwind CSS
- shadcn/ui
- Sonner (toast notifications)

### Backend

- Next.js API Routes
- Supabase (Postgres + pgvector)
- AI / ML
- Embeddings (OpenAI)
- LLM (Groq / OpenAI / Ollama)
- RAG (Retrieval-Augmented Generation)

## 🧠 Architecture Overview

1. Upload source (PDF / URL / YouTube / Text)
2. Extract text using appropriate loader
3. Split text into chunks
4. Generate embeddings for each chunk
5. Store embeddings in Supabase (pgvector)
6. User asks a question
7. Perform similarity search on embeddings
8. Retrieve relevant chunks (context)
9. Send context + query to LLM
10. Stream response back to UI
11. Attach sources for grounded answers

## ⚙️ Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/Mayuresh162/ai-notebook.git
cd ai-notebook
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# Choose ONE (or more):
OPENAI_API_KEY=your_key
GROQ_API_KEY=your_key
```

### 4. Setup Supabase

- Create a project
- Create a table: `documents`
Example schema:

| column  | type |
| ------- |:----:|
| id      | uuid |
| content | text |
| embedding | vector |
| metadata | jsonb |

👉 Important: Ensure embedding dimensions match your model (e.g. 1536 for OpenAI)

### 5. Run locally

```bash
npm run dev
```

## 🧪 Usage

- Upload a PDF, paste a URL, YouTube link, or raw text
- Wait for processing (toast notifications shown)
- Sources auto-update in UI
- Ask questions in chat
- Get AI-generated answers grounded in your data

## 🌐 Deployment

Recommended: Vercel

Steps:

- Push code to GitHub
- Import project in Vercel
- Add environment variables
- Deploy

## ⚠️ Notes

- Ollama (local models) won’t work in production (Vercel)
- Use OpenAI or Groq for deployed environments
- Streaming responses use native fetch (ReadableStream)
- Ensure embedding model consistency to avoid dimension mismatch errors

## 🔮 Future Improvements

- Markdown rendering
- Highlight exact source snippets
- Better citation UI
- Multi-document collections
- Authentication (user-specific data)
- File storage (S3 / Supabase Storage)
- Rate limiting + caching
- Test Cases

## ⭐ If you like this project

Give it a star on GitHub!
