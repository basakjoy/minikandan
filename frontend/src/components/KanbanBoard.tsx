'use client';

import React, { useState, useMemo } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Board, Column, Task, TaskPriority } from '@/types';
import { ColumnLane } from './ColumnLane';
import { TaskModal } from './TaskModal';
import { ShareBoardModal } from './ShareBoardModal';
import { api } from '@/lib/api';
import {
  Plus,
  Users,
  Search,
  Filter,
  Shield,
  Loader2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface KanbanBoardProps {
  board: Board;
  onBoardUpdated: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ board, onBoardUpdated }) => {
  const [columns, setColumns] = useState<Column[]>(board.columns);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeColumnIdForNewTask, setActiveColumnIdForNewTask] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // New Column inline creation state
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [isSubmittingColumn, setIsSubmittingColumn] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');

  // Sync internal state when board prop updates
  React.useEffect(() => {
    setColumns(board.columns);
  }, [board.columns]);

  const canEdit = board.userRole === 'OWNER' || board.userRole === 'EDITOR';

  // Filter tasks in columns based on active filters
  const filteredColumns = useMemo(() => {
    return columns.map((col) => {
      const filteredTasks = col.tasks.filter((task) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchDesc = task.description?.toLowerCase().includes(q) || false;
          if (!matchTitle && !matchDesc) return false;
        }

        // Priority filter
        if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) {
          return false;
        }

        // Assignee filter
        if (assigneeFilter !== 'ALL') {
          if (assigneeFilter === 'UNASSIGNED' && task.assigneeId !== null) return false;
          if (assigneeFilter !== 'UNASSIGNED' && task.assigneeId !== assigneeFilter) return false;
        }

        return true;
      });

      return {
        ...col,
        tasks: filteredTasks,
      };
    });
  }, [columns, searchQuery, priorityFilter, assigneeFilter]);

  // Drag & Drop Handler with Optimistic UI & Transactional API
  const handleDragEnd = async (result: DropResult) => {
    if (!canEdit) return;

    const { source, destination, draggableId } = result;

    // Dropped outside a droppable area
    if (!destination) return;

    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Save previous state for rollback
    const previousColumns = JSON.parse(JSON.stringify(columns));

    // Calculate optimistic state
    const sourceColIndex = columns.findIndex((c) => c.id === source.droppableId);
    const destColIndex = columns.findIndex((c) => c.id === destination.droppableId);

    if (sourceColIndex === -1 || destColIndex === -1) return;

    const newColumns = [...columns];
    const sourceTasks = [...newColumns[sourceColIndex].tasks];
    const destTasks =
      source.droppableId === destination.droppableId
        ? sourceTasks
        : [...newColumns[destColIndex].tasks];

    // Find and remove task from source
    const [movedTask] = sourceTasks.splice(source.index, 1);
    const updatedMovedTask = {
      ...movedTask,
      columnId: destination.droppableId,
    };

    // Insert task into destination
    destTasks.splice(destination.index, 0, updatedMovedTask);

    // Reindex tasks
    newColumns[sourceColIndex] = {
      ...newColumns[sourceColIndex],
      tasks: sourceTasks.map((t, idx) => ({ ...t, order: idx })),
    };

    if (source.droppableId !== destination.droppableId) {
      newColumns[destColIndex] = {
        ...newColumns[destColIndex],
        tasks: destTasks.map((t, idx) => ({ ...t, order: idx })),
      };
    }

    // Apply optimistic update immediately
    setColumns(newColumns);

    // Call Backend Movement API
    try {
      await api.patch(`/tasks/${draggableId}/move`, {
        targetColumnId: destination.droppableId,
        targetPosition: destination.index,
      });
      // Trigger background refresh to keep relations in sync
      onBoardUpdated();
    } catch (err: any) {
      console.error('Task move failed, rolling back:', err);
      // Rollback on error
      setColumns(previousColumns);
      alert(err.response?.data?.message || 'Failed to move task. Reverting changes.');
    }
  };

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;

    try {
      setIsSubmittingColumn(true);
      await api.post(`/boards/${board.id}/columns`, {
        title: newColumnTitle.trim(),
      });
      setNewColumnTitle('');
      setIsCreatingColumn(false);
      onBoardUpdated();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create column');
    } finally {
      setIsSubmittingColumn(false);
    }
  };

  const handleUpdateColumnTitle = async (columnId: string, newTitle: string) => {
    try {
      await api.patch(`/columns/${columnId}`, { title: newTitle });
      onBoardUpdated();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update column');
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm('Are you sure you want to delete this column and all its tasks?')) return;
    try {
      await api.delete(`/columns/${columnId}`);
      onBoardUpdated();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete column');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden text-slate-100">
      {/* Top Board Toolbar */}
      <div className="glass-panel border-b border-white/10 px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 flex-shrink-0 backdrop-blur-xl">
        {/* Left: Title, Description, Role Badge */}
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">{board.title}</h1>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/10 border border-white/15 text-indigo-300 flex items-center space-x-1.5 shadow-inner">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>{board.userRole || 'MEMBER'}</span>
            </span>
          </div>
          {board.description && (
            <p className="text-xs text-slate-400 mt-1">{board.description}</p>
          )}
        </div>

        {/* Right: Search, Filters & Share */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input rounded-2xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none w-48 transition-all"
            />
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="glass-input rounded-2xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none transition-all"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="glass-input rounded-2xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none transition-all"
          >
            <option value="ALL">All Assignees</option>
            <option value="UNASSIGNED">Unassigned</option>
            {board.members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.user.name}
              </option>
            ))}
          </select>

          {/* Share Board Button */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-4 py-1.5 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-xs font-semibold border border-white/20 shadow-lg shadow-indigo-500/20 transition flex items-center space-x-1.5"
          >
            <Users className="w-3.5 h-3.5 text-indigo-200" />
            <span>Share ({board.members.length})</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Drag-and-Drop Area */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto p-6 flex space-x-6 items-start">
          {filteredColumns.map((column) => (
            <ColumnLane
              key={column.id}
              column={column}
              tasks={column.tasks}
              canEdit={canEdit}
              onAddTask={(colId) => {
                setActiveColumnIdForNewTask(colId);
                setSelectedTask(null);
                setIsTaskModalOpen(true);
              }}
              onEditTask={(task) => {
                setSelectedTask(task);
                setIsTaskModalOpen(true);
              }}
              onUpdateColumnTitle={handleUpdateColumnTitle}
              onDeleteColumn={handleDeleteColumn}
            />
          ))}

          {/* Add Column Section */}
          {canEdit && (
            <div className="flex-shrink-0 w-80">
              {isCreatingColumn ? (
                <form
                  onSubmit={handleCreateColumn}
                  className="glass-modal rounded-3xl p-4 border border-white/10 shadow-2xl space-y-3"
                >
                  <input
                    type="text"
                    placeholder="Column name (e.g. QA & Testing)"
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    autoFocus
                    className="glass-input w-full rounded-2xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      type="submit"
                      disabled={isSubmittingColumn || !newColumnTitle.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center space-x-1.5 border border-white/10"
                    >
                      {isSubmittingColumn ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>Add Column</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingColumn(false);
                        setNewColumnTitle('');
                      }}
                      className="px-3.5 py-2 text-xs text-slate-400 hover:text-white transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsCreatingColumn(true)}
                  className="w-full py-4 px-4 glass-panel hover:bg-white/10 border border-dashed border-white/15 hover:border-indigo-400/40 rounded-3xl text-xs font-semibold text-slate-300 hover:text-indigo-300 transition flex items-center justify-center space-x-2 shadow-xl"
                >
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>Add Another Column</span>
                </button>
              )}
            </div>
          )}
        </div>
      </DragDropContext>

      {/* Task Create / Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
          setActiveColumnIdForNewTask(null);
        }}
        columnId={activeColumnIdForNewTask || undefined}
        taskToEdit={selectedTask}
        boardMembers={board.members}
        canEdit={canEdit}
        onTaskSaved={onBoardUpdated}
      />

      {/* Share / Collaboration Modal */}
      <ShareBoardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        boardId={board.id}
        isOwner={board.isOwner ?? false}
        members={board.members}
        onMembersUpdated={onBoardUpdated}
      />
    </div>
  );
};
