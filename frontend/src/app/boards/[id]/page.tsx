'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { KanbanBoard } from '@/components/KanbanBoard';
import { api } from '@/lib/api';
import { Board } from '@/types';
import { Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface BoardPageProps {
  params: Promise<{ id: string }>;
}

export default function BoardDetailPage({ params }: BoardPageProps) {
  const { id: boardId } = use(params);

  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoardDetails = useCallback(async () => {
    try {
      setError(null);
      const { data } = await api.get<Board>(`/boards/${boardId}`);
      setBoard(data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('You do not have access permissions to view this board.');
      } else if (err.response?.status === 404) {
        setError('The requested board was not found.');
      } else {
        setError(err.response?.data?.message || 'Failed to load board details');
      }
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        fetchBoardDetails();
      }
    }
  }, [user, authLoading, router, fetchBoardDetails]);

  if (authLoading || (isLoading && !board)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading board workflow...</p>
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full glass-modal border border-white/10 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Access Restricted</h2>
            <p className="text-xs text-slate-400 mb-6">{error || 'Board not accessible'}</p>
            <Link
              href="/boards"
              className="inline-flex items-center space-x-2 px-4 py-2 glass-btn-primary text-white text-xs font-semibold rounded-xl shadow transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar boardTitle={board.title} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <KanbanBoard board={board} onBoardUpdated={fetchBoardDetails} />
      </main>
    </div>
  );
}
