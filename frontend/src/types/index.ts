export type BoardRole = 'OWNER' | 'EDITOR' | 'VIEWER';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

export interface BoardMember {
  id: string;
  boardId: string;
  userId: string;
  role: BoardRole;
  createdAt: string;
  user: User;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  order: number;
  priority: TaskPriority;
  dueDate: string | null;
  columnId: string;
  assigneeId: string | null;
  assignee?: User | null;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  title: string;
  order: number;
  boardId: string;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  title: string;
  description: string | null;
  ownerId: string;
  owner: User;
  members: BoardMember[];
  columns: Column[];
  userRole?: BoardRole;
  isOwner?: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    columns: number;
  };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}
