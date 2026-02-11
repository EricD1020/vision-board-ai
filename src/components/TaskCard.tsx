import { Calendar, Trash2, User } from "lucide-react";
import type { Task } from "@/types/task";
import { Draggable } from "@hello-pangea/dnd";

const priorityStyles: Record<string, string> = {
  low: "bg-priority-low-bg text-priority-low",
  medium: "bg-priority-medium-bg text-priority-medium",
  high: "bg-priority-high-bg text-priority-high",
};

interface TaskCardProps {
  task: Task;
  index: number;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, index, onDelete }: TaskCardProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`group bg-card rounded-lg border p-4 shadow-sm transition-all animate-slide-up ${
            snapshot.isDragging ? "shadow-lg ring-2 ring-primary/30 rotate-1" : "hover:shadow-md"
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                priorityStyles[task.priority] || priorityStyles.medium
              }`}
            >
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
            <button
              onClick={() => onDelete(task.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <h3 className="font-semibold text-sm text-card-foreground mb-1 leading-snug">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {task.assignee && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {task.assignee}
              </span>
            )}
            {task.due_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(task.due_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
