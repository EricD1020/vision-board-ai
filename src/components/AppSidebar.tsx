import { LayoutDashboard, LogOut, CheckSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function AppSidebar() {
  const { user, signOut } = useAuth();

  return (
    <aside className="w-64 min-h-screen bg-sidebar flex flex-col shrink-0">
      <div className="p-6">
        <h1 className="text-xl font-display font-bold text-sidebar-foreground tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          TaskFlow
        </h1>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        <a
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground text-sm font-medium transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" />
          Board
        </a>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        {user && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold text-sidebar-accent-foreground">
              {user.email?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-sidebar-foreground truncate">{user.email}</p>
            </div>
            <button
              onClick={signOut}
              className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
