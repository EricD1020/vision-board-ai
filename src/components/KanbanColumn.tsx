import { Plus } from "lucide-react";
import { Droppable } from "@hello-pangea/dnd";
import type { Task } from "@/types/task";
import { TaskCard } from "./TaskCard";

const columnMeta: Record<string, { label: string; colorClass: string; dotClass: string }> = {
  todo: { label: "To Do", colorClass: "bg-column-todo", dotClass: "bg-column-todo" },
  in_progress: { label: "In Progress", colorClass: "bg-column-progress", dotClass: "bg-column-progress" },
};

interface KanbanColumnProps {
  status: string;
  tasks: Task[];
  onDelete: (id: string) => void;
  onAddClick: () => void;
}

export function KanbanColumn({ status, tasks, onDelete, onAddClick }: KanbanColumnProps) {
  const meta = columnMeta[status] || columnMeta.todo;

  return (
    <div className="flex-1 min-w-[320px] max-w-[420px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${meta.dotClass}`} />
          <h2 className="font-display font-semibold text-foreground">{meta.label}</h2>
          <span className="text-xs font-semibold bg-muted text-muted-foreground rounded-full px-2 py-0.5">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAddClick}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-3 min-h-[200px] p-2 rounded-xl transition-colors ${
              snapshot.isDraggingOver ? "bg-accent/50" : ""
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} onDelete={onDelete} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
