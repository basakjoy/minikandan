# Mini Kanban Board — Full-Stack Engineering Challenge

A full-stack, collaborative **Mini Kanban Board** application built with **Next.js**, **NestJS**, **PostgreSQL**, **Prisma**, and **Tailwind CSS**.

---

## 🌟 Key Features

### 1. Authentication & Role-Based Access Control (RBAC)
- **Token-Based Authentication**: Secure user registration and login using JSON Web Tokens (JWT) and `bcrypt` password hashing.
- **Board Sharing & Collaboration**:
  - `OWNER`: Full control (create/edit/delete board, invite members, change roles, manage columns & tasks).
  - `EDITOR`: Full workflow management (create/edit/move/delete tasks and columns).
  - `VIEWER`: Read-only access to view boards, columns, and task details.
- **Strict Authorization**: Multi-tier access guards prevent unauthorized access or cross-board mutation tampering.

### 2. Workflow Management & Task Movement Engine
- **Full CRUD Operations**: Boards, Columns, and Tasks.
- **Transactional Task Movement API** (`PATCH /api/tasks/:id/move`):
  - Move tasks within the same column or across different columns to an exact target position.
  - **Sequential Order Normalization**: Executed inside an atomic PostgreSQL transaction (`prisma.$transaction`) to guarantee stable, collision-free integer indexing (`0, 1, 2, ...`).
  - Strict validation preventing unauthorized cross-board task transfers.

### 3. Modern Interactive Frontend
- Built with **Next.js (App Router, TypeScript)** and **Tailwind CSS**.
- **Fluid Drag-and-Drop**: Interactive board view powered by `@hello-pangea/dnd` with optimistic UI updates.
- **Task Attributes**: Priorities (Urgent, High, Medium, Low), Due Dates with overdue indicators, and Member Assignees.
- **Live Search & Filters**: Instant filtering by task keyword, priority, or assignee.
- **Board Collaboration Modal**: Real-time user search, invite collaborators with role selection, and manage existing member permissions.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, `@hello-pangea/dnd`, Axios, date-fns |
| **Backend** | NestJS 11, TypeScript, Passport JWT, bcrypt, class-validator, Swagger (OpenAPI) |
| **Database** | PostgreSQL 16/18 with Prisma ORM |
| **DevOps** | Docker, Docker Compose |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+ or v20+)
- **npm** (v9+)
- **PostgreSQL** (running locally on port 5432) OR **Docker**

---

### Option A: Running with Docker Compose (Recommended)

1. Clone repository and start all services:
   ```bash
   docker-compose up --build
   ```
2. Open the applications:
   - **Frontend**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:4000/api](http://localhost:4000/api)
   - **Swagger API Docs**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

### Option B: Local Step-by-Step Setup

#### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Generate Prisma Client & push schema to PostgreSQL
npx prisma generate
npx prisma db push

# Seed the database with demo users, boards, and tasks
npx ts-node prisma/seed.ts

# Start backend server
npm run start:dev
```
Backend API will be live at `http://localhost:4000/api` and Swagger docs at `http://localhost:4000/api/docs`.

#### 2. Frontend Setup

```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Start frontend dev server
npm run dev
```
Frontend will be accessible at [http://localhost:3000](http://localhost:3000).

---

## 🔑 Demo Accounts (Pre-Seeded)

The database comes pre-seeded with realistic sample workflows and 3 test users:

| Name | Email | Password | Role on Sample Board |
| :--- | :--- | :--- | :--- |
| **Alex Johnson** | `alex@example.com` | `Password123!` | **Owner** (Sprint 24 Board) |
| **Sarah Connor** | `sarah@example.com` | `Password123!` | **Editor** (Sprint 24 Board) |
| **David Miller** | `david@example.com` | `Password123!` | **Viewer** (Sprint 24 Board) |

> 💡 **Quick Login**: The login screen features 1-click demo login buttons for Alex, Sarah, and David for rapid evaluation!

---

## 📐 Database Schema (Prisma)

```prisma
enum BoardRole {
  OWNER
  EDITOR
  VIEWER
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model User {
  id           String        @id @default(uuid())
  email        String        @unique
  name         String
  passwordHash String
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  ownedBoards  Board[]       @relation("BoardOwner")
  memberships  BoardMember[]
  assignedTasks Task[]       @relation("TaskAssignee")
}

model Board {
  id          String        @id @default(uuid())
  title       String
  description String?
  ownerId     String
  owner       User          @relation("BoardOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  members     BoardMember[]
  columns     Column[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model BoardMember {
  id        String    @id @default(uuid())
  boardId   String
  board     Board     @relation(fields: [boardId], references: [id], onDelete: Cascade)
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      BoardRole @default(EDITOR)
  createdAt DateTime  @default(now())

  @@unique([boardId, userId])
}

model Column {
  id        String   @id @default(uuid())
  title     String
  order     Float
  boardId   String
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  tasks     Task[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Task {
  id          String       @id @default(uuid())
  title       String
  description String?
  order       Float
  priority    TaskPriority @default(MEDIUM)
  dueDate     DateTime?
  columnId    String
  column      Column       @relation(fields: [columnId], references: [id], onDelete: Cascade)
  assigneeId  String?
  assignee    User?        @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}
```

---

## 📡 Core API Endpoints

### Authentication
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login & retrieve JWT Bearer token
- `GET /api/auth/me` — Current authenticated user profile

### User Directory
- `GET /api/users/search?q={query}` — Search registered users by name or email for board invites

### Boards & Access Control
- `GET /api/boards` — List accessible boards (owned + shared)
- `POST /api/boards` — Create board (auto-generates "To Do", "In Progress", "Done" columns)
- `GET /api/boards/:id` — Get board details with columns, tasks, and members
- `PATCH /api/boards/:id` — Update board details (Owner/Editor)
- `DELETE /api/boards/:id` — Delete board (Owner only)
- `POST /api/boards/:id/members` — Invite/add member (Owner only)
- `PATCH /api/boards/:id/members/:userId` — Update member role (Owner only)
- `DELETE /api/boards/:id/members/:userId` — Remove member (Owner or self)

### Columns
- `POST /api/boards/:boardId/columns` — Create column
- `PATCH /api/columns/:id` — Update column title/order
- `DELETE /api/columns/:id` — Delete column and cascade tasks
- `PATCH /api/boards/:boardId/columns-reorder` — Reorder columns

### Tasks & Movement
- `POST /api/columns/:columnId/tasks` — Create new task
- `GET /api/tasks/:id` — Get task details
- `PATCH /api/tasks/:id` — Update task details (title, description, priority, dueDate, assignee)
- `PATCH /api/tasks/:id/move` — **Transactional movement API**:
  ```json
  {
    "targetColumnId": "uuid",
    "targetPosition": 0
  }
  ```
- `DELETE /api/tasks/:id` — Delete task

---

## 🧪 Verification & Testing

Both the backend and frontend builds and APIs have been fully tested and validated:
- TypeScript compilation: 0 errors
- End-to-end task movement and transactional reordering verified
- Cross-board security isolation validated
- Swagger OpenAPI documentation live at `/api/docs`