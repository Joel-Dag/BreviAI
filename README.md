# BreviAI 🎙️⚡

> Transform messy meeting audio into ultra-clean, structured executive summaries, action items, and key decisions in seconds. Built for devs and creators who hate writing meeting notes.

---

## 🚀 What Is BreviAI?

Ever sat through a 45-minute call only to forget who was assigned what? BreviAI takes your raw meeting recordings (WAV, MP3, WebM) and pumps them through Whisper and LLaMA 3.3 (70B) via Groq to extract:

* 📌 Executive Summaries (2-4 sentence high-level overviews)
* 🎯 Action Items (mapped to owners and due dates)
* 💡 Key Decisions & Topics (so you can skip reading full transcripts)

All stored cleanly in Supabase with automatic media cleanup when you purge a meeting.

---

## 🛠️ The Tech Stack

| Component          | Tech                                         |
| :----------------- | :------------------------------------------- |
| Framework          | Next.js 14 (App Router) + TypeScript         |
| Styling            | Tailwind CSS + Lucide Icons                  |
| Database & Auth    | Supabase (PostgreSQL + RLS) + Google OAuth   |
| Storage            | Supabase Storage (`meeting-audio` bucket)   |
| AI Processing      | Groq API (`llama-3.3-70b-versatile` + Whisper)|

---

## 📦 Quickstart & Local Setup

Got Node installed? Let’s get this running on your local machine in under 3 minutes.

1. Clone & Install Dependencies
   Open your terminal and run:

   git clone https://github.com/Joel-Dag/BreviAI.git
   cd BreviAI
   npm install

2. Configure Environment Variables
   Create a .env.local file in your root folder and add your keys:

   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   GROQ_API_KEY=gsk_your_groq_api_key

3. Configure Supabase SQL & Storage
   - In your Supabase Dashboard, create a storage bucket named `meeting-audio` and enable public/authenticated access.
   - Run the cascade cleanup script in the Supabase SQL Editor so deleting meetings auto-cleans summaries:

   ALTER TABLE public.summaries
     DROP CONSTRAINT IF EXISTS summaries_meeting_id_fkey,
     ADD CONSTRAINT summaries_meeting_id_fkey 
     FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;

   ALTER TABLE public.action_items
     DROP CONSTRAINT IF EXISTS action_items_meeting_id_fkey,
     ADD CONSTRAINT action_items_meeting_id_fkey 
     FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;

4. Fire It Up
   Start the development server:

   npm run dev

   Head over to http://localhost:3000 and start summarizing! 🚀

---

## 🎮 How to Use BreviAI

[ Upload Audio ] ──> [ Whisper Speech-to-Text ] ──> [ LLaMA 3.3 Structuring ] ──> [ Dashboard View ]

1. Sign In: Log in using Google OAuth or Email.
2. Upload or Record: Drop your .webm or .mp3 meeting audio onto the dashboard.
3. Hit Summarize: Sit back while Groq processes the audio into structured JSON in seconds.
4. Manage Tasks: View assigned action items, track due dates, or delete old meetings (which auto-purges the .webm file from storage).

---

## 🤝 Contributing

Got ideas to make BreviAI faster or cooler? PRs are super welcome!

git checkout -b feat/super-cool-feature
git commit -m "add super cool feature"
git push origin feat/super-cool-feature
