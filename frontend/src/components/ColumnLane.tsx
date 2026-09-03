'use client';

import React, { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Column, Task } from '@/types';
import { TaskCard } from './TaskCard';
import { Plus, MoreHorizontal, Edit2, Trash2, Check, X } from 'lucide-react';

interface ColumnLaneProps {
  column: Column;
  tasks: Task[];
  canEdit: boolean;
  onAddTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onUpdateColumnTitle: (columnId: string, newTitle: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

export const ColumnLane: React.FC<ColumnLaneProps> = ({
  column,
  tasks,
  canEdit,
  onAddTask,
  onEditTask,
  onUpdateColumnTitle,
  onDeleteColumn,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleInput.trim() && titleInput !== column.title) {
      onUpdateColumnTitle(column.id, titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="flex-shrink-0 w-80 glass-panel rounded-3xl flex flex-col max-h-full overflow-hidden border border-white/10 shadow-2xl">
      {/* Column Header */}
      <div className="p-4 pb-3 flex items-center justify-between border-b border-white/5 bg-black/60 backdrop-blur-md">
        {isEditingTitle ? (
          <form onSubmit={handleTitleSubmit} className="flex items-center space-x-1 flex-1 mr-2">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              autoFocus
              className="w-full glass-input rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none"
            />
            <button
              type="submit"
              className="p-1 text-emerald-400 hover:bg-white/10 rounded-lg transition"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setTitleInput(column.title);
                setIsEditingTitle(false);
              }}
              className="p-1 text-slate-400 hover:bg-white/10 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="flex items-center space-x-2.5 min-w-0">
            <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase truncate">
              {column.title}
            </h3>
            <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-white/10 text-indigo-300 rounded-full border border-white/10 shadow-inner">
              {tasks.length}
            </span>
          </div>
        )}

        {/* Action Menu */}
        {canEdit && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-44 glass-modal rounded-2xl shadow-2xl z-30 py-1.5 border border-white/10">
                  <button
                    onClick={() => {
                      setIsEditingTitle(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:bg-white/10 hover:text-white flex items-center space-x-2 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Rename Column</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDeleteColumn(column.id);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Column</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Droppable Task Area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-3.5 overflow-y-auto min-h-[150px] transition-all ${
              snapshot.isDraggingOver ? 'bg-indigo-500/10 border-indigo-500/20' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                isDragDisabled={!canEdit}
                onClick={() => onEditTask(task)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add Task Button */}
      {canEdit && (
        <div className="p-3 pt-0 bg-black/40 backdrop-blur-sm">
          <button
            onClick={() => onAddTask(column.id)}
            className="w-full py-2.5 px-3 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-dashed border-white/15 hover:border-indigo-400/40 rounded-2xl transition flex items-center justify-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Add Task</span>
          </button>
        </div>
      )}
    </div>
  );
};
