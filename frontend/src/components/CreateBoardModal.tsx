'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Board } from '@/types';
import { Plus, X, Loader2 } from 'lucide-react';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBoardCreated: (board: Board) => void;
}

export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({
  isOpen,
  onClose,
  onBoardCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Board title is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const { data } = await api.post<Board>('/boards', {
        title: title.trim(),
        description: description.trim() || undefined,
      });

      setTitle('');
      setDescription('');
      onBoardCreated(data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create board');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="glass-modal rounded-3xl w-full max-w-md p-7 border border-white/15 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
              <Plus className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Create New Board</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-2xl backdrop-blur-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Board Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mobile App Redesign"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Brief description of the board purpose..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-input w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white rounded-2xl shadow-xl shadow-indigo-600/30 transition flex items-center space-x-2 border border-white/10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Board</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
