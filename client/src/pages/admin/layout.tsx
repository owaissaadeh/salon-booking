import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Scissors, LayoutDashboard, CalendarCheck, Receipt, Settings2,
  Users, Package, BarChart3, Image, DollarSign, UserCog, LogOut,
  ShieldCheck, PanelLeft, ExternalLink
} from "lucide-react";

const EXPANDED_W = 240;
const COLLAPSED_W = 64;

const ALL_MENU = [
  { title: "لوحة التحكم", url: "/admin", icon: LayoutDashboard, permKey: "dashboard" },
  { title: "الحجوزات", url: "/admin/bookings", icon: CalendarCheck, permKey: "bookings" },
  { title: "نقطة البيع", url: "/admin/pos", icon: Receipt, permKey: "pos" },
  { title: "الخدمات", url: "/admin/services", icon: Scissors, permKey: "services" },
  { title: "الحلاقون", url: "/admin/barbers", icon: Users, permKey: "barbers" },
  { title: "المنتجات", url: "/admin/products", icon: Package, permKey: "products" },
  { title: "المصاريف", url: "/admin/expenses", icon: DollarSign, permKey: "expenses" },
  { title: "التقارير", url: "/admin/reports", icon: BarChart3, permKey: "reports" },
  { title: "الصور", url: "/admin/gallery", icon: Image, permKey: "gallery" },
  { title: "الموظفون", url: "/admin/staff", icon: UserCog, permKey: "staff" },
];

const ADMIN_MENU = [
  { title: "الصلاحيات", url: "/admin/permissions", icon: ShieldCheck, permKey: "permissions" },
  { title: "الإعدادات", url: "/admin/settings", icon: Settings2, permKey: "settings" },
];

function SidebarNav({ open }: { open: boolean }) {
  const [location] = useLocation();
  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  const { user, logout } = useAuth();

  let rolePerms: Record<string, string[]> = {};
  try { if (settings?.role_permissions) rolePerms = JSON.parse(settings.role_permissions); } catch {}

  const canAccess = (permKey: string) => {
    if (!user) return true;
    if (user.role === "admin") return true;
    return (rolePerms[user.role ?? ""] ?? []).includes(permKey);
  };

  const isAdmin = !user || user.role === "admin";
  const visibleMenu = ALL_MENU.filter(item => canAccess(item.permKey));
  const adminMenu = isAdmin ? ADMIN_MENU : [];
  const logoUrl = settings?.logo_url;
  const showText = settings?.logo_show_text !== "false";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 border-b shrink-0 overflow-hidden"
        style={{ height: 56, borderColor: "hsl(var(--sidebar-border))" }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="شعار" className="h-8 w-8 object-contain rounded-lg shrink-0" />
        ) : (
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "hsl(var(--primary))" }}>
            <Scissors className="w-4 h-4 text-black" />
          </div>
        )}
        {open && (
          <div className="overflow-hidden">
            {showText && <p className="font-black text-sm truncate leading-tight" style={{ color: "hsl(var(--sidebar-foreground))" }}>عدنان باشا</p>}
            {user && <p className="text-xs truncate" style={{ color: "hsl(var(--muted-foreground))" }}>{user.name}</p>}
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
        {visibleMenu.map(item => {
          const active = location === item.url;
          return (
            <Link key={item.url} href={item.url}>
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 group relative"
                style={{
                  background: active ? "hsl(var(--sidebar-accent))" : "transparent",
                  color: active ? "hsl(var(--sidebar-accent-foreground))" : "hsl(var(--muted-foreground))",
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "hsl(var(--sidebar-accent))"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                data-testid={`nav-${item.permKey}`}
              >
                <item.icon className="w-4 h-4 shrink-0" style={{ color: active ? "hsl(var(--primary))" : undefined }} />
                {open && <span className="text-sm font-medium truncate">{item.title}</span>}
                {!open && (
                  <div className="absolute left-full ml-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none"
                    style={{ background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))", border: "1px solid hsl(var(--border))" }}>
                    {item.title}
                  </div>
                )}
              </div>
            </Link>
          );
        })}

        {adminMenu.length > 0 && (
          <>
            <div className="mx-3 my-2" style={{ height: 1, background: "hsl(var(--sidebar-border))" }} />
            {adminMenu.map(item => {
              const active = location === item.url;
              return (
                <Link key={item.url} href={item.url}>
                  <div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 group relative"
                    style={{
                      background: active ? "hsl(var(--sidebar-accent))" : "transparent",
                      color: active ? "hsl(var(--sidebar-accent-foreground))" : "hsl(var(--muted-foreground))",
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "hsl(var(--sidebar-accent))"; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    data-testid={`nav-${item.permKey}`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" style={{ color: active ? "hsl(var(--primary))" : undefined }} />
                    {open && <span className="text-sm font-medium truncate">{item.title}</span>}
                    {!open && (
                      <div className="absolute left-full ml-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none"
                        style={{ background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))", border: "1px solid hsl(var(--border))" }}>
                        {item.title}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="shrink-0 p-2 border-t" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 group relative"
          style={{ color: "hsl(var(--muted-foreground))" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "hsl(var(--sidebar-accent))"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
          onClick={() => logout()}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {open && <span className="text-sm font-medium">تسجيل خروج</span>}
          {!open && (
            <div className="absolute left-full ml-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none"
              style={{ background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))", border: "1px solid hsl(var(--border))" }}>
              تسجيل خروج
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const w = open ? EXPANDED_W : COLLAPSED_W;

  return (
    <div className="flex min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <aside
        className="fixed inset-y-0 left-0 z-40 flex flex-col border-r"
        style={{
          width: w,
          minWidth: w,
          background: "hsl(var(--sidebar))",
          borderColor: "hsl(var(--sidebar-border))",
          transition: "width 200ms ease, min-width 200ms ease",
        }}
      >
        <SidebarNav open={open} />
      </aside>

      <div
        className="flex flex-col min-h-screen flex-1"
        style={{
          marginLeft: w,
          transition: "margin-left 200ms ease",
        }}
      >
        <header
          className="sticky top-0 z-30 flex items-center gap-3 px-4 border-b"
          style={{ height: 56, background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
          dir="rtl"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(!open)}
            className="h-8 w-8 shrink-0"
            data-testid="button-sidebar-toggle"
          >
            <PanelLeft className="w-4 h-4" />
          </Button>
          <div className="h-4 w-px" style={{ background: "hsl(var(--border))" }} />
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs transition-colors"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            <ExternalLink className="w-3 h-3" />
            الموقع الرئيسي
          </a>
        </header>

        <main
          className="flex-1 p-4 md:p-6 overflow-auto"
          dir="rtl"
          style={{ minHeight: "calc(100vh - 56px)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
