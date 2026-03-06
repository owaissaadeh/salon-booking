import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger
} from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { Scissors, LayoutDashboard, CalendarCheck, Receipt, Settings2, Users, Package, BarChart3, Image, DollarSign, UserCog } from "lucide-react";

const menuItems = [
  { title: "لوحة التحكم", url: "/admin", icon: LayoutDashboard },
  { title: "الحجوزات", url: "/admin/bookings", icon: CalendarCheck },
  { title: "POS | نقطة البيع", url: "/admin/pos", icon: Receipt },
  { title: "الخدمات", url: "/admin/services", icon: Scissors },
  { title: "الحلاقون", url: "/admin/barbers", icon: Users },
  { title: "المنتجات", url: "/admin/products", icon: Package },
  { title: "المصاريف", url: "/admin/expenses", icon: DollarSign },
  { title: "التقارير", url: "/admin/reports", icon: BarChart3 },
  { title: "الصور", url: "/admin/gallery", icon: Image },
  { title: "الموظفون", url: "/admin/staff", icon: UserCog },
  { title: "الإعدادات", url: "/admin/settings", icon: Settings2 },
];

function AppSidebar() {
  const [location] = useLocation();
  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  const logoUrl = settings?.logo_url;

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="شعار" className="h-9 w-9 object-contain rounded-md" />
            ) : (
              <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
                <Scissors className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <div>
              <p className="font-black text-base leading-tight">عدنان باشا</p>
              <p className="text-xs text-muted-foreground">لوحة الإدارة</p>
            </div>
          </div>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>القائمة الرئيسية</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild data-active={location === item.url}>
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
      </SidebarContent>
    </Sidebar>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const style = { "--sidebar-width": "16rem", "--sidebar-width-icon": "3rem" };
  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full" style={{ direction: "rtl" }}>
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-3 p-3 border-b bg-background sticky top-0 z-30">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <Link href="/" className="text-xs text-muted-foreground">← العودة للموقع</Link>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
