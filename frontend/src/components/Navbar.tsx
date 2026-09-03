'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Kanban, LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  boardTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ boardTitle }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-white/10 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center space-x-6">
          <Link href="/boards" className="flex items-center space-x-2.5 font-bold text-lg tracking-tight hover:opacity-90 transition">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/20">
              <Kanban className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent font-bold tracking-tight">
              MiniKanban
            </span>
          </Link>

          {boardTitle && (
            <div className="hidden md:flex items-center space-x-2 text-sm">
              <span className="text-slate-600">/</span>
              <Link href="/boards" className="text-slate-400 hover:text-slate-200 transition flex items-center space-x-1">
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Boards</span>
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-slate-200 font-medium max-w-xs truncate">{boardTitle}</span>
            </div>
          )}
        </div>

        {/* Right: User profile & Logout */}
        {user ? (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2.5 bg-white/5 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white text-xs font-bold flex items-center justify-center border border-white/20">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-xs">
                <span className="font-semibold text-slate-100 block leading-tight">{user.name}</span>
                <span className="text-slate-400 text-[10px] block leading-none">{user.email}</span>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-xl transition"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white px-3.5 py-1.5 rounded-xl hover:bg-white/10 transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-4 py-1.5 rounded-xl shadow-lg shadow-indigo-600/25 transition border border-white/10"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
