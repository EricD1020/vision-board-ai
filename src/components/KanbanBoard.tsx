import { useState } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { KanbanColumn } from "./KanbanColumn";
import { AddTaskDialog } from "./AddTaskDialog";
import { useTasks } from "@/hooks/useTasks";
import { Loader2 } from "lucide-react";

const COLUMNS = ["todo", "in_progress"] as const;

export function KanbanBoard() {
  const { tasks, loading, addTask, deleteTask, moveTask } = useTasks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<string>("todo");

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    moveTask(draggableId, destination.droppableId, destination.index);
  };

  const openDialog = (status: string) => {
    setDialogStatus(status);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4 px-1">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasks
                .filter((t) => t.status === status)
                .sort((a, b) => a.position - b.position)}
              onDelete={deleteTask}
              onAddClick={() => openDialog(status)}
            />
          ))}
        </div>
      </DragDropContext>

      <AddTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultStatus={dialogStatus}
        onAdd={addTask}
        taskCount={tasks.filter((t) => t.status === dialogStatus).length}
      />
    </>
  );
}
