'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { BoardMember, BoardRole, User } from '@/types';
import { Users, UserPlus, X, Trash2, Shield, Loader2, Check, Search } from 'lucide-react';

interface ShareBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  isOwner: boolean;
  members: BoardMember[];
  onMembersUpdated: () => void;
}

export const ShareBoardModal: React.FC<ShareBoardModalProps> = ({
  isOpen,
  onClose,
  boardId,
  isOwner,
  members,
  onMembersUpdated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Debounced user search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const { data } = await api.get<User[]>(`/users/search?q=${encodeURIComponent(searchQuery)}`);
        
        // Filter out users already in the board
        const existingMemberIds = new Set(members.map((m) => m.userId));
        const filtered = data.filter((u) => !existingMemberIds.has(u.id));
        setSearchResults(filtered);
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, members]);

  if (!isOpen) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setError('Please select a registered user to invite');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await api.post(`/boards/${boardId}/members`, {
        email: selectedUser.email,
        role: selectedRole,
      });

      setSuccessMessage(`Invited ${selectedUser.name} as ${selectedRole}`);
      setSelectedUser(null);
      setSearchQuery('');
      setSearchResults([]);
      onMembersUpdated();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to invite member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: 'EDITOR' | 'VIEWER') => {
    try {
      setError(null);
      await api.patch(`/boards/${boardId}/members/${targetUserId}`, { role: newRole });
      onMembersUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      setError(null);
      await api.delete(`/boards/${boardId}/members/${targetUserId}`);
      onMembersUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Board Collaboration</h2>
              <p className="text-xs text-slate-400">Manage member access and permissions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg flex items-center space-x-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Invite Form (Owner Only) */}
        {isOwner ? (
          <form onSubmit={handleInvite} className="mt-4 pb-4 border-b border-slate-800 space-y-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Invite Collaborator
            </label>
            <div className="relative">
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-indigo-500">
                <Search className="w-4 h-4 text-slate-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (selectedUser) setSelectedUser(null);
                  }}
                  className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm"
                />
                {isSearching && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
              </div>

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && !selectedUser && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                  {searchResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setSelectedUser(u);
                        setSearchQuery(`${u.name} (${u.email})`);
                        setSearchResults([]);
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-slate-800/80 transition flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-200">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                      <UserPlus className="w-4 h-4 text-indigo-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="EDITOR">Editor (Can edit columns & tasks)</option>
                <option value="VIEWER">Viewer (Read-only)</option>
              </select>

              <button
                type="submit"
                disabled={!selectedUser || isSubmitting}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-sm font-medium shadow-sm transition flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Invite</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-3 p-3 bg-slate-800/50 rounded-xl text-xs text-slate-400 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Only the board owner can invite or modify member permissions.</span>
          </div>
        )}

        {/* Member List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 pr-1">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Members ({members.length})
          </h3>

          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-indigo-600/80 text-white font-medium text-xs flex items-center justify-center flex-shrink-0">
                  {member.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{member.user.name}</p>
                  <p className="text-xs text-slate-400 truncate">{member.user.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {member.role === 'OWNER' ? (
                  <span className="px-2.5 py-1 text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md flex items-center space-x-1">
                    <Shield className="w-3 h-3 mr-1" /> Owner
                  </span>
                ) : isOwner ? (
                  <>
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.userId, e.target.value as any)}
                      className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="EDITOR">Editor</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.userId)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <span className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 text-slate-300 rounded-md">
                    {member.role === 'EDITOR' ? 'Editor' : 'Viewer'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
