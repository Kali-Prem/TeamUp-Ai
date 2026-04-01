<div align="center">
  <img width="1200" height="320" alt="TeamUp Banner" src="https://capsule-render.vercel.app/api?type=waving&height=320&color=0:00C2FF,50:0047FF,100:001B44&text=TeamUp&fontColor=FFFFFF&fontSize=72&fontAlignY=38&desc=AI-Powered%20Hackathon%20Team%20Formation&descAlignY=60&descSize=20" />
</div>

<div align="center">

# TeamUp

AI-powered hackathon team formation platform that helps students discover teammates, build balanced teams, and collaborate in real time.

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Gemini](https://img.shields.io/badge/AI-Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)

</div>

---

## 🚀 Overview

TeamUp provides an end-to-end workflow for student hackathon collaboration:

- secure sign up and student onboarding
- profile building with skills and achievements
- smart teammate discovery and team matching
- join requests, invitations, and notifications
- real-time team chat channels
- admin management for users, students, teams, and hackathons

---

## ✨ Feature Highlights

### 🔐 Authentication and Roles

- student registration and login
- Google and GitHub OAuth options on landing flow
- role-based routing for student and admin experiences

### 👤 Profiles and Skills

- editable profile: bio, college, branch, social links, achievements
- GitHub repository sync to enrich skills and trust indicators
- trust score and verification-aware UX

### 🤝 Team Formation

- create recruiting teams by hackathon
- apply to teams and review join requests
- invite users directly to specific teams
- notification workflow for all major actions

### 💬 Collaboration

- live team chat per team using Firestore subcollections
- dashboard recommendations for teams and teammates
- built-in AI assistant for guidance and ideation

### 🛠️ Admin Control

- manage users, organizations, students, hackathons, and teams
- CRUD operations with a dedicated admin panel

---

## 🧱 Tech Stack

- Frontend: React 19, TypeScript, Vite
- UI: Tailwind CSS v4, Lucide icons, Motion
- Backend: Firebase Authentication, Cloud Firestore
- AI: Google GenAI SDK (`@google/genai`)

### 🌐 Languages

- **TypeScript** - Primary language for type-safe development
- **JavaScript** - Framework and runtime support
- **HTML** - Markup structure
- **CSS** - Styling with Tailwind CSS
- **SQL** - Database schema definition
- **JSON** - Configuration and data formats
- **Firestore Rules** - Security rule definitions

---

## 📁 Project Structure

```text
src/
  components/     # Shared UI blocks (sidebar, photo capture)
  data/           # Local student seed data used in onboarding checks
  lib/            # Utility helpers (GitHub sync, Firestore errors)
  pages/          # Auth, dashboard, teams, chat, profile, admin routes
  App.tsx         # Route guards and layout shell
  firebase.ts     # Firebase app/auth/firestore initialization
```

---

## ⚡ Getting Started

### ✅ Prerequisites

- Node.js 18+
- npm 9+
- Firebase project with Authentication and Firestore enabled
- Gemini API key (only needed for AI assistant features)

### 🧩 Installation

1. Install dependencies

```bash
npm install
```

2. Create local environment file

```bash
# .env.local
GEMINI_API_KEY=your_gemini_api_key
```

3. Configure Firebase

- update `firebase-applet-config.json` with your Firebase web config
- verify `firestoreDatabaseId` matches your Firestore database

4. Start development server

```bash
npm run dev
```

Application URL: `http://localhost:3000`

---

## 🧪 Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start local dev server on port 3000 |
| `npm run build` | Build production assets |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Type-check with TypeScript (`tsc --noEmit`) |
| `npm run clean` | Remove build output directory |

---

## 🔥 Firebase Setup

1. Enable auth providers in Firebase Console
- Email/Password
- Google
- GitHub (optional)

2. Deploy Firestore rules

```bash
firebase deploy --only firestore:rules
```

3. Ensure these collections exist in your data model

- `users`
- `teams`
- `teams/{teamId}/messages`
- `notifications`
- `hackathons`
- `joinRequests`
- `invitations`
- `organizations`
- `students`
- `verifiedStudents`

Reference files in this repo:

- `firebase-blueprint.json` (Firestore-style entity map)
- `schema.sql` (relational reference schema)

---

## 🧑‍💼 Admin Notes

Current code grants admin behavior to:

- `as1917378@gmail.com`

To change admin handling, update:

- `src/App.tsx`
- `src/pages/AdminPanel.tsx`
- `firestore.rules`

---

## 🤖 AI Assistant Notes

Dashboard assistant uses Gemini via `@google/genai`.

- key expected: `GEMINI_API_KEY`
- injected in Vite using `process.env.GEMINI_API_KEY`

If missing, only AI-related actions fail while core app features continue to work.

---

## 🚢 Deployment

1. Build the app

```bash
npm run build
```

2. Deploy `dist` to any static host

- Firebase Hosting
- Vercel
- Netlify
- Cloudflare Pages

3. Set `GEMINI_API_KEY` in your hosting environment

---

## 🛡️ Security Recommendations

- do not commit production secrets
- review and tighten Firestore rules before release
- restrict OAuth callback/authorized domains in Firebase
- move admin identity checks to environment or claims-based auth

---

## 🗺️ Roadmap

- scalable user search/indexing
- stronger AI matching quality signals
- strict team capacity enforcement
- richer notification center and unread counters
- end-to-end flow tests for onboarding and team formation

---

## 📄 License

Add your preferred license (for example: MIT).
