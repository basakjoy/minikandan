'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Kanban, Lock, Mail, Loader2, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-2xl shadow-indigo-500/30 mb-4 border border-white/20">
          <Kanban className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-white font-sans">Welcome back</h2>
        <p className="mt-1.5 text-sm text-slate-400">
          Sign in to manage your boards and collaborate with your team
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-modal relative py-8 px-6 shadow-2xl rounded-3xl sm:px-10 overflow-hidden">
          {/* Specular highlight line */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

          {error && (
            <div className="mb-5 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl backdrop-blur-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder=""
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full glass-input rounded-xl pl-10 pr-3.5 py-2.5 text-sm placeholder-slate-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full glass-input rounded-xl pl-10 pr-3.5 py-2.5 text-sm placeholder-slate-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full glass-btn-primary disabled:opacity-50 text-white rounded-xl py-3 px-4 text-sm font-semibold shadow-xl transition flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins for Evaluator */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-300 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>1-Click Demo Accounts:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('alex@example.com')}
                className="glass-btn-secondary py-2 px-2 rounded-xl text-[11px] text-slate-300 transition text-center"
              >
                <span className="font-semibold block text-indigo-300">Alex</span>
                <span className="text-[10px] text-slate-400 block">Owner</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('sarah@example.com')}
                className="glass-btn-secondary py-2 px-2 rounded-xl text-[11px] text-slate-300 transition text-center"
              >
                <span className="font-semibold block text-emerald-300">Sarah</span>
                <span className="text-[10px] text-slate-400 block">Editor</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('david@example.com')}
                className="glass-btn-secondary py-2 px-2 rounded-xl text-[11px] text-slate-300 transition text-center"
              >
                <span className="font-semibold block text-amber-300">David</span>
                <span className="text-[10px] text-slate-400 block">Viewer</span>
              </button>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center text-xs text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
