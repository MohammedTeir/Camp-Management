import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Home,
  Baby,
  Users,
  Settings,
  LogOut,
  LayoutDashboard,
  Tent,
  Menu,
  X,
  LogIn,
  Globe // Added Globe icon
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const direction = 'rtl'; // Default to RTL for Arabic

  const NavLink = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const isActive = location === href;
    return (
      <Link href={href}>
        <div
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer
            ${isActive
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-semibold"
              : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
            }
          `}
          onClick={() => setIsMobileOpen(false)}
        >
          <Icon className="w-5 h-5" />
          <span>{label}</span>
        </div>
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3 mb-2"> {/* Added mb-2 for spacing */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-lg">
            F
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight">نظام إدارة المخيم</h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <NavLink href="/" icon={Home} label="الرئيسية" />
        <div className="my-4 border-t border-border/50" />

        {user ? (
          <>
            <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">المسؤول</p>
            <NavLink href="/dashboard" icon={LayoutDashboard} label="لوحة التحكم" />
            <NavLink href="/children" icon={Baby} label="سجلات الأطفال" />
            <NavLink href="/pregnant-women" icon={Users} label="سجلات الأمهات" />
            <NavLink href="/camps" icon={Tent} label="إدارة المخيمات" />
            <div className="my-4 border-t border-border/50" />
            <NavLink href="/bulk-import" icon={Globe} label="استيراد جماعي" />
            <NavLink href="/bulk-export" icon={Globe} label="تصدير جماعي" />
            <div className="my-4 border-t border-border/50" />
            <NavLink href="/settings" icon={Settings} label="الإعدادات" />
          </>
        ) : (
          <>
            <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">عام</p>
            <NavLink href="/login" icon={LogIn} label="تسجيل دخول المشرف" />
          </>
        )}
      </nav>

      {user && (
        <div className="p-4 border-t border-border/50 bg-secondary/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {(user.firstName || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex" dir={direction}>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block w-72 bg-card ${direction === 'rtl' ? 'border-l border-border' : 'border-r border-border'} shadow-sm sticky top-0 h-screen z-30 ${direction === 'rtl' ? 'order-last' : ''}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side={direction === 'rtl' ? 'right' : 'left'} className="p-0 w-80">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <header className="lg:hidden h-16 bg-card border-b border-border flex items-center px-4 justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
              F
            </div>
            <span className="font-display font-bold">نظام إدارة المخيم</span>
          </div>
          <div className="flex items-center gap-2"> {/* Wrapper for menu icon */}
            <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)}>
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in-up">
          {children}
        </div>
      </main>
    </div>
  );
}
