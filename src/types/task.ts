export type Priority = "low" | "medium" | "high";
export type Status = "todo" | "in_progress";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  assignee: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}
