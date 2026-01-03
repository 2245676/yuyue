import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  ListTodo, 
  CalendarDays, 
  Activity, 
  Settings,
  Menu,
  X,
  Utensils
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "仪表板", icon: LayoutDashboard },
    { href: "/tables", label: "桌位管理", icon: Utensils },
    { href: "/features", label: "功能清单", icon: ListTodo },
    { href: "/roadmap", label: "开发路线", icon: CalendarDays },
    { href: "/status", label: "系统状态", icon: Activity },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background font-mono">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b-2 border-border bg-card z-50 sticky top-0">
        <div className="font-black text-xl tracking-tighter">项目追踪系统</div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="border-2 border-border rounded-none active:translate-y-1"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r-2 border-border transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen overflow-y-auto",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b-2 border-border hidden md:block">
          <div className="font-black text-2xl tracking-tighter">项目追踪系统</div>
          <div className="text-xs text-muted-foreground mt-1">系统版本_V.1.0.0</div>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-4 py-3 border-2 transition-all cursor-pointer font-bold text-sm",
                  isActive 
                    ? "bg-accent text-accent-foreground border-border shadow-[4px_4px_0px_0px_var(--color-border)] translate-x-[-2px] translate-y-[-2px]" 
                    : "bg-transparent border-transparent hover:bg-muted hover:border-border hover:shadow-[2px_2px_0px_0px_var(--color-border)]"
                )}>
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t-2 border-border bg-sidebar">
          <div className="flex items-center gap-3 px-4 py-3 border-2 border-border bg-card">
            <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center font-bold border border-border">
              A
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-sm truncate">管理员</div>
              <div className="text-xs text-muted-foreground truncate">在线</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
