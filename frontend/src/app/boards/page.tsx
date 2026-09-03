'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { CreateBoardModal } from '@/components/CreateBoardModal';
import { api } from '@/lib/api';
import { Board } from '@/types';
import {
  Plus,
  Layout,
  Users,
  Clock,
  Shield,
  Trash2,
  Loader2,
  FolderKanban,
  Share2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function BoardsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBoards = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await api.get<Board[]>('/boards');
      setBoards(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load boards');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        fetchBoards();
      }
    }
  }, [user, authLoading, router]);

  const handleDeleteBoard = async (e: React.MouseEvent, boardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/boards/${boardId}`);
      setBoards((prev) => prev.filter((b) => b.id !== boardId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete board');
    }
  };

  if (authLoading || (!user && isLoading)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const myBoards = boards.filter((b) => b.isOwner);
  const sharedBoards = boards.filter((b) => !b.isOwner);

  const renderBoardCard = (board: Board) => (
    <Link
      key={board.id}
      href={`/boards/${board.id}`}
      className="group relative glass-card glass-card-hover rounded-3xl p-6 flex flex-col justify-between overflow-hidden border border-white/10"
    >
      {/* Subtle top glare line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between mb-4">
          <span
            className={`px-3 py-1 text-[11px] font-semibold rounded-full border flex items-center space-x-1 backdrop-blur-md ${
              board.userRole === 'OWNER'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                : board.userRole === 'EDITOR'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span>{board.userRole || 'MEMBER'}</span>
          </span>

          {board.isOwner && (
            <button
              onClick={(e) => handleDeleteBoard(e, board.id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-xl transition"
              title="Delete board"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold text-white group-hover:text-indigo-200 transition line-clamp-1 tracking-tight">
          {board.title}
        </h3>
        <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 min-h-[2.25rem] leading-relaxed">
          {board.description || 'No description provided.'}
        </p>
      </div>

      {/* Card Footer */}
      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5" title="Columns">
            <Layout className="w-3.5 h-3.5 text-indigo-400" />
            <span>{board._count?.columns ?? 0} cols</span>
          </div>
          <div className="flex items-center space-x-1.5" title="Collaborators">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>{board.members?.length ?? 1}</span>
          </div>
        </div>

        <div className="flex items-center space-x-1 text-[11px] text-slate-500">
          <Clock className="w-3 h-3" />
          <span>{formatDistanceToNow(new Date(board.updatedAt), { addSuffix: true })}</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-white/10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Workspaces & Boards</h1>
            <p className="text-sm text-slate-400 mt-1">
              Select a Kanban board or create a new collaborative workflow
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-sm font-semibold shadow-xl shadow-indigo-600/25 transition flex items-center space-x-2 border border-white/10 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Board</span>
          </button>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm rounded-xl">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-400">Loading your boards...</p>
          </div>
        ) : boards.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-slate-500">
              <FolderKanban className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-white">No boards yet</h3>
            <p className="text-sm text-slate-400 max-w-sm mt-1 mb-6">
              Create your first Kanban board to start organizing tasks and collaborating.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-md transition flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Board</span>
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {/* Section 1: My Boards */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FolderKanban className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                  My Boards ({myBoards.length})
                </h2>
              </div>
              {myBoards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {myBoards.map(renderBoardCard)}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">You have not created any boards yet.</p>
              )}
            </div>

            {/* Section 2: Shared With Me */}
            {sharedBoards.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                    Shared with Me ({sharedBoards.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sharedBoards.map(renderBoardCard)}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create Board Modal */}
      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onBoardCreated={(newBoard) => {
          router.push(`/boards/${newBoard.id}`);
        }}
      />
    </div>
  );
}
