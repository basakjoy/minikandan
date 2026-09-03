'use client';

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task, TaskPriority } from '@/types';
import { Calendar, AlignLeft, Clock } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

interface TaskCardProps {
  task: Task;
  index: number;
  isDragDisabled?: boolean;
  onClick: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  index,
  isDragDisabled = false,
  onClick,
}) => {
  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Urgent
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
            High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Medium
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30">
            Low
          </span>
        );
    }
  };

  const getDueDateInfo = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const past = isPast(date) && !isToday(date);
    const today = isToday(date);

    return {
      text: format(date, 'MMM d'),
      isPast: past,
      isToday: today,
    };
  };

  const dueInfo = getDueDateInfo(task.dueDate);

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`group relative glass-card glass-card-hover rounded-2xl p-4 mb-3 cursor-grab active:cursor-grabbing select-none overflow-hidden ${
            snapshot.isDragging
              ? 'ring-2 ring-indigo-400/80 shadow-2xl bg-slate-900/90 rotate-2 scale-[1.03] z-50 border-indigo-500/50'
              : ''
          }`}
        >
          {/* Subtle liquid glass inner highlight line */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {/* Top row: Priority badge */}
          <div className="flex items-center justify-between mb-2.5">
            <div>{getPriorityBadge(task.priority)}</div>
            {task.description && (
              <AlignLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-300 transition" />
            )}
          </div>

          {/* Title */}
          <h4 className="text-sm font-medium text-slate-100 group-hover:text-white leading-snug line-clamp-2 tracking-tight">
            {task.title}
          </h4>

          {/* Bottom metadata row */}
          <div className="mt-3.5 pt-2.5 border-t border-white/5 flex items-center justify-between">
            {/* Due date */}
            {dueInfo ? (
              <div
                className={`flex items-center space-x-1.5 text-[11px] font-medium px-2 py-0.5 rounded-lg backdrop-blur-sm border ${
                  dueInfo.isPast
                    ? 'text-rose-300 bg-rose-500/10 border-rose-500/20'
                    : dueInfo.isToday
                    ? 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                    : 'text-slate-300 bg-white/5 border-white/10'
                }`}
              >
                {dueInfo.isPast ? (
                  <Clock className="w-3 h-3" />
                ) : (
                  <Calendar className="w-3 h-3" />
                )}
                <span>{dueInfo.text}</span>
              </div>
            ) : (
              <div />
            )}

            {/* Assignee Avatar */}
            {task.assignee ? (
              <div
                className="flex items-center space-x-1.5"
                title={`Assigned to ${task.assignee.name}`}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white text-[11px] font-bold flex items-center justify-center border border-white/20 shadow-sm">
                  {task.assignee.name.charAt(0).toUpperCase()}
                </div>
              </div>
            ) : (
              <span className="text-[10px] text-slate-500 italic">Unassigned</span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};
