import { Link, useLocation } from "wouter";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarInset, SidebarTrigger
} from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Scissors, LayoutDashboard, CalendarCheck, Receipt, Settings2,
  Users, Package, BarChart3, Image, DollarSign, UserCog, LogOut, ShieldCheck
} from "lucide-react";

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

const ADMIN_ONLY_MENU = [
  { title: "الصلاحيات", url: "/admin/permissions", icon: ShieldCheck, permKey: "permissions" },
  { title: "الإعدادات", url: "/admin/settings", icon: Settings2, permKey: "settings" },
];

function AppSidebar() {
  const [location] = useLocation();
  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  const { user, logout } = useAuth();
  const logoUrl = settings?.logo_url;
  const showText = settings?.logo_show_text !== "false";

  let rolePerms: Record<string, string[]> = {};
  try {
    if (settings?.role_permissions) rolePerms = JSON.parse(settings.role_permissions);
  } catch {}

  const isAdmin = user?.role === "admin";

  const canAccess = (permKey: string) => {
    if (isAdmin) return true;
    const perms = rolePerms[user?.role ?? ""] ?? [];
    return perms.includes(permKey);
  };

  const visibleMenu = ALL_MENU.filter(item => canAccess(item.permKey));
  const adminMenu = isAdmin ? ADMIN_ONLY_MENU : [];

  return (
    <Sidebar collapsible="icon" side="right">
      <SidebarContent>
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="شعار" className="h-9 w-9 object-contain rounded-md flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
                <Scissors className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
              {showText && <p className="font-black text-base leading-tight truncate">عدنان باشا</p>}
              {user && <p className="text-xs text-muted-foreground truncate">{user.name}</p>}
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>القائمة الرئيسية</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenu.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {adminMenu.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>الإدارة</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminMenu.map(item => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url} tooltip={item.title}>
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <div className="mt-auto p-3 border-t border-sidebar-border">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground"
            onClick={() => logout()} data-testid="button-logout">
            <LogOut className="w-4 h-4" />
            <span className="group-data-[collapsible=icon]:hidden">تسجيل خروج</span>
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ direction: "rtl" }}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex items-center gap-3 p-3 border-b bg-background sticky top-0 z-30 h-14">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="h-4 w-px bg-border" />
            <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              الموقع الرئيسي
            </Link>
          </header>
          <main className="flex-1 p-4 md:p-6 bg-background min-h-[calc(100vh-3.5rem)] overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
