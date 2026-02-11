import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Task } from "@/types/task";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("position", { ascending: true });

    if (error) {
      toast({ title: "Error loading tasks", description: error.message, variant: "destructive" });
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (task: Omit<Task, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("tasks")
      .insert({ ...task, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast({ title: "Error adding task", description: error.message, variant: "destructive" });
    } else if (data) {
      setTasks((prev) => [...prev, data]);
      toast({ title: "Task added!" });
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const { error } = await supabase.from("tasks").update(updates).eq("id", id);
    if (error) {
      toast({ title: "Error updating task", description: error.message, variant: "destructive" });
    } else {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    }
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting task", description: error.message, variant: "destructive" });
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast({ title: "Task deleted" });
    }
  };

  const moveTask = async (taskId: string, newStatus: string, newPosition: number) => {
    await updateTask(taskId, { status: newStatus, position: newPosition });
  };

  return { tasks, loading, addTask, updateTask, deleteTask, moveTask, fetchTasks };
}
