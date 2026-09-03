import { PrismaClient, BoardRole, TaskPriority } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean up existing data in reverse order of dependencies
  await prisma.task.deleteMany({});
  await prisma.column.deleteMany({});
  await prisma.boardMember.deleteMany({});
  await prisma.board.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Demo Users
  const userAlex = await prisma.user.create({
    data: {
      email: 'alex@example.com',
      name: 'Alex Johnson',
      passwordHash,
    },
  });

  const userSarah = await prisma.user.create({
    data: {
      email: 'sarah@example.com',
      name: 'Sarah Connor',
      passwordHash,
    },
  });

  const userDavid = await prisma.user.create({
    data: {
      email: 'david@example.com',
      name: 'David Miller',
      passwordHash,
    },
  });

  console.log('✅ Created users: Alex, Sarah, David');

  // 2. Create Board for Alex
  const sprintBoard = await prisma.board.create({
    data: {
      title: 'Sprint 24 - Product Engineering',
      description: 'Q3 deliverables and core product infrastructure tasks',
      ownerId: userAlex.id,
      members: {
        create: [
          { userId: userAlex.id, role: BoardRole.OWNER },
          { userId: userSarah.id, role: BoardRole.EDITOR },
          { userId: userDavid.id, role: BoardRole.VIEWER },
        ],
      },
    },
  });

  // 3. Create Columns
  const colBacklog = await prisma.column.create({
    data: {
      title: 'Backlog',
      order: 0,
      boardId: sprintBoard.id,
    },
  });

  const colInProgress = await prisma.column.create({
    data: {
      title: 'In Progress',
      order: 1,
      boardId: sprintBoard.id,
    },
  });

  const colCodeReview = await prisma.column.create({
    data: {
      title: 'Code Review',
      order: 2,
      boardId: sprintBoard.id,
    },
  });

  const colDone = await prisma.column.create({
    data: {
      title: 'Done',
      order: 3,
      boardId: sprintBoard.id,
    },
  });

  // 4. Create Tasks
  const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const in5Days = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Done Column
  await prisma.task.create({
    data: {
      title: 'Design PostgreSQL schema & migrations',
      description: 'Map out User, Board, BoardMember, Column, and Task relations with Prisma',
      order: 0,
      priority: TaskPriority.HIGH,
      columnId: colDone.id,
      assigneeId: userAlex.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Configure JWT authentication & RBAC guards',
      description: 'Implement password hashing with bcrypt and Passport JWT strategy',
      order: 1,
      priority: TaskPriority.URGENT,
      columnId: colDone.id,
      assigneeId: userAlex.id,
    },
  });

  // In Progress Column
  await prisma.task.create({
    data: {
      title: 'Implement Drag-and-Drop Kanban interface',
      description: 'Build interactive board view supporting fluid task movement and reordering',
      order: 0,
      priority: TaskPriority.HIGH,
      dueDate: in3Days,
      columnId: colInProgress.id,
      assigneeId: userSarah.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Transactional Task Movement API',
      description: 'Ensure atomic task reindexing across columns and within columns without race conditions',
      order: 1,
      priority: TaskPriority.URGENT,
      dueDate: in3Days,
      columnId: colInProgress.id,
      assigneeId: userAlex.id,
    },
  });

  // Code Review Column
  await prisma.task.create({
    data: {
      title: 'Board sharing & collaborator invite modal',
      description: 'Allow board owner to invite registered users and assign EDITOR/VIEWER roles',
      order: 0,
      priority: TaskPriority.MEDIUM,
      dueDate: in5Days,
      columnId: colCodeReview.id,
      assigneeId: userSarah.id,
    },
  });

  // Backlog Column
  await prisma.task.create({
    data: {
      title: 'Docker Compose environment setup',
      description: 'Provide single-command docker-compose.yml for local PostgreSQL spinup',
      order: 0,
      priority: TaskPriority.MEDIUM,
      dueDate: in7Days,
      columnId: colBacklog.id,
      assigneeId: userDavid.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Comprehensive test suite and API documentation',
      description: 'Document OpenAPI/Swagger schemas and verify end-to-end user workflows',
      order: 1,
      priority: TaskPriority.LOW,
      dueDate: in7Days,
      columnId: colBacklog.id,
      assigneeId: userAlex.id,
    },
  });

  // 5. Create a Second Board for Sarah
  const marketingBoard = await prisma.board.create({
    data: {
      title: 'Marketing & Brand Strategy',
      description: 'Social media campaigns and Q3 product launch collateral',
      ownerId: userSarah.id,
      members: {
        create: [
          { userId: userSarah.id, role: BoardRole.OWNER },
          { userId: userAlex.id, role: BoardRole.VIEWER },
        ],
      },
      columns: {
        create: [
          { title: 'Ideas', order: 0 },
          { title: 'Drafting', order: 1 },
          { title: 'Published', order: 2 },
        ],
      },
    },
  });

  console.log('✅ Created sample boards, columns, and tasks');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
