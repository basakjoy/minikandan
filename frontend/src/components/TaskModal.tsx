'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { BoardMember, Task, TaskPriority } from '@/types';
import {
  X,
  Calendar,
  AlertCircle,
  User as UserIcon,
  Trash2,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnId?: string;
  taskToEdit?: Task | null;
  boardMembers: BoardMember[];
  canEdit: boolean;
  onTaskSaved: () => void;
  onTaskDeleted?: (taskId: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  columnId,
  taskToEdit,
  boardMembers,
  canEdit,
  onTaskSaved,
  onTaskDeleted,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority);
      setDueDate(taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().slice(0, 10) : '');
      setAssigneeId(taskToEdit.assigneeId || '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setDueDate('');
      setAssigneeId('');
    }
    setError(null);
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        assigneeId: assigneeId || undefined,
      };

      if (taskToEdit) {
        await api.patch(`/tasks/${taskToEdit.id}`, payload);
      } else if (columnId) {
        await api.post(`/columns/${columnId}/tasks`, payload);
      }

      onTaskSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!taskToEdit) return;
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await api.delete(`/tasks/${taskToEdit.id}`);
      if (onTaskDeleted) {
        onTaskDeleted(taskToEdit.id);
      }
      onTaskSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'LOW', label: 'Low', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    { value: 'HIGH', label: 'High', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    { value: 'URGENT', label: 'Urgent', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="glass-modal rounded-3xl w-full max-w-lg p-7 border border-white/15 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {taskToEdit ? (canEdit ? 'Edit Task' : 'Task Details') : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-2xl flex items-center space-x-2 backdrop-blur-md">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              disabled={!canEdit}
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition disabled:opacity-60"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              rows={3}
              disabled={!canEdit}
              placeholder="Add more context, acceptance criteria, or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-input w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition disabled:opacity-60 resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {priorityOptions.map((opt) => {
                const isSelected = priority === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => setPriority(opt.value)}
                    className={`py-2 px-2.5 text-xs font-semibold rounded-2xl border text-center transition ${
                      isSelected
                        ? `${opt.color} ring-2 ring-indigo-500/60 shadow-md`
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assignee & Due Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <UserIcon className="w-3.5 h-3.5" />
                <span>Assignee</span>
              </label>
              <select
                disabled={!canEdit}
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="glass-input w-full rounded-2xl px-3.5 py-3 text-sm text-slate-200 focus:outline-none transition disabled:opacity-60"
              >
                <option value="">Unassigned</option>
                {boardMembers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.name} ({m.role.toLowerCase()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Due Date</span>
              </label>
              <input
                type="date"
                disabled={!canEdit}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="glass-input w-full rounded-2xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none transition disabled:opacity-60"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-between border-t border-white/10">
            {taskToEdit && canEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-xl transition flex items-center space-x-1.5 text-xs font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Task</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition"
              >
                {canEdit ? 'Cancel' : 'Close'}
              </button>
              {canEdit && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white rounded-2xl shadow-xl shadow-indigo-600/30 transition flex items-center space-x-2 border border-white/10"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{taskToEdit ? 'Save Changes' : 'Create Task'}</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
