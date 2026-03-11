# Adaptive Learning Platform (ALP)

An enterprise-grade, highly scalable Learning Management System (LMS) and Adaptive Learning Platform designed to manage everything from top-level academic hierarchies (Universities) down to granular student interactions (Proctored Assessments and Adaptive Analytics).

This platform aims to digitize the entire academic workflow: managing institutional structures, tracking teacher and student enrollments across semesters, delivering rigorous, anti-cheat enabled assessments, and providing insightful analytics for educators and administrators.

---

## 🚀 Technology Stack

### Frontend & Core Framework

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) - Utilizing the latest React Server Components (RSC) and Server Actions for optimized performance and SEO.
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & `class-variance-authority` (CVA) - For a highly flexible, utility-first, modern UI design featuring Glassmorphism and dark mode as the default aesthetic.
- **Components**: Radix UI primitives and Lucide React (for crisp, consistent iconography).
- **Forms & Validation**: `react-hook-form` coupled tightly with `zod` for strict, type-safe client and server payload validation.
- **Notifications**: `sonner` for beautiful, responsive toast notifications.

### Backend & Database

- **Database Engine**: [PostgreSQL](https://www.postgresql.org/) (`pg`) - Relational data integrity for complex academic hierarchies.
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) - A lightweight, type-safe TypeScript ORM that perfectly balances raw SQL access with high-level abstraction.

### AI Integration

- **LLM Engine**: [Google Gemini](https://deepmind.google/technologies/gemini/) (`@google/generative-ai`) - Powers complex multimodal tasks including parsing syllabus PDFs into massive academic hierarchies and generating context-aware assessments dynamically.

### Authentication & Security

- **Auth Provider**: [Better Auth](https://better-auth.com/) (`better-auth`) - A modern, secure authentication system integrated directly into the database schema supporting sessions, OAuth, and RBAC mapping.
- **Role-Based Access Control (RBAC)**: Enforced via custom middleware and API route guards (`adminGuard`, `teacherGuard`, `studentGuard`).

---

## 🌟 Core Modules & Features

### 1. Multi-Tenant Academic Hierarchy (Admin Module)

The platform is built to handle complex, real-world educational structures. Administrators have full CRUD controls over this hierarchy:

- **Universities**: The top-level entity.
- **Institutions**: Colleges attached to Universities (e.g., Engineering, Arts, Pharmacy).
- **Departments**: Branches within Institutions (e.g., CSE, Mechanical).
- **Programs & Regulations**: Degree paths (e.g., B.Tech) and their specific syllabus regulations (e.g., R2020) spanning defined years.
- **Batches & Semesters**: Tracking student admission cohorts through their 4-year (8 semester) journeys.
- **Courses**: Subject templates mapped to specific semesters.
- **Course Outcomes (COs)**: Granular learning objectives attached to courses for targeted outcome tracking.
- **✨ AI-Powered Setup**: Administrators can upload raw syllabus PDFs and let the Gemini-powered parsing engine automatically extract and build the entire hierarchy (Departments, Programs, Courses, Units, Topics, and Outcomes) in seconds.

### 2. User Roles & Allocation Mapping

- **Administrators (`admin`)**: Manage the entire academic hierarchy via dedicated dashboard panels.
- **Teachers (`teacher`)**:
  - Admins allocate teachers to specific `Semester Course Maps` (e.g., "Data Structures" in "Semester 3").
  - Teachers get automatic access to the cohorts of students enrolled in that specific combination.
- **Students (`student`)**:
  - **Onboarding Flow**: Upon first login, students must complete an onboarding flow to map themselves to a specific Program, Batch, and Roll Number, placing them in their correct academic context.
  - Students progress automatically through courses mapped to their current semester.

### 3. Assessment & Proctored Quiz Engine

A powerful, secure quiz delivery system built for educators and students.

#### Teacher Capabilities:

- **Quiz Creation**: Define titles, descriptions, allowed duration, and max attempts. Maintain quizzes in "draft" or "published" states.
- **✨ AI Quiz Generation**: Automatically generate context-aware MCQs with varying difficulties mapped directly to Course Outcomes from uploaded PDFs or course materials via Gemini.
- **Question Bank**: Build MCQs mapped to specific Course Outcomes (COs). Assign difficulty levels (easy, medium, hard) and dynamic max marks. Questions and options can be edited dynamically before quiz publishing.
- **Live Analytics**: View real-time aggregated stats of student performance, pass/fail ratios, and average scores per quiz.

#### Student Experience (Anti-Cheat / Proctoring):

- **Server-Synchronized Timers**: The countdown timer relies entirely on Postgres `CURRENT_TIMESTAMP - started_at` calculations. This makes it **impossible** for a student to tamper with the duration by altering their local machine clock or timezone settings.
- **Tab-Switch Detection**: Monitors document `visibilitychange`. If a student switches tabs or minimizes the browser, a `proctor_event` is logged directly to their active `quiz_session`, incrementing their **Risk Score**.
- **Copy/Paste & Right-Click Prevention**: Active event listeners block right-clicks (`contextmenu`) and text copying, logging these attempts as infractions.
- **Randomized Question Delivery**: Questions and their multiple-choice options are dynamically shuffled server-side before hitting the client, ensuring no two students see the exact same layout.

### 4. Advanced Edge Case Handling (Quiz Resiliency)

The quiz engine is highly fault-tolerant and gracefully handles complex, real-world edge cases through atomic database transactions and strict data integrity constraints:

- **1. Network Disconnects & Mid-Quiz Logouts (Autosave)**:
  - **Mechanic**: The frontend features an `isOffline` network detector. As students select answers, they are asynchronously pushed to a dedicated `/autosave` API.
  - **Offline Syncing**: If the internet drops, answers are intelligently queued in memory. Once connectivity is restored, the queue flushes sequentially to the server.
  - **Resume Capability**: If a student accidentally closes the browser or logs out, the `/start` API fetches the associated `in_progress` session _and_ their successfully autosaved choices, pre-filling the UI so they simply resume without losing progress.
- **2. Duplicate Session Prevention**:
  - **Mechanic**: A partial, composite unique constraint (`unq_in_progress_session`) at the PostgreSQL level specifically guards `(user_id, quiz_id) WHERE status = 'in_progress'`.
  - **Benefit**: This acts as a hard lock. No amount of rapid double-clicking or network manipulation can ever trick the system into spawning two simultaneous attempts for the same user on a given quiz.
- **3. Simultaneous Auto-Grading Safeguard**:
  - **Mechanic**: The final `/submit` API performs an atomic boolean check when updating the database (`WHERE id = sessionId AND status = 'in_progress'`).
  - **Benefit**: If a throttled network causes two duplicate submit requests to arrive at the server simultaneously, the first request flips the status to `submitted`. The trailing request fails the row-match instantly, completely eliminating double-grading bugs, duplicate score entries, or corrupting aggregate analytics.
- **4. Mid-Decision Quiz Deletions**:
  - **Mechanic**: If a teacher intentionally deletes a quiz while a cohort is currently testing, the student's background pings and final `Submit` POST request will safely capture the `404 Not Found` response.
  - **Benefit**: Instead of crashing the frontend client or throwing uncaught React errors, the UI intercepts this 404 code and halts the timer, elegantly notifying the student: _"This quiz was deleted by the instructor. Your attempt has been canceled."_
- **5. Semester & Timeline Advancements**:
  - **Mechanic**: The core submission engine and `studentGuard` middleware strictly authenticate based on the cryptographically secure `session.id` established at the time the quiz began.
  - **Benefit**: If an Administrator triggers a mass batch progression (moving students from Semester 3 to 4) exactly while a student is testing, the submission does not corrupt. The active quiz token retains its context and successfully records the grade on submission.

### 4. Adaptive Analytics Engine (Adaptive Engine)

The platform features an intelligent engine (`lib/adaptive/analytics-engine.ts`) to track long-term student mastery across syllabus requirements.

- **Course Outcome (CO) Mastery Tracking**: Every time a student answers a question, the engine recalibrates their mastery percentage for the associated CO. Based on standard grading curves, it categorizes mastery as:
  - `< 40%`: Weak
  - `40 - 69%`: Developing
  - `70 - 89%`: Proficient
  - `>= 90%`: Mastered
- **Student Insights**: Students receive personalized dashboards highlighting their weak COs and offering tailored recommendations (e.g., "Focus on CO2: Binary Trees").
- **Teacher Analytics**: Educators can view a cohort-wide matrix breaking down how many students are "Weak" vs "Mastered" for specific Course Outcomes, enabling data-driven reteaching.
- **Dynamic Question Difficulty**: The engine dynamically adjusts the difficulty of presented questions based on the student's real-time performance and calculated mastery of the underlying Course Outcome to maintain the optimal challenge level.
- **At-Risk Identification**: Students averaging below 40% mastery across a course are flagged automatically for early intervention based on their computed Risk Score.

---

## 🗄️ Database Schema Details (Drizzle ERD)

The database is split across four primary files for modular maintainability (`lib/db/schema/`):

### `auth.ts` (Better Auth integration)

- `user`, `session`, `account`, `verification`
- Custom user fields: `role` (enum: 'admin', 'teacher', 'student'), `name`, `email`, `avatarUrl`.

### `core.ts` (Academic Hierarchy)

- `university`, `institution`, `department`, `program`, `regulation`, `batch`
- `course`, `course_outcome`, `academic_year`, `semester`, `semester_course_map`
- **Junctions**:
  - `teacher_allocation` (Maps Teacher -> SemesterCourseMap)
  - `student_enrollment` (Maps Student -> Batch & tracks current semester)

### `assessment.ts` (Quizzes & Logs)

- `quiz`, `question`, `option`
- **Engagement**:
  - `quiz_session`: Tracks start/submit times, final scores, and active `risk_score`.
  - `student_answer`: Granular tracking of what a student answered, cross-referenced with `option.isCorrect` and `time_taken_seconds` per question.
  - `proctor_event`: A log table tracking the exact timestamp and `event_type` (e.g., 'tab_switch') of infractions.

### `adaptive.ts` (Analytics)

- `co_mastery`: Aggregates and materializes a student's calculated proficiency on specific Course Outcomes over time, minimizing heavy runtime queries.

---

## 📂 Internal Directory Structure

```text
adaptive-learning-platform/
├── app/
│   ├── (auth)/             # Login/Signup pages & logic
│   ├── onboarding/         # Mandatory first-time user setup for students
│   ├── api/                # Next.js Route Handlers
│   │   ├── admin/          # Strictly protected admin endpoints
│   │   ├── auth/[...all]/  # BetterAuth catch-all routes
│   │   ├── student/        # Endpoints returning student specific/filtered data
│   │   └── teacher/        # Course management, quiz CRUDS, analytics APIs
│   └── dashboard/          # Next.js Pages (UI)
│       ├── admin/          # Admin UI (Hierarchy CRUD tables, user allocation)
│       ├── student/        # Student UI (My Courses, Quiz Taking Engine, Results, Insights)
│       └── teacher/        # Teacher UI (Quiz Builder, Analytics Dashboards)
├── components/             # Reusable UI React Components
│   ├── ui/                 # Base elements (Buttons, Inputs, Modals, Cards)
│   └── (feature specific)  # e.g., complex forms, analytics charts
├── lib/
│   ├── admin/              # Zod schemas used to validate incoming admin API POST/PUT data
│   ├── db/                 # Drizzle schemas, config, and db connection instance
│   ├── adaptive/           # The Analytics Engine for processing Mastery/Risk points
│   ├── student/            # Student API utilities and the `studentGuard()` auth middleware
│   └── teacher/            # Teacher API utilities and the `teacherGuard()` auth middleware
└── package.json            # Scripts & project dependencies
```

---

## 🔐 Security Context & Best Practices Applied

1. **API Route Protection**:
   Every `/api/*` endpoint begins with a rigorous check (`adminGuard()`, `teacherGuard()`, or `studentGuard()`). These guards not only confirm the session is valid but assert the role string matches exactly.
2. **Data Isolation (Tenant Scoping)**:
   In the REST endpoints, queries unconditionally map `userId` context. E.g., a teacher requesting quizzes (`SELECT * FROM quiz`) implicitly passes `WHERE createdBy = session.user.id`. A user can never access objects belonging to another tenant/user.
3. **Optimized Zod Validations**:
   All programmatic updates utilize `z.object().partial()` without blindly applying default values. This ensures `PATCH/PUT` endpoints modifying status flags (like Publishing a quiz) do not accidentally revert existing parameters back to factory defaults.

---

## 🛠️ Installation & Setup Guide

### 1. Prerequisites

- **Node.js**: v20 or later.
- **PostgreSQL**: A running local or remote (e.g., Supabase/Neon) Postgres instance.

### 2. Environment Variables

Create a `.env.local` file at the root of the project:

```env
# Your postgres connection string
DATABASE_URL="postgresql://username:password@localhost:5432/adaptive_db"

# Better Auth required keys
BETTER_AUTH_SECRET="generate-a-random-32-char-string-here"
BETTER_AUTH_URL="http://localhost:3000"

# Optional: Disable Next.js telemetry
NEXT_TELEMETRY_DISABLED=1
```

### 3. Installation

Install the project dependencies via npm:

```bash
npm install
```

### 4. Database Initialization

Push the Drizzle Schema definitions directly to your PostgreSQL database to create the necessary tables, enums, and relations:

```bash
npx drizzle-kit push
```

_(Alternatively, you can run `npx drizzle-kit generate` and `npx drizzle-kit migrate` if maintaining a strict migration history)._

### 5. Running the Deployment/Development Servers

**Development Mode** (with Hot Module Reloading):

```bash
npm run dev
```

Navigate to `http://localhost:3000`.
_Pro-tip: The platform defaults the first registered user to a "student". You must manually adjust the `role` column in the `user` table in Postgres to `'admin'` or `'teacher'` to access those respective dashboards initially._

**Production Build**:
To test the production optimized bundle locally:

```bash
npm run build
npm run start
```

---

## 🧪 Edge Case Verification Guide

Administrators and developers can manually replicate and verify the fault tolerance of the application utilizing these testing schemas:

### Autosave & Logout Recovery

1. Start a quiz as a student.
2. Click multiple answers and watch the network tab for background `/autosave` 200 OK responses.
3. Completely close the browser tab or hit refresh.
4. Restart the quiz. Ensure the timer strictly resumes based on the initial `started_at` postgres timestamp, and the previously clicked answers are loaded.

### Network Drops (Offline Sync)

1. Start a quiz.
2. Under Chrome DevTools > Network tab, throttle speeds to **"Offline"**.
3. Select 3 new answers. Observe the UI highlight the red `WifiOff` offline queueing warning.
4. Return Network to **"No throttling"**.
5. Observe the yellow `Syncing...` indicator flash quickly as the queue empties. Refresh the page safely knowing answers are preserved.

### Database Lock / Simulate Simultaneous Submission

1. Using Chrome DevTools, throttle the network to **"Slow 3G"**.
2. Aggressively spam the "Submit Quiz" button rapidly 10+ times.
3. Observe the network tab handling multiple queued POST requests, where ONLY the first returns a `200 Success` taking the grade, and all subsequent trailing requests instantly return explicit DB rejection errors preventing score duplication.

---

## 🎨 Modifying Themes & Aesthetics

The platform uses Tailwind CSS variables injected via the `next-themes` provider in the `globals.css` file.

- **Dark Mode Default**: The entire layout, including modals, dropdowns, and text, is optimized prioritizing a sleek, dark/glass visual aesthetic.
- Global colors (backgrounds, borders, primary accent colors like "indigo", "emerald") can be globally shifted by editing `app/globals.css`.
