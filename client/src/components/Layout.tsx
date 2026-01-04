import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  CalendarDays, 
  Settings,
  Menu,
  X,
  Utensils,
  Package
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "予約管理", icon: CalendarDays },
    { href: "/tables", label: "テーブル管理", icon: Utensils },
    { href: "/inventory", label: "在庫（剩余）", icon: Package },
    { href: "/settings", label: "システム設定", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Header with Hamburger Menu */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">预约系统</h1>
        
        {/* Hamburger Menu */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-lg">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <SheetHeader>
              <SheetTitle>メニュー</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 space-y-2">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <div 
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer",
                        isActive 
                          ? "bg-orange-50 text-orange-600 font-medium" 
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </nav>
            
            {/* User Info */}
            <div className="absolute bottom-6 left-4 right-4">
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-lg">
                <div className="w-10 h-10 bg-blue-500 text-white flex items-center justify-center font-bold rounded-full">
                  A
                </div>
                <div>
                  <div className="font-medium text-sm">管理员</div>
                  <div className="text-xs text-gray-500">在线</div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Full Width Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
