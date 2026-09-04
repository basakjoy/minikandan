# Mini Kanban Board

A full-stack, collaborative Kanban board built to demonstrate production-grade patterns for authentication, authorization, and real-time-feeling task management. The stack is Next.js on the frontend, NestJS and PostgreSQL (via Prisma) on the backend, with everything containerized through Docker Compose for a one-command local setup.

This project was built as a full-stack engineering exercise, with an emphasis on getting the "boring but hard" parts right: role-based permissions, transactional data integrity during drag and drop reordering, and a clean separation between the API and the client.

## Why these choices

Kanban boards look simple on the surface, but they surface a lot of real engineering problems once you add multiple users editing the same board at once. A few decisions worth explaining:

- **Role-based access control** rather than a simple "owner vs. everyone else" model, because most teams need a middle ground someone who can move cards around without being able to delete the board or change who has access.
- **Float-based ordering** (`order: Float`) for columns and tasks instead of integers. This avoids full-table renumbering every time a card is dropped between two others, which matters once a board has any real traffic.
- **A dedicated, transactional move endpoint** rather than letting the client PATCH a task's column and order independently. Reordering is the one place where partial writes cause visible, confusing bugs, so it gets wrapped in a single Prisma transaction.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, `@hello-pangea/dnd`, Axios, date-fns |
| Backend | NestJS 11, TypeScript, Passport JWT, bcrypt, class-validator, Swagger (OpenAPI) |
| Database | PostgreSQL 16/18, Prisma ORM |
| Infrastructure | Docker, Docker Compose |

## Features

**Authentication and access control**
Registration and login run on JWTs, with passwords hashed via bcrypt nothing stored in plain text, nothing rolled by hand where a well-tested library will do. Once inside a board, a user holds one of three roles:

- *Owner* - full control: editing the board, inviting or removing members, changing roles, and managing columns and tasks.
- *Editor* - day to day workflow management: creating, editing, moving, and deleting tasks and columns.
- *Viewer* - read access only, useful for stakeholders who need visibility without edit rights.

Every mutating endpoint checks the caller's role against the board before touching data, so a viewer token can't be used to sneak in a write, and a member of one board can't reach into another board's tasks.

**Task movement**
The `PATCH /api/tasks/:id/move` endpoint handles moving a task within a column or across columns to a specific position. The reorder happens inside a Prisma transaction so that a failed or interrupted request can't leave two tasks sharing the same position, or leave a column's ordering out of sequence.

**Frontend**
The board view uses `@hello-pangea/dnd` for drag and drop, with optimistic updates so the UI feels immediate even before the server confirms the move. Tasks carry priority (Low/Medium/High/Urgent), optional due dates with an overdue indicator, and an assignee. A search bar filters by keyword, priority, or assignee in real time. Board collaborators are managed through a modal that supports searching for users and setting their role at invite time.

## Getting started

### Requirements

- Node.js 18+ (20+ recommended)
- npm 9+
- PostgreSQL 16+ running locally, or Docker

### Option A - Docker Compose

The fastest path to a running instance:

```bash
docker-compose up --build
```

Once it's up:

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- Swagger docs: http://localhost:4000/api/docs

### Option B - Running it manually

If you'd rather run the frontend and backend yourself (useful for debugging or active development):

**Backend**

```bash
cd backend
npm install
cp .env.example .env

npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts

npm run start:dev
```

This brings the API up at `http://localhost:4000/api`, with Swagger docs at `/api/docs`. The seed script populates a demo board, some sample tasks, and the three test accounts listed below.

**Frontend**

In a second terminal:

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

The app will be available at `http://localhost:3000`.

## Demo accounts

The seed script creates three users on a shared sample board, one at each permission level, so you can see how the UI and API behave differently depending on role:

| Name | Email | Password | Role |
|---|---|---|---|
| Alex Developer | naim@gmail.com | 12345678 | Owner |


The login screen also has one click buttons for each of these, which is worth using if you just want to see how the app behaves rather than typing credentials.

## Database schema

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
  id            String        @id @default(uuid())
  email         String        @unique
  name          String
  passwordHash  String
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  ownedBoards   Board[]       @relation("BoardOwner")
  memberships   BoardMember[]
  assignedTasks Task[]        @relation("TaskAssignee")
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

## API reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Log in and receive a JWT |
| GET | `/api/auth/me` | Return the current authenticated user |

### User directory
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/search?q={query}` | Search users by name or email, for board invites |

### Boards
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/boards` | List boards the user owns or belongs to |
| POST | `/api/boards` | Create a board (auto-generates To Do / In Progress / Done columns) |
| GET | `/api/boards/:id` | Fetch a board with its columns, tasks, and members |
| PATCH | `/api/boards/:id` | Update board details (Owner or Editor) |
| DELETE | `/api/boards/:id` | Delete a board (Owner only) |
| POST | `/api/boards/:id/members` | Invite a member (Owner only) |
| PATCH | `/api/boards/:id/members/:userId` | Change a member's role (Owner only) |
| DELETE | `/api/boards/:id/members/:userId` | Remove a member (Owner, or the member themselves) |

### Columns
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/boards/:boardId/columns` | Create a column |
| PATCH | `/api/columns/:id` | Update a column's title or order |
| DELETE | `/api/columns/:id` | Delete a column and its tasks |
| PATCH | `/api/boards/:boardId/columns-reorder` | Reorder columns on a board |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/columns/:columnId/tasks` | Create a task |
| GET | `/api/tasks/:id` | Fetch task details |
| PATCH | `/api/tasks/:id` | Update title, description, priority, due date, or assignee |
| PATCH | `/api/tasks/:id/move` | Move a task to a target column and position (transactional) |
| DELETE | `/api/tasks/:id` | Delete a task |

The move endpoint takes a body like:

```json
{
  "targetColumnId": "uuid",
  "targetPosition": 0
}
```

## Testing and verification

The project builds cleanly with zero TypeScript errors across both frontend and backend. Task movement and reordering have been exercised end to end to confirm the transaction behaves correctly under concurrent moves, and board level authorization has been checked to make sure a user can't reach data on a board they don't belong to. Full API documentation is generated automatically and served through Swagger at `/api/docs`.
