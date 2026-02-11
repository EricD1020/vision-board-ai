import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/AppSidebar";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ChatBubble } from "@/components/ChatBubble";
import { Search } from "lucide-react";
import Auth from "./Auth";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />

      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="px-8 py-6 border-b flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Kanban Board</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage and track your tasks visually
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tasks..."
                className="bg-muted rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all w-60"
              />
            </div>
          </div>
        </header>

        {/* Board */}
        <div className="flex-1 overflow-auto p-8">
          <KanbanBoard />
        </div>
      </main>

      <ChatBubble />
    </div>
  );
};

export default Index;
