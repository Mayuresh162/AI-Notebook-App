# 🧠 AI Notebook (Chat with Your Sources)

An AI-powered research assistant that allows you to chat with your own data sources like PDFs and YouTube videos using Retrieval-Augmented Generation (RAG).

---

## 🚀 Features

- 📄 Upload PDFs and extract content
- 🎥 Add YouTube links and process transcripts
- 💬 Chat with your sources using AI
- ⚡ Real-time streaming responses
- 🔎 Semantic search using embeddings
- 📚 Source-based answers with citations
- 💾 Chat history persistence (localStorage)
- 🎨 Clean UI with modern UX

---

## 🏗️ Tech Stack

### Frontend
- Next.js (App Router)
- React
- Tailwind CSS
- shadcn/ui

### Backend
- Next.js API Routes
- Supabase (Vector DB + Storage)

### AI / ML
- Embeddings (OpenAI / compatible)
- LLM (Ollama / OpenAI / Groq)
- RAG (Retrieval-Augmented Generation)

---

## 🧠 Architecture Overview

1. Upload PDF / YouTube → Extract text
2. Text → Split into chunks
3. Chunks → Convert into embeddings
4. Store embeddings in Supabase
5. User asks question
6. Similar chunks retrieved via vector search
7. Context + question sent to LLM
8. Streaming response returned
9. Sources attached for citations

---

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

# Choose ONE:
OPENAI_API_KEY=your_key
# OR
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

### 5. Run locally

```bash
npm run dev
```

## 🧪 Usage

- Upload a PDF or add YouTube link
- Wait for processing
- Ask questions in chat
- Get AI answers with citations

## 🌐 Deployment

Recommended: Vercel

Steps:

- Push code to GitHub
- Import project in Vercel
- Add environment variables
- Deploy

## ⚠️ Notes

- Ollama (local) will NOT work in production
- Use OpenAI or Groq for deployed apps
- Streaming works using fetch (not axios)

## 🔮 Future Improvements

- Markdown rendering
- Highlight source citations
- Multi-document grouping
- Authentication
- Cloud storage for PDFs

## ⭐ If you like this project

Give it a star on GitHub!
