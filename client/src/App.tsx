import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/admin/login";
import AdminLayout from "@/pages/admin/layout";
import DashboardPage from "@/pages/admin/dashboard";
import BookingsPage from "@/pages/admin/bookings";
import POSPage from "@/pages/admin/pos";
import ServicesPage from "@/pages/admin/services-page";
import BarbersPage from "@/pages/admin/barbers";
import ProductsPage from "@/pages/admin/products";
import ExpensesPage from "@/pages/admin/expenses";
import ReportsPage from "@/pages/admin/reports";
import GalleryPage from "@/pages/admin/gallery-page";
import StaffPage from "@/pages/admin/staff";
import BarberProfilePage from "@/pages/admin/barber-profile";
import SettingsPage from "@/pages/admin/settings";
import PermissionsPage from "@/pages/admin/permissions";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

function FaviconSync() {
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  useEffect(() => {
    const url = settings?.favicon_url;
    if (url) {
      const link = document.querySelector<HTMLLinkElement>("link[rel='icon']") || document.createElement("link");
      link.rel = "icon";
      link.href = url;
      document.head.appendChild(link);
    }
  }, [settings]);
  return null;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#000" }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 animate-spin mx-auto mb-4" style={{ borderColor: "#c09748", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "#c09748" }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}

function AdminBarberProfileRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/admin/login");
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) return null;
  if (!isAuthenticated) return null;

  return <AdminLayout><BarberProfilePage /></AdminLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/admin/login" component={LoginPage} />
      <Route path="/admin">{() => <AdminRoute component={DashboardPage} />}</Route>
      <Route path="/admin/bookings">{() => <AdminRoute component={BookingsPage} />}</Route>
      <Route path="/admin/pos">{() => <AdminRoute component={POSPage} />}</Route>
      <Route path="/admin/services">{() => <AdminRoute component={ServicesPage} />}</Route>
      <Route path="/admin/barbers">{() => <AdminRoute component={BarbersPage} />}</Route>
      <Route path="/admin/barbers/:id">{() => <AdminBarberProfileRoute />}</Route>
      <Route path="/admin/products">{() => <AdminRoute component={ProductsPage} />}</Route>
      <Route path="/admin/expenses">{() => <AdminRoute component={ExpensesPage} />}</Route>
      <Route path="/admin/reports">{() => <AdminRoute component={ReportsPage} />}</Route>
      <Route path="/admin/gallery">{() => <AdminRoute component={GalleryPage} />}</Route>
      <Route path="/admin/staff">{() => <AdminRoute component={StaffPage} />}</Route>
      <Route path="/admin/settings">{() => <AdminRoute component={SettingsPage} />}</Route>
      <Route path="/admin/permissions">{() => <AdminRoute component={PermissionsPage} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <FaviconSync />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
