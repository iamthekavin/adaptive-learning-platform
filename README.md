<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black" alt="Drizzle" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
</p>

<h1 align="center">Adaptive Learning Platform</h1>

<p align="center">
  <strong>An AI-powered, anti-cheat enabled Learning Management System with adaptive analytics</strong>
</p>

<p align="center">
  <em>Built for institutions that need rigorous assessment integrity, real-time mastery tracking, and intelligent course outcome analytics — all in one platform.</em>
</p>

---

## Overview

The **Adaptive Learning Platform (ALP)** is a full-stack LMS designed to manage the complete academic lifecycle — from institutional hierarchies and syllabus ingestion to proctored assessments with real-time fraud detection and adaptive learning analytics.

### What makes it different?

| Capability | Description |
|---|---|
| **AI-Powered Setup** | Upload a raw syllabus PDF → AI extracts departments, programs, courses, units, topics, and outcomes automatically |
| **Anti-Cheat Engine** | Server-synced timers, tab-switch detection, copy/paste prevention, and randomized question delivery |
| **Adaptive Analytics** | Real-time Course Outcome mastery tracking with dynamic difficulty adjustment |
| **Fault-Tolerant Quizzes** | Handles network drops, duplicate submissions, mid-quiz deletions, and semester rollovers gracefully |
| **Role-Based Architecture** | Three distinct dashboards for Admins, Teachers, and Students with strict API-level isolation |

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router, RSC, Turbopack) | 16.1.6 |
| **UI** | React | 19.2.3 |
| **Styling** | Tailwind CSS | 4.x |
| **Database** | PostgreSQL + Drizzle ORM | 0.45.1 |
| **Auth** | Better Auth (Sessions, RBAC) | 1.4.18 |
| **AI (Quiz Gen)** | Groq SDK (Llama 3.3 70B) | 1.1.1 |
| **AI (Syllabus)** | Google Gemini | 0.24.1 |
| **Validation** | Zod | 4.3.6 |
| **Forms** | React Hook Form | 7.71.1 |
| **Icons** | Lucide React | 0.575.0 |

---

## Architecture

```
adaptive-learning-platform/
│
├── app/
│   ├── (auth)/                  # Sign-in / Sign-up flows
│   ├── onboarding/              # Student first-login enrollment
│   ├── api/
│   │   ├── admin/               # 15+ admin CRUD endpoints
│   │   │   ├── universities/    # Institution hierarchy management
│   │   │   ├── ai-setup/        # Syllabus PDF → structured data pipeline
│   │   │   ├── teacher-allocations/
│   │   │   └── student-enrollments/
│   │   ├── teacher/
│   │   │   ├── ai/generate-quiz/  # AI-powered MCQ generation (Groq)
│   │   │   ├── ai/upload-paper/   # PDF question extraction
│   │   │   └── quizzes/           # Quiz CRUD & analytics
│   │   ├── student/
│   │   │   ├── quiz/start/        # Session creation with anti-cheat
│   │   │   ├── quiz/submit/       # Atomic grading with race protection
│   │   │   └── quiz/autosave/     # Offline-resilient answer persistence
│   │   └── auth/[...all]/         # Better Auth catch-all
│   └── dashboard/
│       ├── admin/                 # Hierarchy CRUD, user allocation panels
│       ├── teacher/               # Quiz builder, analytics dashboards
│       ├── student/               # Courses, quiz engine, results, insights
│       └── profile/               # Universal profile page (all roles)
│
├── components/
│   ├── ui/                        # Base design system (buttons, modals, cards)
│   └── teacher/                   # AI generation modals, quiz builders
│
├── lib/
│   ├── db/schema/
│   │   ├── auth.ts                # User, Session, Account tables
│   │   ├── core.ts                # Full academic hierarchy (12+ tables)
│   │   ├── assessment.ts          # Quiz, Question, Option, Session, Proctor
│   │   └── adaptive.ts            # CO Mastery aggregation table
│   ├── adaptive/
│   │   └── analytics-engine.ts    # Mastery computation & risk scoring
│   ├── ai/
│   │   └── gemini.ts              # Syllabus PDF parsing via Gemini
│   ├── admin/                     # Zod validation schemas
│   ├── teacher/                   # teacherGuard() middleware
│   └── student/                   # studentGuard() middleware
│
└── package.json
```

---

## Core Modules

### 1. Academic Hierarchy Management

Administrators manage a deeply nested institutional structure:

```
University → Institution → Department → Program → Regulation
                                          ↓
                              Batch → Semester → Course → Course Outcome
                                                   ↓
                                              Unit → Topic
```

- Full CRUD for every level with cascading relationships
- **AI Syllabus Import**: Upload a PDF → Gemini extracts the entire hierarchy automatically
- Semester-course mapping with teacher allocation and student enrollment

### 2. Assessment Engine

#### Teacher Side
- Create quizzes with configurable duration, max attempts, and draft/publish states
- **AI Question Generation**: Select topics → Groq generates difficulty-tagged MCQs mapped to Course Outcomes
- **PDF Upload**: Extract questions from existing question papers via AI
- Real-time analytics: pass/fail ratios, average scores, per-question breakdown

#### Student Side — Anti-Cheat Proctoring
| Protection | Implementation |
|---|---|
| **Tamper-proof timer** | Server-calculated via `CURRENT_TIMESTAMP - started_at` in PostgreSQL |
| **Tab-switch detection** | `visibilitychange` events logged as proctor infractions |
| **Copy/paste blocking** | `contextmenu` and clipboard events intercepted and logged |
| **Question randomization** | Questions and options shuffled server-side per student |
| **Risk scoring** | Infractions accumulate into a computed risk score per session |

### 3. Quiz Fault Tolerance

The quiz engine handles real-world edge cases through atomic transactions:

| Edge Case | How It's Handled |
|---|---|
| **Network disconnect** | Answers queued in memory → auto-synced on reconnect via `/autosave` |
| **Browser crash** | Resume from `in_progress` session with pre-filled saved answers |
| **Double submission** | Atomic `WHERE status = 'in_progress'` check — only first request grades |
| **Duplicate sessions** | PostgreSQL partial unique constraint prevents concurrent attempts |
| **Quiz deleted mid-test** | 404 caught gracefully → student notified, timer halted |
| **Semester rollover** | Session token retains original context, submission completes safely |

### 4. Adaptive Analytics Engine

Tracks long-term student mastery across Course Outcomes:

| Mastery Level | Threshold | Action |
|---|---|---|
| 🔴 **Weak** | < 40% | Flagged for intervention |
| 🟡 **Developing** | 40–69% | Targeted recommendations |
| 🟢 **Proficient** | 70–89% | On track |
| 🔵 **Mastered** | ≥ 90% | Outcome achieved |

**Key capabilities:**
- Per-CO mastery recalculation on every quiz submission
- Student insights dashboard with personalized weak-area recommendations
- Teacher cohort analytics: mastery distribution matrix across COs
- Dynamic question difficulty adjustment based on real-time performance
- At-risk student identification via computed risk scores

---

## Database Schema

Four modular schema files in `lib/db/schema/`:

```mermaid
erDiagram
    USER ||--o{ SESSION : has
    USER ||--o{ QUIZ_SESSION : takes
    USER ||--o{ CO_MASTERY : tracks

    UNIVERSITY ||--o{ INSTITUTION : contains
    INSTITUTION ||--o{ DEPARTMENT : contains
    DEPARTMENT ||--o{ PROGRAM : offers
    PROGRAM ||--o{ REGULATION : governs
    REGULATION ||--o{ BATCH : enrolls

    COURSE ||--o{ COURSE_OUTCOME : defines
    COURSE ||--o{ QUIZ : assessed_by

    QUIZ ||--o{ QUESTION : contains
    QUESTION ||--o{ OPTION : has
    QUIZ ||--o{ QUIZ_SESSION : generates

    QUIZ_SESSION ||--o{ STUDENT_ANSWER : records
    QUIZ_SESSION ||--o{ PROCTOR_EVENT : logs
```

| Schema File | Tables | Purpose |
|---|---|---|
| `auth.ts` | user, session, account, verification | Authentication & RBAC |
| `core.ts` | university, institution, department, program, regulation, batch, course, course_outcome, semester, semester_course_map, teacher_allocation, student_enrollment | Academic hierarchy |
| `assessment.ts` | quiz, question, option, quiz_session, student_answer, proctor_event | Assessments & proctoring |
| `adaptive.ts` | co_mastery | Mastery tracking & analytics |

---

## Security

| Layer | Implementation |
|---|---|
| **API Protection** | Every endpoint guarded by `adminGuard()`, `teacherGuard()`, or `studentGuard()` — validates session + role |
| **Data Isolation** | All queries scoped to `session.user.id` — users cannot access other tenants' data |
| **Input Validation** | Zod schemas with `.partial()` on PATCH/PUT to prevent accidental field resets |
| **Session Security** | Better Auth with secure cookie-based sessions, CSRF protection |
| **Anti-Cheat Logging** | All proctor events stored with timestamps for post-assessment review |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **PostgreSQL** (local or hosted — Supabase, Neon, etc.)

### 1. Clone & Install

```bash
git clone <repository-url>
cd adaptive-learning-platform
npm install
```

### 2. Configure Environment

Create `.env.local` at the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/alp_db"

# Authentication
BETTER_AUTH_SECRET="your-random-32-char-secret"
BETTER_AUTH_URL="http://localhost:3000"

# AI - Quiz Generation (free, get key at console.groq.com)
GROQ_API_KEY="your-groq-api-key"

# AI - Syllabus Parsing (get key at aistudio.google.com)
GEMINI_API_KEY="your-gemini-api-key"
```

### 3. Initialize Database

```bash
npx drizzle-kit push
```

### 4. Run

```bash
# Development (with Turbopack HMR)
npm run dev

# Production
npm run build && npm start
```

Open [http://localhost:3000](http://localhost:3000).

> **First user setup:** The first registered user defaults to `student` role. To access admin/teacher dashboards, manually update the `role` column in the `user` table to `'admin'` or `'teacher'`.

---

## Testing Edge Cases

### Autosave & Recovery
1. Start a quiz → answer several questions (watch `/autosave` 200s in Network tab)
2. Close the browser tab completely
3. Reopen and restart the quiz → answers restored, timer continues from server timestamp

### Offline Resilience
1. Start a quiz → open DevTools → Network → set to **Offline**
2. Select 3+ answers → observe offline queue indicator
3. Switch back to **No throttling** → watch answers sync automatically

### Race Condition Protection
1. Start a quiz → DevTools → Network → **Slow 3G**
2. Spam the Submit button 10+ times rapidly
3. Only the first request returns `200 OK` — all duplicates rejected at DB level

---

## Theming

The platform ships with a **dark-first glassmorphic design** using Tailwind CSS variables in `globals.css`. Global accent colors (indigo, emerald, red) can be customized by editing the CSS variables.

---

<p align="center">
  <sub>Built with Next.js 16, React 19, PostgreSQL, Drizzle ORM, Groq AI, and Google Gemini</sub>
</p>
